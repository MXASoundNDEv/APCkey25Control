document.addEventListener('DOMContentLoaded', () => {
    let activeKnob = null;
    let velocityEnabled = true;

    const velocityToggleButton = document.getElementById("velocity-toggle");
    const volumeRange = document.getElementById('Audio-Range');
    const audioContext = new(window.AudioContext || window.webkitAudioContext)();
    let output = null;

    const PadColors = {
        None: 0,
        Green: 1,
        GreenBlink: 2,
        Red: 3,
        RedBlink: 4,
        Orange: 5,
        OrangeBlink: 6
    };

    const initVelocityToggle = () => {
        velocityToggleButton.addEventListener("click", () => {
            velocityEnabled = !velocityEnabled;
            velocityToggleButton.textContent = velocityEnabled ? "Désactiver Vélocité" : "Activer Vélocité";
        });
    };

    const midiNoteToFrequency = (note) => {
        const a = 440; // A4 = 440Hz
        return a * Math.pow(2, (note - 69) / 12);
    };

    const playNote = (frequency, velocity) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        const volume = velocityEnabled ? velocity / 127 : volumeRange.value;
        gainNode.gain.setValueAtTime(volume, audioContext.currentTime);

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.5);
    };

    const sendMIDIMessage = (message) => {
        console.log("Envoi du message MIDI :", message);
        if (output && typeof output.send === 'function') {
            output.send(message);
        } else {
            console.error("Erreur: la sortie MIDI n'est pas disponible.");
        }
    };

    const handleNoteOn = (note, velocity) => {
        const keyElement = document.getElementById(`key-${note}`);
        if (keyElement) {
            keyElement.classList.add('active');
            const frequency = midiNoteToFrequency(note);
            playNote(frequency, velocity);
        }
    };

    const handleNoteOff = (note) => {
        const keyElement = document.getElementById(`key-${note}`);
        if (keyElement) {
            keyElement.classList.remove('active');
        }
    };

    const handlePad = (command, note, velocity) => {
        const padElement = document.getElementById(`pad-${note}`);
        if (padElement) {
            if (velocity > 0 && command === 144) {
                sendMIDIMessage([144, note, PadColors.Green]);
                padElement.classList.add('active');
            } else {
                sendMIDIMessage([144, note, PadColors.None]);
                padElement.classList.remove('active');
            }
        }
    };

    const handleKnob = (note, velocity) => {
        const knobNumber = note - 47;
        const knobElement = document.getElementById(`knob-${knobNumber}`);
        const indicator = knobElement.querySelector('.knob-indicator');
        if (indicator) {
            const rotationDegree = (velocity / 127) * 270 - 135;
            indicator.style.transform = `rotate(${rotationDegree}deg)`;

            if (activeKnob && activeKnob !== knobElement) {
                activeKnob.classList.remove('active');
            }
            knobElement.classList.add('active');
            activeKnob = knobElement;
        }
    };

    const handleMIDIMessage = (message) => {
        const [command, note, velocity] = message.data;
        console.log(`MIDI Message - Command: ${command}, Note: ${note}, Velocity: ${velocity}`);

        if (command === 145 && velocity > 0) {
            handleNoteOn(note, velocity);
        } else if (command === 129 || (command === 145 && velocity === 0)) {
            handleNoteOff(note);
        } else if ((command === 144 || command === 128) && note >= 0 && note <= 64) {
            handlePad(command, note, velocity);
        } else if (command === 176 && note >= 48 && note <= 55) {
            handleKnob(note, velocity);
        }
    };

    const initMIDI = () => {
        console.log("Start Init Midi ...");
        navigator.requestMIDIAccess().then(midiAccess => {
            const input = [...midiAccess.inputs.values()].find(device => device.name.includes('APC Key 25'));
            output = [...midiAccess.outputs.values()].find(device => device.name.includes('APC Key 25'));

            if (input) {
                input.onmidimessage = handleMIDIMessage;
                console.log(`MIDI Input: ${input}`);
            } else {
                console.error("Aucune entrée MIDI trouvée.");
            }

            if (!output) {
                console.error("Aucune sortie MIDI trouvée.");
            }
        }).catch(() => {
            console.error('Échec d\'accès au MIDI.');
        });
    };

    const initConsoleLog = () => {
        const originalConsoleLog = console.log;
        console.log = function (...args) {
            const consoleOutput = document.getElementById('console-output');
            if (consoleOutput) {
                consoleOutput.value += args.join(' ') + '\n';
                consoleOutput.scrollTop = consoleOutput.scrollHeight;
            }
            originalConsoleLog.apply(console, args);
        };
    };

    // Initialisation des événements et de l'interface
    initVelocityToggle();
    initMIDI();
    initConsoleLog();
});