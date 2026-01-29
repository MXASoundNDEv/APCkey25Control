import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const noteLabel = (midi) => {
  const name = NOTE_NAMES[midi % 12];
  const oct = Math.floor(midi / 12) - 1;
  return `${name}${oct}`;
};

const defaultPattern = Array.from({ length: 16 }, () => ({
  active: false,
  note: 60,
  velocity: 100
}));

export function StepSequencer({ tempo = 120, onTempoChange, startNote, stopNote, lastNote }) {
  const [pattern, setPattern] = useState(defaultPattern);
  const [playing, setPlaying] = useState(false);
  const [selected, setSelected] = useState(0);
  const [gate, setGate] = useState(0.85); // portion of step
  const [playhead, setPlayhead] = useState(-1);
  const timerRef = useRef(null);
  const gateTimersRef = useRef([]);
  const stepRef = useRef(0);

  const stepDurationMs = useMemo(() => 60000 / tempo / 4, [tempo]);

  const clearGates = useCallback(() => {
    gateTimersRef.current.forEach((id) => clearTimeout(id));
    gateTimersRef.current = [];
  }, []);

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      clearGates();
    };
  }, [clearGates]);

  const tick = useCallback(() => {
    setPattern((current) => {
      const step = stepRef.current % current.length;
      setPlayhead(step);
      const { active, note, velocity } = current[step];
      if (active) {
        startNote(note, velocity, true);
        const gateId = setTimeout(() => stopNote(note), stepDurationMs * gate);
        gateTimersRef.current.push(gateId);
      }
      stepRef.current = (step + 1) % current.length;
      return current;
    });
  }, [gate, startNote, stepDurationMs, stopNote]);

  const handlePlay = useCallback(() => {
    if (playing) {
      setPlaying(false);
      clearInterval(timerRef.current);
      clearGates();
      return;
    }
    stepRef.current = 0;
    clearInterval(timerRef.current);
    clearGates();
    setPlaying(true);
    timerRef.current = setInterval(tick, stepDurationMs);
  }, [clearGates, playing, stepDurationMs, tick]);

  useEffect(() => {
    if (playing) {
      clearInterval(timerRef.current);
      timerRef.current = setInterval(tick, stepDurationMs);
    }
  }, [playing, stepDurationMs, tick]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.code === 'Space' && !['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) {
        e.preventDefault();
        handlePlay();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handlePlay]);

  const toggleStep = (idx) => {
    setPattern((prev) =>
      prev.map((st, i) => (i === idx ? { ...st, active: !st.active } : st))
    );
    setSelected(idx);
  };

  const updateSelected = (patch) => {
    setPattern((prev) =>
      prev.map((st, i) => (i === selected ? { ...st, ...patch } : st))
    );
  };

  const randomize = () => {
    setPattern((prev) =>
      prev.map((_, i) => ({
        active: Math.random() > 0.45,
        note: 60 + ((i % 4) - 1) * 2,
        velocity: 80 + Math.round(Math.random() * 40)
      }))
    );
  };

  const clearPattern = () => setPattern(defaultPattern);

  const learnNote = () => {
    if (typeof lastNote === 'number') updateSelected({ note: lastNote });
  };

  const fillAllActive = () => {
    setPattern((prev) => prev.map((st) => ({ ...st, note: selectedStep.note, velocity: selectedStep.velocity, active: st.active })));
  };

  const selectedStep = pattern[selected] || pattern[0];

  return (
    <div className="card sequencer">
      <div className="card-title">Pattern 16 temps</div>
      <div className="sequencer-controls">
        <button className="btn accent" onClick={handlePlay}>
          {playing ? 'Stop' : 'Play'}
        </button>
        <div className="inline-field">
          <label>Tempo</label>
          <input
            type="number"
            min="40"
            max="200"
            value={tempo}
            onChange={(e) => onTempoChange?.(parseInt(e.target.value, 10) || 120)}
          />
          <span className="unit">BPM</span>
        </div>
        <div className="inline-field">
          <label>Gate</label>
          <input
            type="range"
            min="0.2"
            max="1"
            step="0.01"
            value={gate}
            onChange={(e) => setGate(parseFloat(e.target.value))}
          />
        </div>
        <div className="button-row">
          <button className="btn ghost" onClick={randomize}>
            Random
          </button>
          <button className="btn ghost" onClick={clearPattern}>
            Clear
          </button>
          <button className="btn" onClick={learnNote} disabled={typeof lastNote !== 'number'}>
            Apprendre note
          </button>
          <button className="btn ghost" onClick={fillAllActive}>
            Copier sur pas actifs
          </button>
        </div>
      </div>

      <div className="steps-grid">
        {pattern.map((step, idx) => (
          <button
            key={idx}
            className={`step ${step.active ? 'on' : 'off'} ${idx === selected ? 'sel' : ''} ${
              idx === playhead ? 'playhead' : ''
            }`}
            onClick={() => toggleStep(idx)}
          >
            <span className="step-idx">{idx + 1}</span>
            <span className="step-note">{noteLabel(step.note)}</span>
            <span className="step-vel">{step.velocity}</span>
          </button>
        ))}
      </div>

      <div className="step-editor">
        <div className="inline-field">
          <label>Note</label>
          <select
            value={selectedStep.note}
            onChange={(e) => updateSelected({ note: parseInt(e.target.value, 10) })}
          >
            {Array.from({ length: 37 }, (_, i) => 48 + i).map((m) => (
              <option key={m} value={m}>
                {noteLabel(m)}
              </option>
            ))}
          </select>
        </div>
        <div className="inline-field">
          <label>Vélocité</label>
          <input
            type="range"
            min="10"
            max="127"
            value={selectedStep.velocity}
            onChange={(e) => updateSelected({ velocity: parseInt(e.target.value, 10) })}
          />
          <span className="unit">{selectedStep.velocity}</span>
        </div>
        <div className="inline-field">
          <label>Actif</label>
          <input
            type="checkbox"
            checked={selectedStep.active}
            onChange={() => updateSelected({ active: !selectedStep.active })}
          />
        </div>
      </div>
    </div>
  );
}
