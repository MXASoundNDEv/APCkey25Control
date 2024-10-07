const {
    app,
    BrowserWindow,
    ipcMain
} = require('electron');
const path = require('path');
const midi = require('midi');

// Créer une instance d'entrée MIDI
const input = new midi.Input();

function createWindow() {
    const win = new BrowserWindow({
        width: 1000,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'), // Nouvelle configuration pour le preload
            nodeIntegration: false, // Important pour la sécurité
            contextIsolation: true, // Pour éviter l'accès non sécurisé à Node.js dans le processus de rendu
            enableRemoteModule: false
        }
    });

    win.loadFile('index.html');
}

// Gestion des messages MIDI
ipcMain.on('start-midi', (event) => {
    // Trouver le port MIDI de l'APC Key25
    for (let i = 0; i < input.getPortCount(); i++) {
        if (input.getPortName(i).includes('APC Key 25')) {
            input.openPort(i);
            console.log("APC Key25 connecté.");
            break;
        }
    }

    // Écouter les messages MIDI
    input.on('message', (deltaTime, message) => {
        // Envoyer les messages MIDI au processus de rendu
        event.sender.send('midi-message', message);
    });
});

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    input.closePort(); // Fermer le port MIDI proprement
    if (process.platform !== 'darwin') app.quit();
});