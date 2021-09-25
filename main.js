// package
const { app, BrowserWindow, BrowserView, Menu, Tray, ipcMain, globalShortcut, shell } = require('electron')
const path = require('path')
const fs = require('fs');
const jsonUserSetting = require('./Ressources/userSetting.json')

// quand l'application a fini de pre charger
app.whenReady().then(() => {

  creatMainWindow();

  if ( jsonUserSetting.UserMyanimelist == "" )
  {
    creatUserMyanimelistWindow();
  }
  else
  {
    mainWindow.webContents.send('refreshDbF6', 'refresh!');
  }

  trayConfig();
})

//// Main Windows Agenda////////////////////////////////////////////////////////
function creatMainWindow()
{
   mainWindow = new BrowserWindow({
    width: 1425,
    height: 710,
    minWidth: 1000,
    minheight: 470,
    icon: './Ressources/Icone/kana_kuma.png',
    center: true,
    titleBarStyle: 'hidden',
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, './src/Main/preload.js'),
      contextIsolation: true,
      nativeWindowOpen: true,
    }
  })
    // charger l'index de la page et enlever le Menu
    mainWindow.removeMenu();
    mainWindow.loadFile('./src/Main/index.html');

    // ouvrir les outils developeur
    mainWindow.webContents.openDevTools();

    globalShortcut.register('f6', function()
    {
      mainWindow.webContents.send('refreshDbF6', 'refresh!');
    })

    ipcMain.on('refreshMainPages', (event, arg) => {
      mainWindow.reload();
    })
}

///////Window parametre/////////////////////////////////////////////////////////
function creatSettingWindow()
{
  windowSetting = new BrowserWindow({
    width: mainWindowState.width,
    height: height.height,
    x: mainWindowState.x,
    y: mainWindowState.y,
    fullscreenable: true,
    skipTaskbar: true,
    frame: false,
    show: false,
    transparent: true,
    resizable: true,
    focusable: false,
    webPreferences: {
      preload: path.join(__dirname, './WindowsSecondaire/WindowsUserMyanimelist/userMyanimelistpreload.js'),
      contextIsolation: true,
    }
  })

  windowSetting.removeMenu();
  windowSetting.loadFile('./WindowsSecondaire/WindowsUserMyanimelist/userMyanimelist.html');
  windowSetting.webContents.openDevTools();
}


///////Window user myanimelist//////////////////////////////////////////////////
function creatUserMyanimelistWindow()
{
  userMyanimelist = new BrowserWindow({
    width: 210 ,
    height: 105,
    center: true,
    titleBarStyle: 'hidden',
    frame: false,
    modal: true,
    parent: mainWindow,
    fullscreenable: false,
    maximizable: false,
    webPreferences: {
      preload: path.join(__dirname, './src/WindowsUserMyanimelist/userMyanimelistpreload.js'),
      contextIsolation: true,
    }
  })

  userMyanimelist.webContents.send('UserMyanimelist', jsonUserSetting);

  userMyanimelist.removeMenu();
  userMyanimelist.loadFile('./src/WindowsUserMyanimelist/userMyanimelist.html');
  // userMyanimelist.webContents.openDevTools();

  userMyanimelist.on('close', () => {
    userMyanimelist = null;
    mainWindow.webContents.send('refreshDbF6', 'refresh!');
  });
}

/////// window for Manuelle adkami///////////////////////////////////////////////
  ipcMain.on('windowsAnimeManuelle', (event, listAnimeManuelle, arrayAnimeAdkami, arrayAnimeAdkamiLastWeek) => {

    windowsAdkamiManuelle = new BrowserWindow({
      width: 420,
      maxWidth: 420,
      minWidth: 420,
      height: 385,
      center: true,
      titleBarStyle: 'hidden',
      frame: false,
      fullscreenable: false,
		  maximizable: false,
      webPreferences: {
        preload: path.join(__dirname, './src/WindowsAnimeManuelle/windowsAnimeManuellePreload.js'),
        contextIsolation: true,
      }
    })

    // shell.openExternal('https://www.adkami.com/agenda');

    windowsAdkamiManuelle.removeMenu();
    windowsAdkamiManuelle.loadFile('./src/WindowsAnimeManuelle/windowsAnimeManuelle.html');
    // windowsAdkamiManuelle.webContents.openDevTools()

    windowsAdkamiManuelle.webContents.send('Anime_Manuelle', listAnimeManuelle, arrayAnimeAdkami, arrayAnimeAdkamiLastWeek);

    ipcMain.on('closeWindowMyanimelist', function()
    {
      event.returnValue = "keep on";
    });

    windowsAdkamiManuelle.on('close', () => {
      windowsAdkamiManuelle = null;
      event.returnValue = "anime cancel";
    });

  })

function trayConfig()
{
  // icone barre tache '''''''''''''''''''''''''a continuer
  let tray = new Tray('./Ressources/Icone/kana_kuma.png')
  const contextMenu = Menu.buildFromTemplate([{ label: 'salut', type: 'radio' }])
  tray.setToolTip('anime')
  tray.setContextMenu(contextMenu)
}
