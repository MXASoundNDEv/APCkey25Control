const font5x8 = require('./font5x8.js');
const PadColors = {
    Green: 1,   // Couleur verte sur l'AKAI APC Key 25
    Off: 0      // Éteindre la LED
};

let midiAccess = null;
let outputDevice = null;

// Initialiser l'accès au MIDI
navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);

function onMIDISuccess(midi) {
    midiAccess = midi;
    // Choisir le bon périphérique de sortie (Akai APC Key 25)
    for (let output of midiAccess.outputs.values()) {
        if (output.name.includes('APC Key 25')) {
            outputDevice = output;
            console.log('AKAI APC Key 25 connecté!');
        }
    }

    // Démarrer le défilement une fois que l'appareil est connecté
    if (outputDevice) {
        scrollText("REAL SPIRIT SOUNDSYSTEM", 200);
    } else {
        console.log('APC Key 25 non trouvé!');
    }
}

function onMIDIFailure() {
    console.error("Échec de l'accès MIDI.");
}

// Fonction pour envoyer un message MIDI à l'APC Key 25
function sendMIDIMessage(message) {
    if (outputDevice) {
        outputDevice.send(message);
    }
}

// Fonction pour récupérer la matrice d'un caractère
function getCharacterMatrix(character) {
    return font5x8[character] || font5x8[' '];  // Retourne l'espace par défaut si le caractère n'est pas trouvé
}

// Fonction pour allumer les LEDs d'une matrice 8x8
function updateMatrix(matrix) {
    for (let row = 0; row < 5; row++) {  // APC Key 25 a une grille de 5x8
        for (let col = 0; col < 8; col++) {
            let note = row * 8 + col + 36; // Les notes MIDI des pads commencent à 36
            let color = matrix[row][col] ? PadColors.Green : PadColors.Off;
            sendMIDIMessage([144, note, color]); // 144 = Note On
        }
    }
}

// Fonction pour afficher du texte défilant sur l'APC Key 25
function scrollText(text, speed = 200) {
    let matrix = Array(5).fill().map(() => Array(8).fill(0)); // Matrice vide 5x8 pour APC Key 25
    let textMatrix = [];

    // Créer une grande matrice contenant tous les caractères en ligne
    for (let i = 0; i < text.length; i++) {
        let charMatrix = getCharacterMatrix(text[i]);
        for (let row = 0; row < 8; row++) {
            textMatrix[row] = (textMatrix[row] || []).concat(
                charMatrix[row].toString(2).padStart(5, '0').split('').map(Number)
            );
            textMatrix[row].push(0);  // Espace entre les lettres
        }
    }

    // Défilement du texte
    let position = 0;
    let interval = setInterval(() => {
        // Découper une fenêtre 5x8 à partir de la matrice texte
        for (let row = 0; row < 5; row++) {
            matrix[row] = textMatrix[row].slice(position, position + 8);
        }
        updateMatrix(matrix);  // Mettre à jour la matrice LED
        position++;

        // Si tout le texte est défilé, réinitialiser la position
        if (position > textMatrix[0].length - 8) {
            position = 0;
        }
    }, speed);
}
