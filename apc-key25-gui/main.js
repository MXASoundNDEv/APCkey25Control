const {
    app,
    BrowserWindow,
    ipcMain,
    Menu
} = require('electron');
const path = require('path'); // Importer le module path
const midi = require('midi'); // Utiliser la bibliothèque 'midi'
const {
    type
} = require('os');

let midiOutput; // Instance de sortie MIDI
let win; // Instance de la fenêtre principale
let moduleStates = {}; // Stocker l'état des modules (affichés ou non)

// Créer la fenêtre de l'application
function createWindow() {
    win = new BrowserWindow({
        width: 1000,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'), // Utiliser path pour obtenir le bon chemin
            nodeIntegration: false,
            contextIsolation: true,
        }
    });

    win.loadFile('index.html');

    // Écouter le message envoyé depuis le processus de rendu pour générer le menu
    ipcMain.on('generate-menu', (event, moduleList) => {
        // Initialiser les états des modules à 'false' (caché) au départ
        moduleList.forEach(module => {
            moduleStates[module.id] = true; // Tous les modules sont afficher par défaut
        });
        generateMenu(moduleList);
    });

    // Écouter les messages envoyés par les boutons "Fermer" des modules
    ipcMain.on('update-menu', (event, moduleId, isVisible) => {
        moduleStates[moduleId] = isVisible; // Mettre à jour l'état du module
        generateMenu(Object.keys(moduleStates).map(id => ({
            id,
            name: id
        }))); // Re-générer le menu pour refléter les nouvelles cases cochées
    });
}

// Génération dynamique du menu
function generateMenu(moduleList) {
    // Menu Fichier
    const fileMenu = {
        label: 'Fichier',
        submenu: [{
                label: 'Nouvelle fenêtre',
                click: () => {
                    const newWindow = new BrowserWindow({
                        width: 400,
                        height: 300
                    });
                    newWindow.loadFile('index.html');
                }
            },
            {
                type: 'separator'
            }, // Séparateur
            {
                label: 'Quitter',
                role: 'quit' // Rôle prédéfini pour quitter l'application
            }
        ]
    };

    // Menu Affichage
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

    // Menu Aide
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
                    win.webContents.send('show-about');
                }
            }
        ]
    };

    // Menu Modules dynamique
    const modulesMenu = {
        label: 'Modules',
        submenu: moduleList.map((module) => {
            return {
                label: `Show ${module.name}`,
                type: "checkbox",
                checked: moduleStates[module.id], // Utilise l'état actuel du module
                click: () => {
                    // Basculer l'affichage du module
                    moduleStates[module.id] = !moduleStates[module.id];
                    win.webContents.send('toggle-module', module.id);

                    // Re-générer le menu pour refléter les nouvelles cases cochées
                    generateMenu(moduleList);
                }
            };
        })
    };

    // Création du template de menu avec plusieurs sections
    const menuTemplate = [
        fileMenu, // Menu Fichier
        viewMenu, // Menu Affichage
        modulesMenu, // Menu Modules généré dynamiquement
        helpMenu // Menu Aide
    ];

    const menu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(menu);
}

// Gestion des messages MIDI entrants et sortants
ipcMain.on('start-midi', (event) => {
    const midiInput = new midi.Input();
    midiOutput = new midi.Output(); // Créer une instance de sortie MIDI

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

// Réception des messages MIDI du processus de rendu et envoi au contrôleur MIDI
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