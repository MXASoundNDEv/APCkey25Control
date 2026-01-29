const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');

const isDev = Boolean(process.env.VITE_DEV_SERVER_URL);

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1280,
    height: 900,
    minWidth: 1100,
    minHeight: 720,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      enableWebMIDI: true
    }
  });

  const prodIndex = path.join(__dirname, '..', 'dist', 'index.html');
  const devUrl = process.env.VITE_DEV_SERVER_URL || `file://${prodIndex}`;

  if (isDev) {
    win.loadURL(devUrl);
    win.webContents.openDevTools({ mode: 'detach' });
  } else {
    win.loadFile(prodIndex);
  }

  const template = [
    {
      label: 'Fichier',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { type: 'separator' },
        { role: 'quit', label: 'Quitter' }
      ]
    },
    {
      label: 'Affichage',
      submenu: [
        { role: 'toggleDevTools', label: 'Outils de développement' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Plein écran' }
      ]
    },
    {
      label: 'Aide',
      submenu: [
        {
          label: 'Documentation Electron',
          click: () => shell.openExternal('https://www.electronjs.org/docs/latest')
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
};

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
