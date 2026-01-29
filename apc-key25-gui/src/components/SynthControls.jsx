import React from 'react';

export function SynthControls({ params, setParam }) {
  const slider = (label, key, min, max, step = 0.01, unit = '') => (
    <div className="field slider-field" key={key}>
      <div className="slider-label">
        <span>{label}</span>
        <span className="value">{params[key].toFixed(2)}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={params[key]}
        onChange={(e) => setParam(key, parseFloat(e.target.value))}
      />
    </div>
  );

  return (
    <div className="card">
      <div className="card-title">Synthé intégré</div>
      <div className="field">
        <label>Type d’oscillateur</label>
        <select
          value={params.oscillatorType}
          onChange={(e) => setParam('oscillatorType', e.target.value)}
        >
          <option value="sine">Sine</option>
          <option value="square">Square</option>
          <option value="sawtooth">Saw</option>
          <option value="triangle">Triangle</option>
        </select>
      </div>
      {slider('Volume maître', 'master', 0, 1, 0.01)}
      <div className="control-columns">
        <div>
          {slider('Attack', 'attack', 0, 2, 0.01, 's')}
          {slider('Decay', 'decay', 0, 2, 0.01, 's')}
          {slider('Sustain', 'sustain', 0, 1, 0.01)}
          {slider('Release', 'release', 0, 3, 0.01, 's')}
        </div>
        <div>
          {slider('Vibrato freq', 'vibratoFreq', 0, 20, 0.1, 'Hz')}
          {slider('Vibrato depth', 'vibratoDepth', 0, 100, 0.5)}
          {slider('Filtre fréquence', 'filterFreq', 200, 12000, 10, 'Hz')}
          {slider('Filtre Q', 'filterQ', 0.1, 20, 0.1)}
          {slider('Suivi tonal filtre', 'filterTracking', 0, 1.5, 0.01)}
          {slider('Mix harmonique', 'harmonicMix', 0, 1, 0.01)}
          {slider('Inclinaison harmonique', 'harmonicTilt', 0, 1.2, 0.01)}
        </div>
      </div>
    </div>
  );
}
