import { useCallback, useEffect, useRef, useState } from 'react';

const noteToFrequency = (note) => 440 * Math.pow(2, (note - 69) / 12);

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
  oscillatorType: 'sawtooth'
};

export function useSynth() {
  const [params, setParams] = useState(defaultParams);
  const audioCtxRef = useRef(null);
  const masterGainRef = useRef(null);
  const analyserRef = useRef(null);
  const voicesRef = useRef(new Map());

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

  useEffect(() => {
    if (masterGainRef.current && audioCtxRef.current) {
      masterGainRef.current.gain.setValueAtTime(
        params.master,
        audioCtxRef.current.currentTime
      );
    }
  }, [params.master]);

  const setParam = useCallback((key, value) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  }, []);

  const noteOn = useCallback(
    (note, velocity = 100, velocityScaling = true) => {
      const ctx = audioCtxRef.current;
      if (!ctx || ctx.state === 'closed' || !masterGainRef.current) return;
      ctx.resume();

      const frequency = noteToFrequency(note);
      const osc = ctx.createOscillator();
      osc.type = params.oscillatorType;

      const gainNode = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = params.filterFreq;
      filter.Q.value = params.filterQ;

      const vibratoOsc = ctx.createOscillator();
      const vibratoGain = ctx.createGain();
      vibratoOsc.frequency.value = params.vibratoFreq;
      vibratoGain.gain.value = params.vibratoDepth;
      vibratoOsc.connect(vibratoGain);
      vibratoGain.connect(osc.frequency);

      osc.connect(gainNode);
      gainNode.connect(filter);
      filter.connect(masterGainRef.current);

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
      vibratoOsc.start(now);

      voicesRef.current.set(note, {
        oscillator: osc,
        vibratoOsc,
        vibratoGain,
        gainNode,
        filter
      });
    },
    [params]
  );

  const noteOff = useCallback(
    (note) => {
      const voice = voicesRef.current.get(note);
      if (!voice) return;
      const ctx = audioCtxRef.current;
      if (!ctx || !masterGainRef.current) return;
      const now = ctx.currentTime;

      voice.gainNode.gain.cancelScheduledValues(now);
      voice.gainNode.gain.setValueAtTime(voice.gainNode.gain.value, now);
      voice.gainNode.gain.linearRampToValueAtTime(0, now + params.release);

      voice.oscillator.stop(now + params.release + 0.01);
      voice.vibratoOsc.stop(now + params.release + 0.01);

      const disconnect = () => {
        voice.oscillator.disconnect();
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

  return {
    params,
    setParam,
    noteOn,
    noteOff,
    analyser: analyserRef.current
  };
}
