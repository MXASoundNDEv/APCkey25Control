const { log } = require('console');
const {
    app,
    BrowserWindow,
    ipcMain,
    Menu,
    crashReporter,
    dialog
} = require('electron');
const path = require('path');

let win;
let moduleStates = {};
let moduleList = [];
let midiInputs = [];
let midiOutputs = [];
let selectedMidiInput = null;
let selectedMidiOutput = null;

function createWindow() {
    win = new BrowserWindow({
        width: 1000,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            enableWebMIDI: true,
        }
    });
    crashReporter.start({
        productName: 'APC Key 25 GUI',
        companyName: 'MXA',
        uploadToServer: false,
        compress: true,
    });
    win.loadFile('index.html');

    ipcMain.on('generate-menu', (event, receivedModuleList) => {
        moduleList = receivedModuleList;
        moduleList.forEach(module => {
            if (!(module.id in moduleStates)) {
                moduleStates[module.id] = true;
            }
        });
        generateMenu();
    });

    ipcMain.on('update-menu', (event, moduleId, isVisible) => {
        moduleStates[moduleId] = isVisible;
        generateMenu();
    });

    ipcMain.on('update-midi-ports', (event, {
        inputs,
        outputs
    }) => {
        midiInputs = inputs;
        midiOutputs = outputs;
        generateMenu();
    });

    ipcMain.on('select-midi-port', (event, {
        type,
        id
    }) => {
        if (type === 'input') {
            selectedMidiInput = id;
        } else if (type === 'output') {
            selectedMidiOutput = id;
        }
        // Inform the renderer process about the new selection
        win.webContents.send('midi-port-selected', {
            type,
            id
        });
    });

    ipcMain.on('show-about', () => {
        const {
            dialog
        } = require('electron');
        dialog.showMessageBox(win, {
            type: 'info',
            title: 'À propos',
            message: 'Votre application Electron - Version 1.0.0',
            detail: 'Développé par Max'
        });
    });
}

function generateMenu() {
    const fileMenu = {
        label: 'Fichier',
        submenu: [{
                label: 'Nouvelle fenêtre',
                click: () => {
                    const newWindow = new BrowserWindow({
                        width: 400,
                        height: 300,
                        webPreferences: {
                            preload: path.join(__dirname, 'preload.js'),
                            nodeIntegration: false,
                            contextIsolation: true,
                            enableWebMIDI: true,
                        }
                    });
                    newWindow.loadFile('index.html');
                }
            },
            {
                type: 'separator'
            },
            {
                label: 'Quitter',
                role: 'quit'
            }
        ]
    };

    const viewMenu = {
        label: 'Affichage',
        submenu: [{
                role: 'reload'
            },
            {
                role: 'toggleDevTools'
            },
            {
                type: 'separator'
            },
            {
                role: 'resetZoom'
            },
            {
                role: 'zoomIn'
            },
            {
                role: 'zoomOut'
            },
            {
                type: 'separator'
            },
            {
                role: 'togglefullscreen'
            }
        ]
    };

    const midiMenu = {
        label: 'MIDI',
        submenu: [{
                label: 'Entrées MIDI',
                submenu: midiInputs.map(input => ({
                    label: input.name,
                    type: 'radio',
                    checked: input.id === selectedMidiInput,
                    click: () => {
                        selectedMidiInput = input.id;
                        win.webContents.send('midi-port-selected', {
                            type: 'input',
                            id: input.id
                        });
                        generateMenu();
                    }
                }))
            },
            {
                label: 'Sorties MIDI',
                submenu: midiOutputs.map(output => ({
                    label: output.name,
                    type: 'radio',
                    checked: output.id === selectedMidiOutput,
                    click: () => {
                        selectedMidiOutput = output.id;
                        win.webContents.send('midi-port-selected', {
                            type: 'output',
                            id: output.id
                        });
                        generateMenu();
                    }
                }))
            },
        ]
    };

    const helpMenu = {
        label: 'Aide',
        submenu: [{
                label: 'Documentation',
                click: async () => {
                    const {
                        shell
                    } = require('electron');
                    await shell.openExternal('https://www.electronjs.org/docs');
                }
            },
            {
                label: 'À propos',
                click: () => {
                    ipcMain.emit('show-about');
                }
            }
        ]
    };

    const modulesMenu = {
        label: 'Modules',
        submenu: moduleList.map((module) => {
            return {
                label: `Afficher ${module.name}`,
                type: "checkbox",
                checked: moduleStates[module.id],
                click: () => {
                    moduleStates[module.id] = !moduleStates[module.id];
                    win.webContents.send('toggle-module', module.id);
                    generateMenu();
                }
            };
        })
    };

    const devMenu = {
        label: 'Développeur',
        submenu: [{
                label: 'Crash',
                click: async() => {
                    const result = await dialog.showMessageBox({
                        title : "CRASH BUTTON",
                        message : "This button make app crash instantly are you sure ?",
                        buttons : ["MAKE APP CRASH", "Cancel"]
                    })
                    
                    if (result.response == 0) {
                        console.warn("Manual Crash");
                        process.crash()
                    }
                }

            },
            {
                label: 'Open Crash Log debug',
                click: () => {
                    const crashDir = app.getPath('crashDumps');
                    FileDialog('CrashLog Directory', crashDir, 'Debug')
                }
            }
        ]
    };

    const menuTemplate = [
        fileMenu,
        viewMenu,
        modulesMenu,
        midiMenu,
        helpMenu,
        devMenu
    ];

    const menu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(menu);
}

function FileDialog(title,Dir, BtnLabel, Properties = ['openFile']) {
    const options = {
        title: title,
        defaultPath: Dir,
        buttonLabel: BtnLabel,
        properties: Properties // 'openFile' pour fichiers, 'openDirectory' pour dossiers (Par Default)
    };

    dialog.showOpenDialog(options).then((result) => {
        if (!result.canceled) {
            console.log('Chemin(s) sélectionné(s) :', result.filePaths);
            return result.filePath
        }
    }).catch((err) => {
        console.error('Erreur lors de l\'ouverture de la boîte de dialogue :', err);
    });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});