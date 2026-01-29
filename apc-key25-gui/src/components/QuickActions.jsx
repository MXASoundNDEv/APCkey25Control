import React from 'react';

export function QuickActions({
  velocityEnabled,
  onToggleVelocity,
  onClearPads,
  onRainbow,
  shiftEnabled,
  onToggleShift
}) {
  return (
    <div className="card">
      <div className="card-title">Actions rapides</div>
      <div className="button-row">
        <button className="btn" onClick={onToggleVelocity}>
          {velocityEnabled ? 'Vélocité ON' : 'Vélocité OFF'}
        </button>
        <button className="btn" onClick={onToggleShift}>
          Shift {shiftEnabled ? 'actif' : 'inactif'}
        </button>
        <button className="btn ghost" onClick={onClearPads}>
          Nettoyer les LED
        </button>
        <button className="btn accent" onClick={onRainbow}>
          Mode Rainbow
        </button>
      </div>
    </div>
  );
}
