document.addEventListener('DOMContentLoaded', () => {
    let activeKnob = null;
    let velocityEnabled = true;

    const ClearColorButton = document.getElementById("Clear")
    const canvas = document.getElementById('oscilloscope');
    const canvasCtx = canvas.getContext('2d');
    const frames = document.querySelectorAll('.frame');
    const resizableModules = document.querySelectorAll('.resizable-module');
    const RainBowButton = document.getElementById("RainBow")
    const closeButtons = document.querySelectorAll('.close-btn');
    const velocityToggleButton = document.getElementById("velocity-toggle");
    const volumeRange = document.getElementById('Audio-Range');
    const audioContext = new(window.AudioContext || window.webkitAudioContext)();
    // Créer une série de données pour les notes
    const noteDataSeries = new TimeSeries();
    const activeNotes = {};
    let ShiftEnable = false;
    let input = null;
    let output = null;
    let midiAccess = null;
    let availableInputs = [];
    let availableOutputs = [];
    let selectedInputId = null;
    let selectedOutputId = null;

    // Création du masterGain et de l'analyser
    const masterGain = audioContext.createGain();
    masterGain.connect(audioContext.destination);

    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    masterGain.connect(analyser);

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
        [32, 33, 34, 35, 36, 37, 38, 39], // Ligne 1
        [24, 25, 26, 27, 28, 29, 30, 31], // Ligne 2
        [16, 17, 18, 19, 20, 21, 22, 23], // Ligne 3
        [8, 9, 10, 11, 12, 13, 14, 15], // Ligne 4
        [0, 1, 2, 3, 4, 5, 6, 7] // Ligne 5
    ];

    const ControlLayout = [
        [64, 65, 66, 77, 68, 69, 70, 71]
    ];

    const SceneLayout = [
        [82],
        [83],
        [84],
        [85],
        [86]
    ]

    const OtherLayout = [
        [91, 93, 98, 81]
    ]

    const font5x8 = {
        'A': [0b01110, 0b10001, 0b10001, 0b11111, 0b10001, 0b10001, 0b10001, 0b00000],
        'B': [0b11110, 0b10001, 0b10001, 0b11110, 0b10001, 0b10001, 0b11110, 0b00000],
        'C': [0b01110, 0b10001, 0b10000, 0b10000, 0b10000, 0b10001, 0b01110, 0b00000],
        'D': [0b11110, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b11110, 0b00000],
        'E': [0b11111, 0b10000, 0b10000, 0b11110, 0b10000, 0b10000, 0b11111, 0b00000],
        'F': [0b11111, 0b10000, 0b10000, 0b11110, 0b10000, 0b10000, 0b10000, 0b00000],
        'G': [0b01110, 0b10001, 0b10000, 0b10000, 0b10011, 0b10001, 0b01110, 0b00000],
        'H': [0b10001, 0b10001, 0b10001, 0b11111, 0b10001, 0b10001, 0b10001, 0b00000],
        'I': [0b11111, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b11111, 0b00000],
        'J': [0b00111, 0b00010, 0b00010, 0b00010, 0b00010, 0b10010, 0b01100, 0b00000],
        'K': [0b10001, 0b10010, 0b10100, 0b11000, 0b10100, 0b10010, 0b10001, 0b00000],
        'L': [0b10000, 0b10000, 0b10000, 0b10000, 0b10000, 0b10000, 0b11111, 0b00000],
        'M': [0b10001, 0b11011, 0b10101, 0b10101, 0b10001, 0b10001, 0b10001, 0b00000],
        'N': [0b10001, 0b11001, 0b10101, 0b10011, 0b10001, 0b10001, 0b10001, 0b00000],
        'O': [0b01110, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01110, 0b00000],
        'P': [0b11110, 0b10001, 0b10001, 0b11110, 0b10000, 0b10000, 0b10000, 0b00000],
        'Q': [0b01110, 0b10001, 0b10001, 0b10001, 0b10101, 0b10010, 0b01101, 0b00000],
        'R': [0b11110, 0b10001, 0b10001, 0b11110, 0b10100, 0b10010, 0b10001, 0b00000],
        'S': [0b01111, 0b10000, 0b10000, 0b01110, 0b00001, 0b00001, 0b11110, 0b00000],
        'T': [0b11111, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b00000],
        'U': [0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01110, 0b00000],
        'V': [0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01010, 0b00100, 0b00000],
        'W': [0b10001, 0b10001, 0b10001, 0b10101, 0b10101, 0b10101, 0b01010, 0b00000],
        'X': [0b10001, 0b10001, 0b01010, 0b00100, 0b01010, 0b10001, 0b10001, 0b00000],
        'Y': [0b10001, 0b10001, 0b01010, 0b00100, 0b00100, 0b00100, 0b00100, 0b00000],
        'Z': [0b11111, 0b00001, 0b00010, 0b00100, 0b01000, 0b10000, 0b11111, 0b00000],
        ' ': [0b00000, 0b00000, 0b00000, 0b00000, 0b00000, 0b00000, 0b00000, 0b00000]
    };

    const font3x5 = {
        'A': [0b010, 0b101, 0b111, 0b101, 0b101],
        'B': [0b110, 0b101, 0b110, 0b101, 0b110],
        'C': [0b011, 0b100, 0b100, 0b100, 0b011],
        'D': [0b110, 0b101, 0b101, 0b101, 0b110],
        'E': [0b111, 0b100, 0b111, 0b100, 0b111],
        'F': [0b111, 0b100, 0b111, 0b100, 0b100],
        'G': [0b011, 0b100, 0b101, 0b101, 0b011],
        'H': [0b101, 0b101, 0b111, 0b101, 0b101],
        'I': [0b111, 0b010, 0b010, 0b010, 0b111],
        'J': [0b111, 0b001, 0b001, 0b101, 0b010],
        'K': [0b101, 0b110, 0b100, 0b110, 0b101],
        'L': [0b100, 0b100, 0b100, 0b100, 0b111],
        'M': [0b101, 0b111, 0b101, 0b101, 0b101],
        'N': [0b101, 0b111, 0b111, 0b101, 0b101],
        'O': [0b111, 0b101, 0b101, 0b101, 0b111],
        'P': [0b111, 0b101, 0b111, 0b100, 0b100],
        'Q': [0b111, 0b101, 0b111, 0b010, 0b001],
        'R': [0b111, 0b101, 0b110, 0b101, 0b101],
        'S': [0b011, 0b100, 0b111, 0b001, 0b110],
        'T': [0b111, 0b010, 0b010, 0b010, 0b010],
        'U': [0b101, 0b101, 0b101, 0b101, 0b111],
        'V': [0b101, 0b101, 0b101, 0b101, 0b010],
        'W': [0b101, 0b101, 0b101, 0b111, 0b101],
        'X': [0b101, 0b101, 0b010, 0b101, 0b101],
        'Y': [0b101, 0b101, 0b010, 0b010, 0b010],
        'Z': [0b111, 0b001, 0b010, 0b100, 0b111],
        ' ': [0b000, 0b000, 0b000, 0b000, 0b000]
    };

    const font3x3 = {
        'A': [0b010, 0b101, 0b111],
        'B': [0b110, 0b111, 0b111],
        'C': [0b011, 0b100, 0b011],
        'D': [0b110, 0b101, 0b110],
        'E': [0b111, 0b110, 0b111],
        'F': [0b111, 0b110, 0b100],
        'G': [0b011, 0b101, 0b111],
        'H': [0b101, 0b111, 0b101],
        'I': [0b111, 0b010, 0b111],
        'J': [0b001, 0b001, 0b111],
        'K': [0b101, 0b110, 0b101],
        'L': [0b100, 0b100, 0b111],
        'M': [0b101, 0b111, 0b101],
        'N': [0b111, 0b111, 0b101],
        'O': [0b111, 0b101, 0b111],
        'P': [0b111, 0b111, 0b100],
        'Q': [0b111, 0b111, 0b001],
        'R': [0b111, 0b110, 0b101],
        'S': [0b011, 0b110, 0b111],
        'T': [0b111, 0b010, 0b010],
        'U': [0b101, 0b101, 0b111],
        'V': [0b101, 0b101, 0b010],
        'W': [0b101, 0b111, 0b101],
        'X': [0b101, 0b010, 0b101],
        'Y': [0b101, 0b010, 0b010],
        'Z': [0b111, 0b010, 0b111],
        ' ': [0b000, 0b000, 0b000] // Espace
    };

    const getCharacterMatrix = (character) => {
        if (!font3x3[character]) {
            console.warn(`Caractère "${character}" non supporté dans la police 3x3.`);
            return font3x3[' ']; // Retourner un espace vide si le caractère n'est pas trouvé
        }
        return font3x3[character];
    };

    const scrollText = (text, speed = 200) => {
        let textMatrix = Array(5).fill().map(() => []); // Initialiser une matrice vide 5xN (où N > 8 pour tenir tout le texte)

        // Créer une grande matrice contenant tous les caractères en ligne
        for (let i = 0; i < text.length; i++) {
            let charMatrix = getCharacterMatrix(text[i]);
            for (let row = 0; row < 5; row++) {
                textMatrix[row] = textMatrix[row].concat(
                    charMatrix[row].toString(2).padStart(3, '0').split('').map(Number)
                );
                textMatrix[row].push(0); // Ajouter un espace entre les caractères
            }
        }

        // Largeur totale du texte (en pixels) dans la matrice textMatrix
        let textWidth = textMatrix[0].length;

        // Défilement du texte
        let position = 0;
        let interval = setInterval(() => {
            // Créer une matrice 5x8 pour la fenêtre d'affichage
            let windowMatrix = Array(5).fill().map(() => Array(8).fill(0));

            // Remplir la fenêtre d'affichage à partir de la matrice de texte
            for (let row = 0; row < 5; row++) {
                for (let col = 0; col < 8; col++) {
                    if (position + col < textWidth) {
                        windowMatrix[row][col] = textMatrix[row][position + col];
                    }
                }
            }

            // Mettre à jour la matrice LED avec la nouvelle fenêtre d'affichage
            updateMatrix(windowMatrix);

            // Incrémenter la position pour le défilement
            position++;

            // Réinitialiser la position pour une boucle infinie
            if (position >= textWidth - 8) {
                position = 0;
            }
        }, speed);
    };

    const Rainbow = () => {
        for (let i = 0; i < 40; i++) {
            sendMIDIMessage([144, i, Math.floor(Math.random(1, 6) * 6)])
        }
    }

    const updateMatrix = (matrix) => {
        for (let row = 0; row < 5; row++) { // Utilisation des lignes du padLayout
            for (let col = 0; col < 8; col++) {
                let note = padLayout[row][col]; // Récupération des notes depuis padLayout
                let color = matrix[row][col] ? PadColors.Green : PadColors.None;
                sendMIDIMessage([144, note, color]); // 144 = Note On
            }
        }
    };

    const initVelocityToggle = () => {
        velocityToggleButton.addEventListener("click", () => {
            velocityEnabled = !velocityEnabled;
            velocityToggleButton.textContent = velocityEnabled ? "Désactiver Vélocité" : "Activer Vélocité";
        });
    };

    const initClearColorToggle = () => {
        ClearColorButton.addEventListener("click", () => {
            ClearColorsPads()
        })
    }

    const initRainBowButton = () => {
        RainBowButton.addEventListener("click", () => {
            Rainbow();
        })
    }

    function ClearColorsPads() {
        console.log("Clear Pad colors");

        // Combiner les différentes mises en page en un seul tableau
        const allLayouts = [...padLayout.flat(), ...ControlLayout.flat(), ...SceneLayout.flat(), ...OtherLayout.flat()];

        // Envoyer le message MIDI pour effacer les couleurs pour chaque note de la mise en page combinée
        allLayouts.forEach(note => {
            sendMIDIMessage([144, note, PadColors.None]);
        });
    }

    const midiNoteToFrequency = (note, tuning = 440) => {
        // Base frequency for A4, default is 440 Hz if not specified.
        const a = tuning;
        // Calculate the frequency using equal-tempered scale formula.
        const frequency = a * Math.pow(2, (note - 69) / 12);

        // If the frequency is below the audible range, adjust it.
        if (frequency < 20) {
            // Log a warning if the frequency is out of the human hearing range.
            console.warn(`Frequency ${frequency} Hz is below the audible range.`);
        }

        return frequency;
    };

    const drawOscilloscope = () => {
        requestAnimationFrame(drawOscilloscope);

        const bufferLength = analyser.fftSize;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteTimeDomainData(dataArray);

        canvasCtx.fillStyle = 'rgb(0, 0, 0)';
        canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

        canvasCtx.lineWidth = 2;
        canvasCtx.strokeStyle = 'rgb(0, 255, 0)';

        canvasCtx.beginPath();

        const sliceWidth = canvas.width * 1.0 / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
            const v = dataArray[i] / 128.0;
            const y = (v * canvas.height) / 2;

            if (i === 0) {
                canvasCtx.moveTo(x, y);
            } else {
                canvasCtx.lineTo(x, y);
            }

            x += sliceWidth;
        }

        canvasCtx.lineTo(canvas.width, canvas.height / 2);
        canvasCtx.stroke();
    };

    const playNote = (frequency, velocity) => {
        const oscillatorType = document.getElementById('oscillator-type').value;
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.type = oscillatorType;
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);

        const volume = velocityEnabled ? velocity / 127 : volumeRange.value;
        gainNode.gain.setValueAtTime(0, audioContext.currentTime); // Démarre à 0 pour l'attaque

        // Récupérer les valeurs ADSR depuis les contrôles
        const attackTime = parseFloat(document.getElementById('attack-range').value);
        const decayTime = parseFloat(document.getElementById('decay-range').value);
        const sustainLevel = parseFloat(document.getElementById('sustain-range').value) * volume;
        const releaseTime = parseFloat(document.getElementById('release-range').value);

        // Récupérer les valeurs du LFO depuis les contrôles
        const vibratoFreq = parseFloat(document.getElementById('vibrato-frequency').value);
        const vibratoDepth = parseFloat(document.getElementById('vibrato-depth').value);

        // Récupérer les valeurs du filtre depuis les contrôles
        const filterFrequency = parseFloat(document.getElementById('filter-frequency').value);
        const filterQ = parseFloat(document.getElementById('filter-q').value);

        // Créer un filtre
        const filter = audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = filterFrequency;
        filter.Q.value = filterQ;

        // Créer un LFO pour le vibrato
        const vibrato = audioContext.createOscillator();
        const vibratoGain = audioContext.createGain();

        vibrato.frequency.value = vibratoFreq;
        vibratoGain.gain.value = vibratoDepth;

        vibrato.connect(vibratoGain);
        vibratoGain.connect(oscillator.frequency);

        oscillator.connect(gainNode);
        gainNode.connect(filter);
        filter.connect(audioContext.destination);

        // Enveloppe ADSR
        const now = audioContext.currentTime;
        gainNode.gain.cancelScheduledValues(now);
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(volume, now + attackTime);
        gainNode.gain.linearRampToValueAtTime(sustainLevel, now + attackTime + decayTime);

        oscillator.start(now);
        vibrato.start(now);

        // Arrêter le son avec la phase de relâchement
        oscillator.stop(now + attackTime + decayTime + releaseTime);
        vibrato.stop(now + attackTime + decayTime + releaseTime);
        gainNode.gain.linearRampToValueAtTime(0, now + attackTime + decayTime + releaseTime);

        // Nettoyer les connexions après l'arrêt
        oscillator.onended = () => {
            oscillator.disconnect();
            gainNode.disconnect();
            filter.disconnect();
            vibrato.disconnect();
            vibratoGain.disconnect();
        };
    };

    const playNoteExtended = (frequency, velocity) => {
        const oscillatorType = document.getElementById('oscillator-type').value;
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.type = oscillatorType;
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);

        const volume = velocityEnabled ? velocity / 127 : volumeRange.value;
        gainNode.gain.setValueAtTime(0, audioContext.currentTime); // Démarre à 0 pour l'attaque

        // Récupérer les valeurs ADSR depuis les contrôles
        const attackTime = parseFloat(document.getElementById('attack-range').value);
        const decayTime = parseFloat(document.getElementById('decay-range').value);
        const sustainLevel = parseFloat(document.getElementById('sustain-range').value) * volume;
        const releaseTime = parseFloat(document.getElementById('release-range').value);

        // Récupérer les valeurs du LFO depuis les contrôles
        const vibratoFreq = parseFloat(document.getElementById('vibrato-frequency').value);
        const vibratoDepth = parseFloat(document.getElementById('vibrato-depth').value);

        // Récupérer les valeurs du filtre depuis les contrôles
        const filterFrequency = parseFloat(document.getElementById('filter-frequency').value);
        const filterQ = parseFloat(document.getElementById('filter-q').value);

        // Créer un filtre
        const filter = audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = filterFrequency;
        filter.Q.value = filterQ;

        // Créer un LFO pour le vibrato
        const vibrato = audioContext.createOscillator();
        const vibratoGain = audioContext.createGain();

        vibrato.frequency.value = vibratoFreq;
        vibratoGain.gain.value = vibratoDepth;

        vibrato.connect(vibratoGain);
        vibratoGain.connect(oscillator.frequency);

        oscillator.connect(gainNode);
        gainNode.connect(filter);
        filter.connect(audioContext.destination);

        // Enveloppe ADSR
        const now = audioContext.currentTime;
        gainNode.gain.cancelScheduledValues(now);
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(volume, now + attackTime);
        gainNode.gain.linearRampToValueAtTime(sustainLevel, now + attackTime + decayTime);
        // Le gain reste au niveau de sustain jusqu'à ce que la note soit relâchée

        oscillator.start(now);
        vibrato.start(now);

        const stop = () => {
            const stopTime = audioContext.currentTime;
            gainNode.gain.cancelScheduledValues(stopTime);
            gainNode.gain.setValueAtTime(gainNode.gain.value, stopTime);
            gainNode.gain.linearRampToValueAtTime(0, stopTime + releaseTime);

            oscillator.stop(stopTime + releaseTime);
            vibrato.stop(stopTime + releaseTime);

            // Nettoyer les connexions après l'arrêt
            oscillator.onended = () => {
                oscillator.disconnect();
                gainNode.disconnect();
                filter.disconnect();
                vibrato.disconnect();
                vibratoGain.disconnect();
            };
        };

        return {
            oscillator,
            gainNode,
            stop
        };
    };

    const handleNoteOn = (note, velocity) => {
        const keyElement = document.getElementById(`key-${note}`);
        if (keyElement) {
            keyElement.classList.add('active');
            noteDataSeries.append(new Date().getTime(), note);
            const frequency = midiNoteToFrequency(note);
            const noteObject = playNoteExtended(frequency, velocity);
            activeNotes[note] = noteObject;
        }
    };

    const handleNoteOff = (note) => {
        const keyElement = document.getElementById(`key-${note}`);
        if (keyElement) {
            keyElement.classList.remove('active');
        }
        if (activeNotes[note]) {
            activeNotes[note].stop();
            delete activeNotes[note];
        }
    };

    const handlePad = (command, note, velocity) => {
        const padElement = document.getElementById(`pad-${note}`);
        if (padElement) {
            if (velocity > 0 && command === 144) {
                sendMIDIMessage([144, note, PadColors.Green]);
                padElement.classList.add('active');
            } else {
                sendMIDIMessage([144, note, Math.floor(Math.random(1, 6) * 6)]);
                padElement.classList.remove('active');
            }
        }
    };

    const handleKnob = (note, velocity) => {
        const knobNumber = note - 47; // Ajustez selon votre mapping
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

        // Mapper les knobs aux paramètres
        const value = velocity / 127; // Valeur normalisée entre 0 et 1
        switch (knobNumber) {
            case 1:
                // Contrôle de la fréquence du vibrato
                document.getElementById('vibrato-frequency').value = value * 20; // 0 à 20 Hz
                break;
            case 2:
                // Contrôle de la profondeur du vibrato
                document.getElementById('vibrato-depth').value = value * 100; // 0 à 100 Hz
                break;
            case 3:
                // Contrôle de la fréquence du filtre
                document.getElementById('filter-frequency').value = value * 10000; // 100 à 10000 Hz
                break;
            case 4:
                // Contrôle du Q du filtre
                document.getElementById('filter-q').value = value * 20; // 0.1 à 20
                break;
            case 5:
                // Contrôle de l'attaque
                document.getElementById('attack-range').value = value * 2; // 0 à 2 s
                break;
            case 6:
                // Contrôle de la décroissance
                document.getElementById('decay-range').value = value * 2; // 0 à 2 s
                break;
            case 7:
                // Contrôle du maintien
                document.getElementById('sustain-range').value = value; // 0 à 1
                break;
            case 8:
                // Contrôle du relâchement
                document.getElementById('release-range').value = value * 2; // 0 à 2 s
                break;
            default:
                break;
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
        } else if (command === 144 && note == 68) {
            console.log("Volume");
            velocityEnabled = !velocityEnabled
            if (velocityEnabled) {
                sendMIDIMessage([144, note, PadColors.None]);
            } else {
                sendMIDIMessage([144, note, PadColors.Red]); //Only red on volume btn -_-
            }
        } else if (command === 144 && note === 98) {
            if (ShiftEnable) {
                sendMIDIMessage([144, note, PadColors.None]);
                ShiftEnable = !ShiftEnable;
            } else {
                sendMIDIMessage([144, note, PadColors.Green]);
                ShiftEnable = !ShiftEnable;
            }
            console.log("ShiftEnable : ", ShiftEnable);
        }
    };

    const initMIDI = () => {
        console.log("Initialisation du MIDI...");

        if (!navigator.requestMIDIAccess) {
            console.error("L'API Web MIDI n'est pas disponible dans ce navigateur.");
            return;
        }

        navigator.requestMIDIAccess({ sysex: false }).then(access => {
            midiAccess = access;
            updateMidiPorts();

            midiAccess.onstatechange = () => {
                updateMidiPorts();
            };

            // Écouter les sélections de ports MIDI depuis le menu
            window.electronAPI.onMidiPortSelected(({ type, id }) => {
                if (type === 'input') {
                    selectedInputId = id;
                } else if (type === 'output') {
                    selectedOutputId = id;
                }
                connectMidiDevices();
            });
        }).catch((error) => {
            console.error('Échec d\'accès au MIDI :', error);
        });
    };

    const updateMidiPorts = () => {
        availableInputs = Array.from(midiAccess.inputs.values()).map(input => ({
            id: input.id,
            name: input.name
        }));
        availableOutputs = Array.from(midiAccess.outputs.values()).map(output => ({
            id: output.id,
            name: output.name
        }));

        // Envoyer les ports MIDI disponibles au processus principal
        window.electronAPI.updateMidiPorts(availableInputs, availableOutputs);

        // Si aucun port n'est sélectionné, sélectionner le premier par défaut
        if (!selectedInputId && availableInputs.length > 0) {
            selectedInputId = availableInputs[0].id;
        }
        if (!selectedOutputId && availableOutputs.length > 0) {
            selectedOutputId = availableOutputs[0].id;
        }

        connectMidiDevices();
    };

    const connectMidiDevices = () => {
        if (input) {
            input.onmidimessage = null;
        }

        input = midiAccess.inputs.get(selectedInputId);
        output = midiAccess.outputs.get(selectedOutputId);

        if (input) {
            input.onmidimessage = handleMIDIMessage;
            console.log(`Entrée MIDI sélectionnée : ${input.name}`);
        } else {
            console.error("Aucune entrée MIDI sélectionnée.");
        }

        if (output) {
            console.log(`Sortie MIDI sélectionnée : ${output.name}`);
        } else {
            console.error("Aucune sortie MIDI sélectionnée.");
        }
    };

    const sendMIDIMessage = (message) => {
        console.log("Envoi du message MIDI :", message);
        if (output && typeof output.send === 'function') {
            try {
                output.send(message);
            } catch (error) {
                console.error("Erreur lors de l'envoi du message MIDI :", error);
            }
        } else {
            console.error("Erreur: la sortie MIDI n'est pas disponible.");
        }
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

    // Fonction pour rendre les éléments draggable
    function makeDraggable(element) {
        let offsetX, offsetY;
        let isDocked = false;

        element.onmousedown = function (e) {
            e.preventDefault();
            if (
                e.target.classList.contains('close-btn') ||
                e.target.classList.contains('resize-handle')
            ) return; // Ne pas déplacer si le bouton de fermeture ou la poignée est cliqué

            offsetX = e.clientX - element.getBoundingClientRect().left;
            offsetY = e.clientY - element.getBoundingClientRect().top;
            document.onmousemove = moveElement;
            document.onmouseup = stopDragging;

            // Empêcher la sélection de texte lors du déplacement
            document.onselectstart = function () {
                return false;
            };
        };

        function moveElement(e) {
            let x = e.clientX - offsetX;
            let y = e.clientY - offsetY;

            // Détecter les zones de docking
            const dockThreshold = 50; // Distance en pixels pour déclencher le docking
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;

            // Positions pour les coins et le centre
            const positions = [{
                    x: 0,
                    y: 0
                }, // Haut gauche
                {
                    x: windowWidth - element.offsetWidth,
                    y: 0
                }, // Haut droit
                {
                    x: 0,
                    y: windowHeight - element.offsetHeight
                }, // Bas gauche
                {
                    x: windowWidth - element.offsetWidth,
                    y: windowHeight - element.offsetHeight
                }, // Bas droit
                {
                    x: (windowWidth - element.offsetWidth) / 2,
                    y: (windowHeight - element.offsetHeight) / 2
                }, // Centre
            ];

            let dockedPosition = null;

            // Vérifier si l'élément est proche d'une position de docking
            for (let pos of positions) {
                if (Math.abs(x - pos.x) < dockThreshold && Math.abs(y - pos.y) < dockThreshold) {
                    dockedPosition = pos;
                    break;
                }
            }

            if (dockedPosition) {
                // Si proche d'une zone de docking, accrocher le cadre
                element.style.left = dockedPosition.x + 'px';
                element.style.top = dockedPosition.y + 'px';

                if (!isDocked) {
                    // Ajouter une classe ou un style pour indiquer le docking
                    element.classList.add('docked');
                }
                isDocked = true;
            } else {
                // Sinon, déplacer normalement
                element.style.left = x + 'px';
                element.style.top = y + 'px';

                if (isDocked) {
                    // Retirer la classe ou le style de docking
                    element.classList.remove('docked');
                }
                isDocked = false;
            }
        }

        function stopDragging() {
            document.onmouseup = null;
            document.onmousemove = null;
            document.onselectstart = null; // Réactiver la sélection de texte
        }
    }

    function InitCloseButton() {
        closeButtons.forEach(button => {
            button.onclick = () => {
                const frame = button.parentElement;
                if (frame) {
                    frame.style.display = "none";
                    window.electronAPI.updateMenu(frame.id, false); // Envoyer un message au processus principal pour mettre à jour le menu
                } else {
                    console.error(`Module avec l'ID ${frame.id} introuvable`);
                }
            };
        });
    }

    function makeResizable(element) {
        const resizer = element.querySelector('.resize-handle');
        let originalWidth, originalHeight, originalMouseX, originalMouseY;
        if (!resizer) return
        resizer.addEventListener('mousedown', function (e) {
            e.preventDefault();
            originalWidth = parseFloat(getComputedStyle(element).width);
            originalHeight = parseFloat(getComputedStyle(element).height);
            originalMouseX = e.clientX;
            originalMouseY = e.clientY;

            window.addEventListener('mousemove', resize);
            window.addEventListener('mouseup', stopResize);
        });

        function resize(e) {
            const width = originalWidth + (e.clientX - originalMouseX);
            const height = originalHeight + (e.clientY - originalMouseY);
            element.style.width = width + 'px';
            element.style.height = height + 'px';
        }

        function stopResize() {
            window.removeEventListener('mousemove', resize);
            window.removeEventListener('mouseup', stopResize);
        }
    }

    function InitGraph() {
        // Initialisation du graphique SmoothieCharts
        const chartCanvas = document.getElementById('notes-chart');
        const smoothie = new SmoothieChart({
            millisPerPixel: 20,
            interpolation: 'linear',
            grid: {
                strokeStyle: 'rgba(119,119,119,0.5)',
                fillStyle: 'rgba(60,60,60,0.9)',
                lineWidth: 1,
                millisPerLine: 1000,
                verticalSections: 8,
            },
            labels: {
                fillStyle: '#ffffff',
            },
            maxValue: 127,
            minValue: 0,
        });

        smoothie.streamTo(chartCanvas, 1000 /* délai de retard en ms */ );

        // Ajouter la série au graphique
        smoothie.addTimeSeries(noteDataSeries, {
            strokeStyle: 'rgba(0, 255, 0, 1)',
            fillStyle: 'rgba(0, 255, 0, 0.2)',
            lineWidth: 2,
        });
    }

    function InitMenu() {
        if (!frames) return
        const modules = Array.from(frames).map(module => {
            return {
                id: module.id,
                name: module.querySelector('h2').innerText
            };
        });

        // Envoyer la liste des modules au processus principal
        window.electronAPI.generateMenu(modules);

        // Écouter les événements pour basculer les modules envoyés depuis le processus principal
        window.electronAPI.toggleModule((event, moduleId) => {
            toggleModuleById(moduleId);
        });
    }

    function InitFrame() {
        InitCloseButton()
        frames.forEach(frame => {
            makeDraggable(frame);
            // frame.style.display = 'none';
        });
        resizableModules.forEach(module => {
            makeResizable(module);
        });
    }

    // Fonction pour basculer l'affichage des modules
    function toggleModuleById(moduleId) {
        const module = document.getElementById(moduleId);
        if (module) {
            if (module.style.display === "none") {
                module.style.display = "block";
            } else {
                module.style.display = "none";
            }
        } else {
            console.error(`Module avec l'ID ${moduleId} introuvable`);
        }
    }

    // Initialisation des événements et de l'interface
    initVelocityToggle();
    initClearColorToggle();
    initRainBowButton();

    
    initMIDI();
    ClearColorsPads();

    InitGraph();
    initConsoleLog();
    drawOscilloscope();

    InitFrame();
    InitMenu()
});