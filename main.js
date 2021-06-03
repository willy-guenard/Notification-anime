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

    ipcMain.on('asynchronous-message', (event, token) => {

      var creatToken = new BrowserWindow({
        width: 1090,
        height: 900,
        // maxWidth: 701,
        // minWidth: 701,
        // maxHeight: 600,
        // minHeight: 600,
        modal: true,
      })

      creatToken.removeMenu();
      creatToken.webContents.openDevTools();
      creatToken.loadURL('https://myanimelist.net/v1/oauth2/authorize?response_type=code&client_id=29fc8b678220461db9399d28c82624e1&code_challenge=NklUDX_CzS8qrMGWaDzgKs6VqrinuVFHa0xnpWPDy7_fggtM6kAEr4jnTwOgzK7nPYfE9n60rsY4fhDExWzr5bf7PEvMMmSXcT2hWkCstFGIJKoaimoq5GvAEQD8NZ8g&state=testApi1');

      // set to null
      creatToken.on('close', () => {
      let boite = creatToken.URl;
      console.log(boite);
      });

    })


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
