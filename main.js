// package
const {app, BrowserWindow, BrowserView, Menu, Tray, ipcMain, session, globalShortcut, shell } = require('electron')
const path = require('path')
const fs = require('fs');
// const refreshAnime = require("./preload.js")
const XMLHttpRequest = require("XMLHttpRequest").XMLHttpRequest;

// quand l'application a fini de pre charger
app.whenReady().then(() => {

  const mainWindow = new BrowserWindow({
    width: 1425 ,
    height: 710,
    // maxWidth: 1500,
    // minWidth: 1500,
    // maxHeight: 700,
    // minHeight: 700,
    icon: './Picture/kana_kuma.png',
    center: true,
    titleBarStyle: 'hidden',
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    }
  })

    // charger l'index de la page et enlever le Menu
    mainWindow.removeMenu();
    mainWindow.loadFile('index.html');

    // ouvrir les outils developeur
    mainWindow.webContents.openDevTools();

    globalShortcut.register('f6', function()
    {
      mainWindow.webContents.send('refreshDbF6', 'refresh!');
    })

    ipcMain.on('refreshMainPages', (event, arg) => {
      mainWindow.reload();
    })


    // window for Manuelle adkami
    ipcMain.on('windowsAnimeManuelle', (event, listAnimeManuelle, arrayAnimeAdkami, arrayAnimeAdkamiLastWeek) => {

      const windowsAdkamiManuelle = new BrowserWindow({
        width: 420,
        maxWidth: 420,
        minWidth: 420,
        height: 200,
        webPreferences: {
          preload: path.join(__dirname, './WindowsSecondaire/WindowsAnimeManuelle/windowsAnimeManuellePreload.js'),
          contextIsolation: true,
        }
      })

      shell.openExternal('https://www.adkami.com/agenda');

      windowsAdkamiManuelle.removeMenu();
      windowsAdkamiManuelle.loadFile('./WindowsSecondaire/WindowsAnimeManuelle/windowsAnimeManuelle.html');
      windowsAdkamiManuelle.webContents.openDevTools()

      windowsAdkamiManuelle.webContents.send('Anime_Manuelle', listAnimeManuelle, arrayAnimeAdkami, arrayAnimeAdkamiLastWeek);

      windowsAdkamiManuelle.on('closed', function()
      {
        event.returnValue = "keep on";
      });

    })

      // TOKen gestion
      // ipcMain.on('asynchronous-message', (event, token) => {
      // let code_challenge = "";
      // let a = 128;
      // let b = 'abcdefghijklmnopqrstuvwxyz1234567890-_ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      // let c = b[Math.floor(Math.random() * b.length)];
      //
      // for (let d = 0; d < a; d++)
      // {
      //   code_challenge += b[Math.floor(Math.random() * b.length)];
      // }
      //
      // let response_type = "code";
      // let client_id = "29fc8b678220461db9399d28c82624e1";
      // let state = "requestTokenMyanimelist";
      // let user = "Cheark";
      // let urlViewToken = "https://myanimelist.net/v1/oauth2/authorize?response_type=" + response_type + "&client_id=" + client_id + "&code_challenge=" + code_challenge;
      //
      // const windowToken = new BrowserWindow({
      //    width: 1500,
      //    height: 900,
      //    darkTheme: true,
      //    webPreferences: {
      //      preload: path.join(__dirname, './secondeWindow/seconpreload.js'),
      //      contextIsolation: true
      //    }
      //  })

    //   const viewToken = new BrowserView()
    //   windowToken.setBrowserView(viewToken)
    //   viewToken.setAutoResize({width:true, height:true, x:false, y:false})
    //   viewToken.setBounds({ x: 50, y: 100, width: 1250, height: 1500 })
    //   viewToken.webContents.loadURL(urlViewToken)
    //
    //   windowToken.removeMenu();
    //   windowToken.webContents.openDevTools();
    //   windowToken.loadFile('./secondeWindow/secondeWindow.html');
    //
    //   ipcMain.on('Cannel-Url', (event, url_test) => {
    //     let url_code = viewToken.webContents.getURL();
    //     let code = url_code.split("=");
    //
    //     let data = "client_id=" + client_id + "&code=" + code[1] + "&code_verifier=" + code_challenge + "&grant_type=authorization_code";
    //
    //     let request = new XMLHttpRequest();
    //     let url = "https://myanimelist.net/v1/oauth2/token";
    //     request.withCredentials = true;
    //
    //     request.addEventListener("readystatechange", function() {
    //       if(this.readyState === 4)
    //       {
    //         fs.writeFile("./Json/token.json", request.reponseText, function(err, result)
    //           {
    //             if(err)
    //               {
    //                 console.log('error', err);
    //               }
    //               else
    //               {
    //                 console.log("Filte Token: update");
    //               }
    //           });
    //       }
    //     });
    //     request.open('post', url);
    //     request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    //     request.send(data);
    //
    //   })
    // })


  //icone barre tache '''''''''''''''''''''''''a continuer
  // let tray = new Tray('./Picture/kana_kuma.jpg')
  // const contextMenu = Menu.buildFromTemplate([{ label: 'salut', type: 'radio' }])
  // tray.setToolTip('anime')
  // tray.setContextMenu(contextMenu)
  })
