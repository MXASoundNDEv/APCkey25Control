import React from 'react';

export function ConsolePanel({ logs }) {
  return (
    <div className="card console-card">
      <div className="card-title">Console</div>
      <div className="console">
        {logs.map((line, idx) => (
          <div key={`${idx}-${line.slice(0, 10)}`} className="console-line">
            {line}
          </div>
        ))}
      </div>
    </div>
  );
}
