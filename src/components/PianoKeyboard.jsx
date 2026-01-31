import React, { useMemo } from 'react';

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const SHARPS = new Set([1, 3, 6, 8, 10]);
const WHITE_WIDTH = 48; // px, must stay in sync with CSS

function noteLabel(note) {
  const name = NOTE_NAMES[note % 12];
  const octave = Math.floor(note / 12) - 1;
  return `${name}${octave}`;
}

export function PianoKeyboard({ baseNote = 60, octaves = 2, activeNotes, onPress, onRelease }) {
  const keys = useMemo(() => {
    const total = octaves * 12;
    const list = [];
    for (let i = 0; i < total; i += 1) {
      const note = baseNote + i;
      const isSharp = SHARPS.has(note % 12);
      list.push({ note, isSharp, label: noteLabel(note), idx: i });
    }
    return list;
  }, [baseNote, octaves]);

  const blackOffset = (noteIndex) => {
    const withinOctave = noteIndex % 12;
    const octave = Math.floor(noteIndex / 12);
    const base = octave * 7 * WHITE_WIDTH;
    switch (withinOctave) {
      case 1:
        return base + WHITE_WIDTH * 0.7;
      case 3:
        return base + WHITE_WIDTH * 1.7;
      case 6:
        return base + WHITE_WIDTH * 3.2;
      case 8:
        return base + WHITE_WIDTH * 4.2;
      case 10:
        return base + WHITE_WIDTH * 5.2;
      default:
        return base;
    }
  };

  return (
    <div className="card">
      <div className="card-title">Clavier virtuel</div>
      <div className="piano">
        <div className="white-keys">
          {keys
            .filter((k) => !k.isSharp)
            .map((key) => (
              <button
                key={key.note}
                className={`piano-key white ${activeNotes.has(key.note) ? 'active' : ''}`}
                onMouseDown={() => onPress?.(key.note)}
                onMouseUp={() => onRelease?.(key.note)}
                onMouseLeave={() => activeNotes.has(key.note) && onRelease?.(key.note)}
              >
                <span className="key-label">{key.label}</span>
              </button>
            ))}
        </div>
        <div className="black-keys">
          {keys
            .filter((k) => k.isSharp)
            .map((key) => (
              <button
                key={key.note}
                className={`piano-key black ${activeNotes.has(key.note) ? 'active' : ''}`}
                style={{ left: `${blackOffset(key.idx)}px` }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  onPress?.(key.note);
                }}
                onMouseUp={(e) => {
                  e.stopPropagation();
                  onRelease?.(key.note);
                }}
                onMouseLeave={() => activeNotes.has(key.note) && onRelease?.(key.note)}
              >
                <span className="key-label">{key.label}</span>
              </button>
            ))}
        </div>
      </div>
      <p className="muted">
        Pilotable au clavier (A,W,S,E,D,F,T,G,Y,H,U,J,K) ou via l&apos;APC Key 25 en MIDI.
      </p>
    </div>
  );
}
