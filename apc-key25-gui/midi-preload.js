// midi-preload.js
const { contextBridge, ipcRenderer } = require('electron');

// Expose ipcRenderer to the web page
contextBridge.exposeInMainWorld('electronAPI', {
    receiveMidiPorts: (callback) => ipcRenderer.on('midi-ports', (event, ports) => callback(event, ports)),
    connectMidi: (ports) => ipcRenderer.send('connect-midi', ports),
});
