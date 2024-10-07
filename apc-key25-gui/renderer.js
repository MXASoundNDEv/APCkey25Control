document.addEventListener('DOMContentLoaded', () => {
    let activeKnob = null;
    let velocityEnabled = true; // Par défaut, vélocité activée

    document.getElementById("velocity-toggle").addEventListener("click", () => {
        velocityEnabled = !velocityEnabled;
        document.getElementById("velocity-toggle").textContent = velocityEnabled ? "Désactiver Vélocité" : "Activer Vélocité";
    });

    const VolumeRange = document.getElementById(`Audio-Range`);

    const audioContext = new(window.AudioContext || window.webkitAudioContext)(); // Créer un contexte audio

    // Fonction pour jouer une note en prenant en compte la vélocité
    const playNote = (frequency, velocity) => {
        const oscillator = audioContext.createOscillator(); // Générer un oscillateur
        const gainNode = audioContext.createGain(); // Créer un gain pour ajuster le volume

        oscillator.type = 'square'; // Type d'onde (sine, square, triangle, etc.)
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime); // Fréquence de la note

        // Calculer le volume en fonction de la vélocité (0 à 127, que l'on normalise entre 0 et 1)
        const volume = velocityEnabled ? velocity / 127 : VolumeRange.value;
        gainNode.gain.setValueAtTime(volume, audioContext.currentTime); // Réglez le gain selon la vélocité

        oscillator.connect(gainNode); // Connecter l'oscillateur au gain
        gainNode.connect(audioContext.destination); // Connecter au haut-parleur

        oscillator.start(); // Jouer la note
        oscillator.stop(audioContext.currentTime + 0.5); // Arrêter la note après 0.5 seconde
    };

    let output = null; // Initialisation de la sortie MIDI

    navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);

    function onMIDISuccess(midiAccess) {
        // Sélectionner l'input (pour recevoir les messages MIDI)
        const input = [...midiAccess.inputs.values()].find(device => device.name.includes('APC Key 25'));

        // Sélectionner l'output (pour envoyer des messages MIDI)
        const outputs = [...midiAccess.outputs.values()];
        output = outputs.find(device => device.name.includes('APC Key 25')); // Sélectionne la sortie MIDI
        if (!output) {
            console.error("Aucune sortie MIDI trouvée.");
        }

        if (input) {
            input.onmidimessage = (message) => {
                const [command, note, velocity] = message.data;

                if (command === 144 && velocity > 0) {
                    const displayVelocity = velocityEnabled ? velocity : 127; // Vélocité désactivée -> 127
                    document.getElementById(`key-${note}`).classList.add('active');
                    console.log(`Note ON: ${note}, Vélocité: ${displayVelocity}`);
                } else if (command === 128 || (command === 144 && velocity === 0)) {
                    document.getElementById(`key-${note}`).classList.remove('active');
                    console.log(`Note OFF: ${note}`);
                }
            };
        }
    }

    function onMIDIFailure() {
        console.error('Échec d\'accès au MIDI.');
    }

    // Fonction pour envoyer un message MIDI
    function sendMIDIMessage(message) {
        console.log("Envoi du message MIDI :", message); // Journal pour vérifier l'envoi de messages
        if (output && typeof output.send === 'function') {
            output.send(message); // Envoie le message MIDI via la sortie sélectionnée
        } else {
            console.error("Erreur: la sortie MIDI n'est pas disponible ou la fonction d'envoi n'existe pas.");
        }
    }

    const PadColors = {
        Green: 1,
        GreenBlink: 2,
        Red: 3,
        RedBlink: 4,
        Orange: 5,
        OrangeBlink: 6
    }

    // Démarrer l'écoute des messages MIDI
    window.midi.startListening();

    // Réagir aux messages MIDI
    window.midi.onMessage((message) => {
        // console.log(message);

        const [command, note, velocity] = message;

        console.log(`command : ${command}`);
        console.log(`note : ${note}`);
        console.log("velocity : ", velocity);

        // Gestion des touches du clavier
        if (command === 145 || command === 129) { // Notes MIDI pour le clavier
            const keyElement = document.getElementById(`key-${note}`);
            if (keyElement) { // Vérifie si l'élément existe
                if (command === 145 && note >= 48 && note <= 72 && velocity > 0) { // Commande Note On
                    keyElement.classList.add('active');
                    const frequency = midiNoteToFrequency(note); // Convertir la note MIDI en fréquence
                    playNote(frequency, velocity); // Jouer la note
                } else if (command === 129 || (command === 145 && velocity === 0)) { // Commande Note Off
                    keyElement.classList.remove('active');
                }
            } else {
                console.warn(`Aucun élément trouvé pour la note du clavier ${note}`);
            }
        }

        // Gestion des pads (notes MIDI 0 à 64)
        // COuleur  Red = 3 Green = 1 GBlink = 2 orange = 5 Oblink= 6 RBlink =4
        if ((command === 144 || command === 128) && note >= 0 && note <= 64) {
            const padElement = document.getElementById(`pad-${note}`);

            if (padElement) {
                if (velocity > 0 && command === 144) { // Allumer la LED
                    // Envoi du message pour allumer la LED du pad
                    sendMIDIMessage([144, note, PadColors.Green]);
                    padElement.classList.add('active');
                } else { // Éteindre la LED
                    sendMIDIMessage([144, note, 0]);
                    padElement.classList.remove('active');
                }
            }
        }

        // Gestion des potentiomètres (CC - Control Change pour knobs)
        if (command === 176 && note >= 48 && note <= 55) {
            const knobNumber = note - 47;
            const knobElement = document.getElementById(`knob-${knobNumber}`);
            const indicator = knobElement.querySelector('.knob-indicator');

            if (indicator) {
                // Calculer l'angle de rotation en fonction de la vélocité (0-127 -> 0-270 degrés)
                const rotationDegree = (velocity / 127) * 270 - 135;
                indicator.style.transform = `rotate(${rotationDegree}deg)`;

                // Gérer la classe active pour ne laisser qu'un seul knob activé
                if (activeKnob && activeKnob !== knobElement) {
                    activeKnob.classList.remove('active');
                }
                knobElement.classList.add('active');
                activeKnob = knobElement;
            }
        }
    });

    // Fonction pour convertir une note MIDI en fréquence (ex. note 69 = A4 = 440Hz)
    const midiNoteToFrequency = (note) => {
        const a = 440; // Fréquence de A4 (note MIDI 69)
        return a * Math.pow(2, (note - 69) / 12);
    };
});