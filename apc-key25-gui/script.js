document.addEventListener('DOMContentLoaded', () => {
    let activeKnob = null;

    // Démarrer l'écoute des messages MIDI
    window.midi.startListening();

    // Réagir aux messages MIDI
    window.midi.onMessage((message) => {
        const [command, note, velocity] = message;

        // Si c'est un message de Control Change (CC) pour les potentiomètres (knobs)
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