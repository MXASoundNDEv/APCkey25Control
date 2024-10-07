document.addEventListener('DOMContentLoaded', () => {
    let activeKnob = null;

    // Démarrer l'écoute des messages MIDI
    window.midi.startListening();

    // Réagir aux messages MIDI
    window.midi.onMessage((message) => {
        console.log(message);

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
                } else if (command === 129 || (command === 145 && velocity === 0)) { // Commande Note Off
                    keyElement.classList.remove('active');
                }
            } else {
                console.warn(`Aucun élément trouvé pour la note du clavier ${note}`);
            }
        }

        // Gestion des pads (notes MIDI 36 à 51)
        if (command === 144 || command === 128) {
            const padElement = document.getElementById(`pad-${note}`);
            if (padElement) { // Vérifie si l'élément existe
                if (command === 144 && note >= 0 && note <= 39 && velocity > 0 || command === 144 && note >= 64 && note <= 71) { // Commande Note On pour les pads //Velocity always 127 WTF
                    console.log(`Active ${note}`);
                    padElement.classList.add('active');
                } else if (command === 128) { // Commande Note Off
                    padElement.classList.remove('active');
                }
            } else {
                console.warn(`Aucun élément trouvé pour le pad ${note}`);
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
});