// package
const {app, BrowserWindow, Menu, Tray, ipcMain, session } = require('electron')
const path = require('path')


// quand l'application a fini de pre charger
app.whenReady().then(() => {

  const mainWindow = new BrowserWindow({
    width: 1530,
    height: 650,
    // maxWidth: 800,
    // minWidth: 800,
    // maxHeight: 600,
    // minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true
    }
  })

    // charger l'index de la page et enlever le Menu
    mainWindow.removeMenu();
    mainWindow.loadFile('index.html');

    // ouvrir les outils developeur
    mainWindow.webContents.openDevTools();

  //icone barre tache '''''''''''''''''''''''''a continuer
  let tray = new Tray(path.join(__dirname, './Picture/sardoche_army.jpg'))
  const contextMenu = Menu.buildFromTemplate([{ label: 'salut', type: 'radio' }])
  tray.setToolTip('anime')
  tray.setContextMenu(contextMenu)
  })

  // Quit when all windows are closed, except on macOS. There, it's common
  // for applications and their menu bar to stay active until the user quits
  // explicitly with Cmd + Q.
  app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit()
  })

  // In this file you can include the rest of your app's specific main process
  // code. You can also put them in separate files and require them here.
