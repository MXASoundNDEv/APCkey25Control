import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MidiPanel } from './components/MidiPanel';
import { PadGrid } from './components/PadGrid';
import { KnobRow } from './components/KnobRow';
import { Oscilloscope } from './components/Oscilloscope';
import { ConsolePanel } from './components/ConsolePanel';
import { SynthControls } from './components/SynthControls';
import { QuickActions } from './components/QuickActions';
import { useMidi } from './hooks/useMidi';
import { useSynth } from './hooks/useSynth';

const PadColors = {
  None: 0,
  Green: 1,
  GreenBlink: 2,
  Red: 3,
  RedBlink: 4,
  Orange: 5,
  OrangeBlink: 6
};

const padLayout = [
  [32, 33, 34, 35, 36, 37, 38, 39],
  [24, 25, 26, 27, 28, 29, 30, 31],
  [16, 17, 18, 19, 20, 21, 22, 23],
  [8, 9, 10, 11, 12, 13, 14, 15],
  [0, 1, 2, 3, 4, 5, 6, 7]
];

const controlLayout = [[64, 65, 66, 77, 68, 69, 70, 71]];
const sceneLayout = [[82], [83], [84], [85], [86]];
const otherLayout = [[91, 93, 98, 81]];

export default function App() {
  const flatPadNotes = useMemo(() => padLayout.flat(), []);
  const allDeviceNotes = useMemo(
    () => [
      ...flatPadNotes,
      ...controlLayout.flat(),
      ...sceneLayout.flat(),
      ...otherLayout.flat()
    ],
    [flatPadNotes]
  );

  const [velocityEnabled, setVelocityEnabled] = useState(true);
  const [shiftEnabled, setShiftEnabled] = useState(false);
  const [activePads, setActivePads] = useState(new Set());
  const [logs, setLogs] = useState([]);
  const [lastNote, setLastNote] = useState(null);
  const [knobValues, setKnobValues] = useState({
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    6: 0,
    7: 0,
    8: 0
  });

  const messageHandlerRef = useRef(null);
  const midiListener = useCallback((message) => {
    if (messageHandlerRef.current) {
      messageHandlerRef.current(message);
    }
  }, []);

  const {
    midiSupported,
    error: midiError,
    inputs,
    outputs,
    selectedInputId,
    selectedOutputId,
    setSelectedInputId,
    setSelectedOutputId,
    sendMessage
  } = useMidi(midiListener);

  const { params, setParam, noteOn, noteOff, analyser } = useSynth();

  const appendLog = useCallback((line) => {
    setLogs((prev) => {
      const next = [...prev, line];
      if (next.length > 300) next.shift();
      return next;
    });
  }, []);

  const sendPadColor = useCallback(
    (note, color) => {
      sendMessage([144, note, color]);
    },
    [sendMessage]
  );

  const handlePadState = useCallback(
    (note, isActive) => {
      setActivePads((prev) => {
        const updated = new Set(prev);
        if (isActive) updated.add(note);
        else updated.delete(note);
        return updated;
      });
      sendPadColor(note, isActive ? PadColors.Green : PadColors.None);
    },
    [sendPadColor]
  );

  const handleKnob = useCallback(
    (note, velocity) => {
      const knobNumber = note - 47;
      const normalized = velocity / 127;
      setKnobValues((prev) => ({ ...prev, [knobNumber]: normalized }));

      switch (knobNumber) {
        case 1:
          setParam('vibratoFreq', normalized * 20);
          break;
        case 2:
          setParam('vibratoDepth', normalized * 100);
          break;
        case 3:
          setParam('filterFreq', 200 + normalized * 11800);
          break;
        case 4:
          setParam('filterQ', 0.1 + normalized * 19.9);
          break;
        case 5:
          setParam('attack', normalized * 2);
          break;
        case 6:
          setParam('decay', normalized * 2);
          break;
        case 7:
          setParam('sustain', normalized);
          break;
        case 8:
          setParam('release', normalized * 2);
          break;
        default:
          break;
      }
    },
    [setParam]
  );

  const clearPads = useCallback(() => {
    allDeviceNotes.forEach((note) => sendPadColor(note, PadColors.None));
    setActivePads(new Set());
  }, [allDeviceNotes, sendPadColor]);

  const rainbow = useCallback(() => {
    flatPadNotes.forEach((note) => {
      const color = Math.floor(Math.random() * 6) + 1; // 1..6
      sendPadColor(note, color);
    });
  }, [flatPadNotes, sendPadColor]);

  const handlePadClick = useCallback(
    (note) => {
      const nextState = !activePads.has(note);
      handlePadState(note, nextState);
      if (nextState) {
        noteOn(note, 100, velocityEnabled);
      } else {
        noteOff(note);
      }
    },
    [activePads, handlePadState, noteOn, noteOff, velocityEnabled]
  );

  const handleMidiMessage = useCallback(
    (message) => {
      const [status, note, velocity] = message.data;
      const command = status & 0xf0;
      setLastNote(note);
      appendLog(`MIDI ${status} | note ${note} | vel ${velocity}`);

      const isPad = flatPadNotes.includes(note);

      if ((command === 0x90 || status === 145) && velocity > 0) {
        // Note ON
        noteOn(note, velocity, velocityEnabled);
        if (isPad) handlePadState(note, true);
      } else if (command === 0x80 || status === 129 || (command === 0x90 && velocity === 0)) {
        // Note OFF
        noteOff(note);
        if (isPad) handlePadState(note, false);
      } else if (command === 0xb0 && note >= 48 && note <= 55) {
        handleKnob(note, velocity);
      }

      // Volume button mapped in original code (note 68) to toggle velocity mode
      if (command === 0x90 && note === 68 && velocity > 0) {
        setVelocityEnabled((prev) => {
          const next = !prev;
          sendPadColor(note, next ? PadColors.Red : PadColors.None);
          return next;
        });
      }

      // Shift toggle (note 98)
      if (command === 0x90 && note === 98 && velocity > 0) {
        setShiftEnabled((prev) => {
          const next = !prev;
          sendPadColor(note, next ? PadColors.Green : PadColors.None);
          return next;
        });
      }
    },
    [
      appendLog,
      flatPadNotes,
      handleKnob,
      handlePadState,
      noteOff,
      noteOn,
      sendPadColor,
      velocityEnabled
    ]
  );

  messageHandlerRef.current = handleMidiMessage;

  useEffect(() => {
    document.title = 'APC Key 25 Control';
  }, []);

  return (
    <div className="page">
      <header className="hero">
        <div>
          <p className="eyebrow">Akai APC Key 25</p>
          <h1>Contrôleur React + Electron</h1>
          <p className="lede">
            Visualisez, pilotez les pads et mappez les potentiomètres en Web MIDI, avec un
            synthé embarqué pour tester vos messages.
          </p>
        </div>
        <div className="hero-actions">
          <QuickActions
            velocityEnabled={velocityEnabled}
            onToggleVelocity={() => setVelocityEnabled((prev) => !prev)}
            onClearPads={clearPads}
            onRainbow={rainbow}
            shiftEnabled={shiftEnabled}
            onToggleShift={() => {
              setShiftEnabled((prev) => {
                const next = !prev;
                sendPadColor(98, next ? PadColors.Green : PadColors.None);
                return next;
              });
            }}
          />
        </div>
      </header>

      <main className="layout">
        <div className="column">
          <MidiPanel
            inputs={inputs}
            outputs={outputs}
            selectedInputId={selectedInputId}
            selectedOutputId={selectedOutputId}
            onInputChange={setSelectedInputId}
            onOutputChange={setSelectedOutputId}
            midiSupported={midiSupported}
            error={midiError}
            lastNote={lastNote}
          />

          <PadGrid
            layout={padLayout}
            activePads={activePads}
            onPadClick={handlePadClick}
            title="Pads 5x8"
          />

          <KnobRow values={knobValues} />
        </div>

        <div className="column">
          <SynthControls params={params} setParam={setParam} />
          <Oscilloscope analyser={analyser} />
          <ConsolePanel logs={logs} />
        </div>
      </main>
    </div>
  );
}
