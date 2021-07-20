// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
const {ipcRenderer} = require("electron");
const fs = require('fs');
const mariadb = require("mariadb");
const pool = mariadb.createPool({host: 'localhost', user:'test', password: 'xxx', database: "notification_anime"});

window.addEventListener('DOMContentLoaded', () => {

  const butonShowanime = document.querySelector("#butonShowanime");
  const tokenMal = document.querySelector("#tokenMal");
  const butonfiltre = document.querySelector("#filtre");

  butonShowanime.addEventListener('click', function(){refreshAnime()});
  tokenMal.addEventListener('click', function(){ipcRenderer.send('asynchronous-message', 'token')});
  butonfiltre.addEventListener('click', function(){showFiltre("mehdi")});

  showAnimeAgenda();
})

function refreshAnime()
{
  getAnimeWatching("cheark"); // modifier apres prendre valleur que je recupaire de l'user
  // insertUpdateMyanimelistDb(myAnimeListJson);
}

function getAnimeWatching(userName)
{
  // api jikan request to get anime in the watching list of a user
  let url = "https://api.jikan.moe/v3";
  let request = new XMLHttpRequest();
  let requestGetWathingList = "/user/"+ userName + "/animelist/watching";
  let animeMyanimelistjson;

  request.open('GET', url + requestGetWathingList);
  request.responseType = 'json';
  request.send();

  request.onload = function()
  {
    animeMyanimelistjson = request.response;
    insertUpdateMyanimelistDb(animeMyanimelistjson["anime"]);
  }
}

function insertUpdateMyanimelistDb(myAnimeListJson)
{
    let selectMyanimelist, status, titleAnime;
    pool.getConnection()
      .then(conn => {
        for (let i = 0; i < myAnimeListJson.length; i++)
        {
          if (myAnimeListJson[i].airing_status == 1) { status = "Airing" } else{ status = "Release"}
          titleAnime = removeSpecial(myAnimeListJson[i].title);

          conn.query("INSERT INTO myanimelist (MAL_id, Tilte_Myanimelist, Last_watched_episodes, Total_number_episodes, url_myanimelist, Picture_Myanimelist, Type_episodes, Tags, Status, is_rewatching, score) VALUES (" + myAnimeListJson[i].mal_id + ", '" + titleAnime + "', " + myAnimeListJson[i].watched_episodes + ", " + myAnimeListJson[i].total_episodes + ", '" + myAnimeListJson[i].url + "', '" + myAnimeListJson[i].image_url + "', '" + myAnimeListJson[i].type + "', '" + myAnimeListJson[i].tags + "', '" + status + "', '" + myAnimeListJson[i].is_rewatching  + "', " + myAnimeListJson[i].score + ") ON DUPLICATE KEY UPDATE Last_watched_episodes = VALUES(Last_watched_episodes), Tags = VALUES(Tags), Status = VALUES(Status), score = VALUES(score)");


          selectMyanimelist = conn.query("SELECT id_myanimelist,Tilte_Myanimelist from myanimelist where Tilte_Myanimelist = '" + titleAnime + "';");
          selectMyanimelist.then(function(result)
          {
            conn.query("INSERT INTO anime (id_myanimelist, Title_anime) VALUES (" + result[0].id_myanimelist + ", '" + result[0].Tilte_Myanimelist + "') ON DUPLICATE KEY UPDATE Title_anime = VALUES(Title_anime)");
          })
        }

      })
      .catch(err => { console.log("erreur: " + err); });
}

function removeSpecial(title)
{
  title = title.replace(/[^\w\s!.,:/=?I~[]+;~-_0-9]/gi, '');
  title = title.replace(/[＿␣]/gi, '_');
  title = title.replace(/[∬]/gi, '2');
  title = title.replace(/[◎]/gi, ' 2');
  title = title.replace(/[√']/gi, '');
  title = title.replace(/[△★☆]/gi, ' ');
  title = title.replace(/[Ψ]/gi, 'psi');

  return title
}

function showAnimeAgenda() // pas oublier
{
  
}
