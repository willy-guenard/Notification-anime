// package
const {app, BrowserWindow, BrowserView, Menu, Tray, ipcMain, session } = require('electron')
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
      let code_challenge = "";
      let a = 128;
      let b = 'abcdefghijklmnopqrstuvwxyz1234567890-_.~ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      let c = b[Math.floor(Math.random() * b.length)];

      for (let d = 0; d < a; d++)
      {
        code_challenge += b[Math.floor(Math.random() * b.length)];
      }

      let response_type = "code";
      let client_id = "29fc8b678220461db9399d28c82624e1";
      let state = "requestTokenMyanimelist";
      let urlViewToken = "https://myanimelist.net/v1/oauth2/authorize?response_type=" + response_type + "&client_id=" + client_id + "&code_challenge=" + code_challenge + "&state=" + state;


      const windowToken = new BrowserWindow({
         width: 1500,
         height: 900,
         darkTheme: true,
         webPreferences: {
           preload: path.join(__dirname, './secondeWindow/seconpreload.js'),
           contextIsolation: true
         }
       })

      const viewToken = new BrowserView()
      windowToken.setBrowserView(viewToken)
      viewToken.setAutoResize({width:true, height:true, x:false, y:false})
      viewToken.setBounds({ x: 50, y: 100, width: 1000, height: 1500 })
      viewToken.webContents.loadURL(urlViewToken)

      windowToken.removeMenu();
      windowToken.webContents.openDevTools();
      windowToken.loadFile('./secondeWindow/secondeWindow.html');


      ipcMain.on('Cannel-Url', (event, url) => {
        let boite = viewToken.webContents.getURL();
        console.log(boite);
      })
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
