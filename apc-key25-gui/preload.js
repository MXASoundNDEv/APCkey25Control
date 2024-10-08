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

// Expose ipcRenderer to the web page
contextBridge.exposeInMainWorld('electronAPI', {
    toggleModule: (callback) => ipcRenderer.on('toggle-module', callback),
    generateMenu: (moduleList) => ipcRenderer.send('generate-menu', moduleList),
    updateMenu: (moduleId, isVisible) => ipcRenderer.send('update-menu', moduleId, isVisible) // Mettre à jour l'état du module dans le menu
});