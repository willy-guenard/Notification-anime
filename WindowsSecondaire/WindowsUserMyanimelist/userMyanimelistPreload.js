const { ipcRenderer } = require('electron');
const fs = require('fs');

window.addEventListener('DOMContentLoaded', () => {

  ipcRenderer.on('UserMyanimelist', (events, jsonConf) => {

    let form = document.getElementById("userFrom");
    form.addEventListener('submit', (event) => {
      let data = Object.fromEntries(new FormData(event.target).entries());
      jsonConf.UserMyanimelist = data.username;
      let newJson = JSON.stringify(jsonConf);

      fs.writeFile("./Ressources/userParameter.json", newJson, function(err, result)
      {
        if(err)
          {
            console.log('error', err);
          }
          else
          {
            console.log("File userParameter: update");
            window.close()
          }
      });
    });
  });
})
