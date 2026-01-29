import React from 'react';

export function MidiPanel({
  inputs,
  outputs,
  selectedInputId,
  selectedOutputId,
  onInputChange,
  onOutputChange,
  midiSupported,
  error,
  lastNote
}) {
  return (
    <div className="card">
      <div className="card-title">Connexion MIDI</div>
      {!midiSupported && (
        <div className="warning">Web MIDI non disponible dans ce navigateur.</div>
      )}
      {error && <div className="warning">{error}</div>}
      <div className="field">
        <label>Entrée</label>
        <select value={selectedInputId || ''} onChange={(e) => onInputChange(e.target.value)}>
          {inputs.map((input) => (
            <option key={input.id} value={input.id}>
              {input.name}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label>Sortie</label>
        <select value={selectedOutputId || ''} onChange={(e) => onOutputChange(e.target.value)}>
          {outputs.map((output) => (
            <option key={output.id} value={output.id}>
              {output.name}
            </option>
          ))}
        </select>
      </div>
      <div className="status-line">
        <span>Note entendue :</span>
        <strong>{lastNote ?? '–'}</strong>
      </div>
    </div>
  );
}
