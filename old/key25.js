const midi = require('midi');

// Créer une nouvelle instance d'entrée MIDI
const input = new midi.Input();

// Trouver l'appareil Akai APC Key25
const portCount = input.getPortCount();
let apcKey25Port = null;

for (let i = 0; i < portCount; i++) {
    const portName = input.getPortName(i);
    if (portName.includes('APC Key 25')) {
        apcKey25Port = i;
        console.log(`Appareil trouvé : ${portName} sur le port ${i}`);
        break;
    }
}

if (apcKey25Port === null) {
    console.log("Aucun APC Key25 trouvé. Vérifiez la connexion MIDI.");
    process.exit();
}

// Ouvrir le port MIDI de l'APC Key25
input.openPort(apcKey25Port);

// Écouter les événements MIDI
input.on('message', (deltaTime, message) => {
    const [command, note, velocity] = message;

    // Affiche les données brutes
    console.log(`Message reçu : [${message.join(', ')}]`);

    // Interpréter le message
    if (command === 144 && velocity > 0) {
        console.log(`Note ON: Touche ${note}, Vélocité: ${velocity}`);
    } else if (command === 128 || (command === 144 && velocity === 0)) {
        console.log(`Note OFF: Touche ${note}`);
    } else if (command === 176) {
        console.log(`Potentiomètre tourné : ${note}, Valeur: ${velocity}`);
    }
});

// Arrêter proprement l'entrée MIDI quand le programme est arrêté
process.on('SIGINT', () => {
    input.closePort();
    console.log('Port MIDI fermé.');
    process.exit();
});