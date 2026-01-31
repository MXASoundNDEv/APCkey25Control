import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Paramètres du synthé.
 * @typedef {Object} SynthParams
 * @property {number} master Volume général (0-1).
 * @property {number} attack Temps d’attaque (s).
 * @property {number} decay Temps de decay (s).
 * @property {number} sustain Niveau de sustain (0-1).
 * @property {number} release Temps de release (s).
 * @property {number} vibratoFreq Fréquence du LFO (Hz).
 * @property {number} vibratoDepth Profondeur du vibrato (cents approx.).
 * @property {number} filterFreq Fréquence de coupure (Hz).
 * @property {number} filterQ Résonance du filtre.
 * @property {number} filterTracking Suivi de hauteur (0-1).
 * @property {number} harmonicMix Niveau de l’harmonique (0-1).
 * @property {number} harmonicTilt Atténuation en hauteur (0-1).
 * @property {('sine'|'square'|'sawtooth'|'triangle')} oscillatorType Forme d’onde.
 */

/**
 * Voix active du synthé.
 * @typedef {Object} SynthVoice
 * @property {number} note Numéro de note MIDI.
 * @property {OscillatorNode} oscillator Oscillateur principal.
 * @property {OscillatorNode} harmonicOsc Oscillateur harmonique (octave +1).
 * @property {GainNode} harmonicGain Gain de l’harmonique.
 * @property {OscillatorNode} vibratoOsc Oscillateur LFO.
 * @property {GainNode} vibratoGain Gain de modulation du LFO.
 * @property {GainNode} gainNode Enveloppe de gain (ADSR).
 * @property {BiquadFilterNode} filter Filtre passe‑bas.
 */

/**
 * API publique du hook useSynth.
 * @typedef {Object} UseSynthReturn
 * @property {SynthParams} params État courant des paramètres.
 * @property {(key: keyof SynthParams, value: SynthParams[keyof SynthParams]) => void} setParam
 * Met à jour un paramètre et resynchronise les voix actives.
 * @property {(note: number, velocity?: number, velocityScaling?: boolean) => void} noteOn
 * Démarre une note MIDI.
 * @property {(note: number) => void} noteOff
 * Relâche une note MIDI.
 * @property {AnalyserNode|null} analyser Analyseur audio pour l’oscilloscope.
 */

/**
 * Convertit un numéro de note MIDI en fréquence (Hz), avec La4 = 440 Hz.
 * @param {number} note Numéro de note MIDI (0-127).
 * @returns {number} Fréquence en Hz.
 */
const noteToFrequency = (note) => 440 * Math.pow(2, (note - 69) / 12);

/**
 * Valeurs par défaut du synthé. Toutes ces valeurs sont modifiables via `setParam`.
 * @type {SynthParams}
 */
const defaultParams = {
  master: 0.6,
  attack: 0.02,
  decay: 0.15,
  sustain: 0.75,
  release: 0.25,
  vibratoFreq: 5,
  vibratoDepth: 8,
  filterFreq: 9000,
  filterQ: 1.2,
  filterTracking: 0.4,
  harmonicMix: 0.35,
  harmonicTilt: 0.45,
  oscillatorType: 'sawtooth'
};

/**
 * Calcule le niveau de l'oscillateur harmonique en fonction de la hauteur.
 * L'objectif est d'avoir plus de brillance autour du Do central.
 * @param {number} note Numéro de note MIDI.
 * @param {SynthParams} params Paramètres du synthé.
 * @returns {number} Niveau de l'harmonique (0-1).
 */
const harmonicLevel = (note, params) => {
  const relative = (note - 60) / 24; // plus brillant autour du Do central
  const tilt = Math.max(0, 1 - params.harmonicTilt * relative);
  return Math.min(1, Math.max(0, params.harmonicMix * tilt));
};

/**
 * Suit la hauteur de la note pour adapter la fréquence de coupure du filtre.
 * @param {number} note Numéro de note MIDI.
 * @param {SynthParams} params Paramètres du synthé.
 * @returns {number} Fréquence de coupure en Hz.
 */
const trackedFilterFreq = (note, params) => {
  const base = params.filterFreq;
  const ratio = Math.pow(noteToFrequency(note) / 440, params.filterTracking);
  return Math.min(18000, Math.max(80, base * ratio));
};

/**
 * Hook principal du synthé : gère le moteur audio et l'état des paramètres.
 * @returns {UseSynthReturn} API publique du synthé.
 */
export function useSynth() {
  const [params, setParams] = useState(defaultParams);
  const audioCtxRef = useRef(null);
  const masterGainRef = useRef(null);
  const analyserRef = useRef(null);
  const voicesRef = useRef(new Map());

  // Initialisation du moteur audio au montage du composant.
  useEffect(() => {
    const ctx = new AudioContext();
    const masterGain = ctx.createGain();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;

    masterGain.connect(analyser);
    analyser.connect(ctx.destination);
    masterGain.gain.value = defaultParams.master;

    audioCtxRef.current = ctx;
    masterGainRef.current = masterGain;
    analyserRef.current = analyser;

    // Nettoyage complet à la destruction du hook.
    return () => {
      voicesRef.current.forEach((voice) => {
        voice.oscillator.stop();
        voice.vibratoOsc.stop();
      });
      masterGain.disconnect();
      analyser.disconnect();
      ctx.close();
    };
  }, []);

  // Met à jour le volume général quand `params.master` change.
  useEffect(() => {
    if (masterGainRef.current && audioCtxRef.current) {
      masterGainRef.current.gain.setValueAtTime(
        params.master,
        audioCtxRef.current.currentTime
      );
    }
  }, [params.master]);

  /**
   * Met à jour un paramètre du synthé (ex: `attack`, `filterFreq`, etc.).
   * @param {keyof SynthParams} key Nom du paramètre.
   * @param {SynthParams[keyof SynthParams]} value Valeur à appliquer.
   * @returns {void}
   */
  const setParam = useCallback((key, value) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  }, []);

  /**
   * Déclenche une note : crée une voix (oscillateurs + enveloppe + filtre + vibrato).
   * @param {number} note Numéro de note MIDI (0-127).
   * @param {number} [velocity=100] Vélocité MIDI (0-127).
   * @param {boolean} [velocityScaling=true] Si true, la vélocité module le gain.
   * @returns {void}
   */
  const noteOn = useCallback(
    (note, velocity = 100, velocityScaling = true) => {
      const ctx = audioCtxRef.current;
      if (!ctx || ctx.state === 'closed' || !masterGainRef.current) return;
      ctx.resume();

      const frequency = noteToFrequency(note);
      const osc = ctx.createOscillator();
      osc.type = params.oscillatorType;

      // Oscillateur harmonique (octave supérieure) pour enrichir le timbre.
      const harmonicOsc = ctx.createOscillator();
      harmonicOsc.type = 'triangle';
      harmonicOsc.frequency.value = frequency * 2;

      // Enveloppe d'amplitude + filtre passe-bas.
      const gainNode = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = trackedFilterFreq(note, params);
      filter.Q.value = params.filterQ;

      // Vibrato : un LFO qui module la fréquence des oscillateurs.
      const vibratoOsc = ctx.createOscillator();
      const vibratoGain = ctx.createGain();
      vibratoOsc.frequency.value = params.vibratoFreq;
      vibratoGain.gain.value = params.vibratoDepth;
      vibratoOsc.connect(vibratoGain);
      vibratoGain.connect(osc.frequency);
      vibratoGain.connect(harmonicOsc.frequency);

      // Mix oscillateurs -> enveloppe -> filtre -> master.
      osc.connect(gainNode);
      const harmonicGain = ctx.createGain();
      harmonicGain.gain.value = harmonicLevel(note, params);
      harmonicOsc.connect(harmonicGain);
      harmonicGain.connect(gainNode);
      gainNode.connect(filter);
      filter.connect(masterGainRef.current);

      // Enveloppe ADSR sur le gain de la voix.
      const now = ctx.currentTime;
      const target = (velocityScaling ? velocity / 127 : 1) * params.master;

      gainNode.gain.cancelScheduledValues(now);
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(target, now + params.attack);
      gainNode.gain.linearRampToValueAtTime(
        target * params.sustain,
        now + params.attack + params.decay
      );

      osc.frequency.value = frequency;
      osc.start(now);
      harmonicOsc.start(now);
      vibratoOsc.start(now);

      // Stocke la voix pour pouvoir la relâcher à `noteOff`.
      /** @type {SynthVoice} */
      const voice = {
        note,
        oscillator: osc,
        harmonicOsc,
        harmonicGain,
        vibratoOsc,
        vibratoGain,
        gainNode,
        filter
      };
      voicesRef.current.set(note, voice);
    },
    [params]
  );

  /**
   * Relâche une note en déclenchant la phase Release et en nettoyant la voix.
   * @param {number} note Numéro de note MIDI (0-127).
   * @returns {void}
   */
  const noteOff = useCallback(
    (note) => {
      /** @type {SynthVoice|undefined} */
      const voice = voicesRef.current.get(note);
      if (!voice) return;
      const ctx = audioCtxRef.current;
      if (!ctx || !masterGainRef.current) return;
      const now = ctx.currentTime;

      voice.gainNode.gain.cancelScheduledValues(now);
      voice.gainNode.gain.setValueAtTime(voice.gainNode.gain.value, now);
      voice.gainNode.gain.linearRampToValueAtTime(0, now + params.release);

      voice.oscillator.stop(now + params.release + 0.01);
      voice.harmonicOsc.stop(now + params.release + 0.01);
      voice.vibratoOsc.stop(now + params.release + 0.01);

      const disconnect = () => {
        voice.oscillator.disconnect();
        voice.harmonicOsc.disconnect();
        voice.harmonicGain.disconnect();
        voice.vibratoOsc.disconnect();
        voice.vibratoGain.disconnect();
        voice.gainNode.disconnect();
        voice.filter.disconnect();
      };

      voice.oscillator.onended = disconnect;
      voicesRef.current.delete(note);
    },
    [params.release]
  );

  // Synchronise les paramètres en temps réel sur toutes les voix actives.
  useEffect(() => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    voicesRef.current.forEach((voice) => {
      voice.oscillator.type = params.oscillatorType;
      voice.filter.frequency.setTargetAtTime(
        trackedFilterFreq(voice.note, params),
        ctx.currentTime,
        0.02
      );
      voice.filter.Q.setTargetAtTime(params.filterQ, ctx.currentTime, 0.02);
      voice.vibratoOsc.frequency.setTargetAtTime(params.vibratoFreq, ctx.currentTime, 0.02);
      voice.vibratoGain.gain.setTargetAtTime(params.vibratoDepth, ctx.currentTime, 0.02);
      voice.harmonicGain.gain.setTargetAtTime(
        harmonicLevel(voice.note, params),
        ctx.currentTime,
        0.02
      );
    });
  }, [
    params.oscillatorType,
    params.filterFreq,
    params.filterQ,
    params.vibratoFreq,
    params.vibratoDepth,
    params.harmonicMix,
    params.harmonicTilt,
    params.filterTracking
  ]);

  return {
    params,
    setParam,
    noteOn,
    noteOff,
    analyser: analyserRef.current
  };
}
