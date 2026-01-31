import React from 'react';

export function PadGrid({ layout, activePads, onPadClick, title }) {
  return (
    <div className="card">
      <div className="card-title">{title}</div>
      <div className="pad-grid">
        {layout.map((row, rowIndex) => (
          <div className="pad-row" key={`row-${rowIndex}`}>
            {row.map((note) => {
              const active = activePads.has(note);
              return (
                <button
                  key={note}
                  className={`pad ${active ? 'pad-active' : ''}`}
                  onClick={() => onPadClick(note)}
                >
                  {note}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
