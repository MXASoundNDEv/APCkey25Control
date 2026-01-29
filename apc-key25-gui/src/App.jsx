import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MidiPanel } from './components/MidiPanel';
import { PadGrid } from './components/PadGrid';
import { KnobRow } from './components/KnobRow';
import { Oscilloscope } from './components/Oscilloscope';
import { ConsolePanel } from './components/ConsolePanel';
import { SynthControls } from './components/SynthControls';
import { QuickActions } from './components/QuickActions';
import { PianoKeyboard } from './components/PianoKeyboard';
import { StepSequencer } from './components/StepSequencer';
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
const KEYBOARD_NOTE_MAP = {
  KeyA: 60,
  KeyW: 61,
  KeyS: 62,
  KeyE: 63,
  KeyD: 64,
  KeyF: 65,
  KeyT: 66,
  KeyG: 67,
  KeyY: 68,
  KeyH: 69,
  KeyU: 70,
  KeyJ: 71,
  KeyK: 72
};

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
  const [tempo, setTempo] = useState(120);
  const [activePads, setActivePads] = useState(new Set());
  const [activeNotes, setActiveNotes] = useState(new Set());
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
  const heldComputerKeys = useRef(new Set());
  const recordStartRef = useRef(null);
  const loopTimersRef = useRef([]);
  const recordingRef = useRef(false);
  const loopingRef = useRef(false);
  const loopEventsRef = useRef([]);
  const loopLengthRef = useRef(0);
  const [recording, setRecording] = useState(false);
  const [looping, setLooping] = useState(false);
  const [loopEvents, setLoopEvents] = useState([]);
  const [loopLength, setLoopLength] = useState(0);
  const midiListener = useCallback((message) => {
    if (messageHandlerRef.current) {
      messageHandlerRef.current(message);
    }
  }, []);

  useEffect(() => {
    recordingRef.current = recording;
    loopingRef.current = looping;
    loopEventsRef.current = loopEvents;
    loopLengthRef.current = loopLength;
  }, [recording, looping, loopEvents, loopLength]);

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

  const clearLoopTimers = useCallback(() => {
    loopTimersRef.current.forEach((id) => clearTimeout(id));
    loopTimersRef.current = [];
  }, []);

  const recordEvent = useCallback(
    (note, type, velocity = 0, useVelocityScaling = true) => {
      if (!recordingRef.current || recordStartRef.current === null) return;
      const time = performance.now() - recordStartRef.current;
      setLoopEvents((prev) => [...prev, { note, type, velocity, useVelocityScaling, time }]);
    },
    []
  );

  const setNoteState = useCallback((note, isActive) => {
    setActiveNotes((prev) => {
      const next = new Set(prev);
      if (isActive) next.add(note);
      else next.delete(note);
      return next;
    });
  }, []);

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

  const startNote = useCallback(
    (note, velocity = 100, useVelocityScaling = true) => {
      recordEvent(note, 'on', velocity, useVelocityScaling);
      noteOn(note, velocity, useVelocityScaling && velocityEnabled);
      setNoteState(note, true);
    },
    [noteOn, recordEvent, setNoteState, velocityEnabled]
  );

  const stopNote = useCallback(
    (note) => {
      recordEvent(note, 'off', 0, true);
      noteOff(note);
      setNoteState(note, false);
    },
    [noteOff, recordEvent, setNoteState]
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

  const stopLoop = useCallback(() => {
    clearLoopTimers();
    setLooping(false);
    loopingRef.current = false;
    // Stoppe toutes les notes actives pour éviter les notes bloquées
    activeNotes.forEach((note) => stopNote(note));
  }, [activeNotes, clearLoopTimers, stopNote]);

  const scheduleLoopCycle = useCallback(() => {
    const events = loopEventsRef.current;
    const duration = loopLengthRef.current;
    if (!events.length || duration <= 0 || !loopingRef.current) return;

    events.forEach((ev) => {
      const id = setTimeout(() => {
        if (!loopingRef.current) return;
        if (ev.type === 'on') startNote(ev.note, ev.velocity, ev.useVelocityScaling);
        else stopNote(ev.note);
      }, ev.time);
      loopTimersRef.current.push(id);
    });

    const nextCycle = setTimeout(() => {
      scheduleLoopCycle();
    }, duration);
    loopTimersRef.current.push(nextCycle);
  }, [startNote, stopNote]);

  const startLoop = useCallback(() => {
    if (!loopEvents.length || loopLength <= 0) return;
    clearLoopTimers();
    setLooping(true);
    loopingRef.current = true;
    scheduleLoopCycle();
  }, [clearLoopTimers, loopEvents, loopLength, scheduleLoopCycle]);

  const toggleLoop = useCallback(() => {
    if (loopingRef.current) {
      stopLoop();
    } else {
      startLoop();
    }
  }, [startLoop, stopLoop]);

  const toggleRecording = useCallback(() => {
    if (recordingRef.current) {
      setRecording(false);
      recordingRef.current = false;
      const now = performance.now();
      const rawDuration = Math.max(100, now - (recordStartRef.current || now));
      setLoopEvents((prev) => {
        const sorted = [...prev].sort((a, b) => a.time - b.time);
        loopEventsRef.current = sorted;
        const lastEvent = sorted[sorted.length - 1];
        const safeTail = 200; // ms pour laisser finir le release
        const duration = Math.max(rawDuration, (lastEvent?.time || 0) + safeTail);
        setLoopLength(duration);
        loopLengthRef.current = duration;
        return sorted;
      });
    } else {
      clearLoopTimers();
      setLooping(false);
      loopingRef.current = false;
      setLoopEvents([]);
      loopEventsRef.current = [];
      recordStartRef.current = performance.now();
      setRecording(true);
      recordingRef.current = true;
    }
  }, [clearLoopTimers]);

  const clearPads = useCallback(() => {
    allDeviceNotes.forEach((note) => sendPadColor(note, PadColors.None));
    flatPadNotes.forEach((note) => stopNote(note));
    setActivePads(new Set());
  }, [allDeviceNotes, flatPadNotes, sendPadColor, stopNote]);

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
        startNote(note, 100, true);
      } else {
        stopNote(note);
      }
    },
    [activePads, handlePadState, startNote, stopNote]
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
        startNote(note, velocity, true);
        if (isPad) handlePadState(note, true);
      } else if (command === 0x80 || status === 129 || (command === 0x90 && velocity === 0)) {
        // Note OFF
        stopNote(note);
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
      sendPadColor,
      startNote,
      stopNote
    ]
  );

  messageHandlerRef.current = handleMidiMessage;

  useEffect(() => {
    document.title = 'APC Key 25 Control';
  }, []);

  useEffect(() => {
    return () => {
      clearLoopTimers();
    };
  }, [clearLoopTimers]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.repeat) return;
      if (
        e.target.tagName === 'TEXTAREA' ||
        e.target.tagName === 'SELECT' ||
        (e.target.tagName === 'INPUT' && e.target.type !== 'range')
      )
        return;
      const note = KEYBOARD_NOTE_MAP[e.code];
      if (note !== undefined && !heldComputerKeys.current.has(e.code)) {
        e.preventDefault();
        heldComputerKeys.current.add(e.code);
        startNote(note, 110, false);
      }
    };

    const onKeyUp = (e) => {
      const note = KEYBOARD_NOTE_MAP[e.code];
      if (note !== undefined) {
        heldComputerKeys.current.delete(e.code);
        stopNote(note);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [startNote, stopNote]);

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
            recording={recording}
            looping={looping}
            hasLoop={!!loopEvents.length}
            onToggleRec={toggleRecording}
            onToggleLoop={toggleLoop}
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

          <PianoKeyboard
            activeNotes={activeNotes}
            onPress={(n) => startNote(n, 110, false)}
            onRelease={stopNote}
          />

          <KnobRow values={knobValues} />
        </div>

        <div className="column">
          <SynthControls params={params} setParam={setParam} />
          <StepSequencer
            tempo={tempo}
            onTempoChange={setTempo}
            startNote={startNote}
            stopNote={stopNote}
            lastNote={lastNote}
          />
          <Oscilloscope analyser={analyser} />
          <ConsolePanel logs={logs} />
        </div>
      </main>
    </div>
  );
}
