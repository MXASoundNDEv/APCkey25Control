import React from 'react';

export function KnobRow({ values }) {
  return (
    <div className="card">
      <div className="card-title">Potentiomètres (CC 48-55)</div>
      <div className="knob-row">
        {Object.entries(values).map(([idx, value]) => (
          <div className="knob" key={idx}>
            <div className="knob-value">{Math.round(value * 100)}%</div>
            <div className="knob-track">
              <div className="knob-fill" style={{ width: `${value * 100}%` }} />
            </div>
            <div className="knob-label">K{idx}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
