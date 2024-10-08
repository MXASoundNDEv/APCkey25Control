const {
    app,
    BrowserWindow,
    ipcMain
} = require('electron');
const path = require('path'); // Importer le module path
const midi = require('midi'); // Utiliser la bibliothèque 'midi'

let midiOutput; // Instance de sortie MIDI

// Créer la fenêtre de l'application
function createWindow() {
    const win = new BrowserWindow({
        width: 1000,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'), // Utiliser path pour obtenir le bon chemin
            nodeIntegration: false,
            contextIsolation: true,
        }
    });

    win.loadFile('index.html');
}

// Gestion des messages MIDI entrants et sortants
ipcMain.on('start-midi', (event) => {
    const midiInput = new midi.Input();
    const midiOutput = new midi.Output();

    // Liste des ports MIDI disponibles
    console.log('Ports MIDI disponibles :');
    for (let i = 0; i < midiInput.getPortCount(); i++) {
        console.log(`Input Port ${i}: ${midiInput.getPortName(i)}`);
    }
    for (let i = 0; i < midiOutput.getPortCount(); i++) {
        console.log(`Output Port ${i}: ${midiOutput.getPortName(i)}`);
    }

    midiOutput.openPort(0); // Ouvrir le premier port de sortie MIDI
    midiInput.openPort(0); // Ouvrir le premier port d'entrée MIDI
    midiInput.on('message', (deltaTime, message) => {
        console.log(`Message MIDI reçu: ${message}`);
        event.sender.send('midi-message', message); // Envoyer les messages MIDI au processus de rendu
    });
});


// Réception des messages MIDI du processus de rendu et envoi au contrôleur
ipcMain.on('send-midi-message', (event, message) => {
    if (midiOutput) {
        midiOutput.sendMessage(message); // Envoie le message MIDI
    }
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (midiOutput) {
        midiOutput.closePort(); // Ferme le port MIDI à la fermeture de l'application
    }
    if (process.platform !== 'darwin') app.quit();
});
