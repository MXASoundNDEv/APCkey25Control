const {
    contextBridge,
    ipcRenderer
} = require('electron');

// Exposer des méthodes sécurisées au renderer
contextBridge.exposeInMainWorld('midi', {
    startListening: () => ipcRenderer.send('start-midi'),
    onMessage: (callback) => ipcRenderer.on('midi-message', (event, message) => callback(message)),
    sendMIDIMessage: (message) => ipcRenderer.send('send-midi-message', message) // Envoie le message MIDI au processus principal
});