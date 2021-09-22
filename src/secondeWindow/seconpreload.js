const {ipcRenderer} = require("electron");

window.addEventListener('DOMContentLoaded', () => {

  const tUrl = document.querySelector("#Turl");

  tUrl.addEventListener('click', function(){ipcRenderer.send('Cannel-Url', "url" )});
})
