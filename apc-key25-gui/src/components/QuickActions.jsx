import React from 'react';

export function QuickActions({
  velocityEnabled,
  onToggleVelocity,
  onClearPads,
  onRainbow,
  shiftEnabled,
  onToggleShift,
  recording,
  looping,
  hasLoop,
  onToggleRec,
  onToggleLoop
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
        <button className={`btn ${recording ? 'accent' : ''}`} onClick={onToggleRec}>
          {recording ? 'Recording…' : 'Rec'}
        </button>
        <button
          className="btn ghost"
          onClick={onToggleLoop}
          disabled={!hasLoop && !looping}
          title={hasLoop ? '' : 'Enregistrer un loop d’abord'}
        >
          {looping ? 'Stop loop' : 'Play loop'}
        </button>
        <button className="btn ghost" onClick={onClearPads}>
          Nettoyer les LED
        </button>
        <button className="btn accent" onClick={onRainbow}>
          Mode Rainbow
        </button>
      </div>
      <div className="status-line">
        <span className="pill">{recording ? 'REC' : 'Idle'}</span>
        <span className="pill ghost">{looping ? 'Loop ON' : hasLoop ? 'Loop prêt' : 'Pas de loop'}</span>
      </div>
    </div>
  );
}
