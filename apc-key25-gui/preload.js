const { contextBridge, ipcRenderer } = require('electron');

// Exposer des méthodes sécurisées au renderer pour la gestion des modules et de l'interface
contextBridge.exposeInMainWorld('electronAPI', {
    // Gestion des modules
    toggleModule: (callback) => ipcRenderer.on('toggle-module', (event, moduleId) => callback(event, moduleId)),
    generateMenu: (moduleList) => ipcRenderer.send('generate-menu', moduleList),
    updateMenu: (moduleId, isVisible) => ipcRenderer.send('update-menu', moduleId, isVisible),

    // Pour afficher la fenêtre "À propos"
    showAbout: (callback) => ipcRenderer.on('show-about', callback),

    // Mise à jour des ports MIDI disponibles
    updateMidiPorts: (inputs, outputs) => ipcRenderer.send('update-midi-ports', { inputs, outputs }),

    // Écouter la sélection des ports MIDI
    onMidiPortSelected: (callback) => ipcRenderer.on('midi-port-selected', (event, data) => callback(data)),

    // Sélectionner un port MIDI (si besoin)
    selectMidiPort: (type, id) => ipcRenderer.send('select-midi-port', { type, id }),
});
