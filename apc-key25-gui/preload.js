const {
    contextBridge,
    ipcRenderer
} = require('electron');

// Exposer des méthodes sécurisées au renderer
contextBridge.exposeInMainWorld('midi', {
    startListening: () => ipcRenderer.send('start-midi'),
    onMessage: (callback) => ipcRenderer.on('midi-message', (event, message) => callback(message))
});