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
          titleAnime = removeSpecial(myAnimeListJson[i].title)

          conn.query("INSERT INTO myanimelist (MAL_id, Tilte_Myanimelist, Last_watched_episodes, Total_number_episodes, url_myanimelist, Picture_Myanimelist, Type_episodes, Tags, Status, is_rewatching, score) VALUES (" + myAnimeListJson[i].mal_id + ", '" + titleAnime + "', " + myAnimeListJson[i].watched_episodes + ", " + myAnimeListJson[i].total_episodes + ", '" + myAnimeListJson[i].url + "', '" + myAnimeListJson[i].image_url + "', '" + myAnimeListJson[i].type + "', '" + myAnimeListJson[i].tags + "', '" + status + "', '" + myAnimeListJson[i].is_rewatching  + "', " + myAnimeListJson[i].score + ") ON DUPLICATE KEY UPDATE Last_watched_episodes = VALUES(Last_watched_episodes), Tags = VALUES(Tags), Status = VALUES(Status), score = VALUES(score)");


          selectMyanimelist = conn.query("SELECT id_myanimelist,Tilte_Myanimelist from myanimelist where Tilte_Myanimelist = '" + titleAnime + "';");
          selectMyanimelist.then(function(result)
          {
            conn.query("INSERT INTO anime (id_myanimelist, Title_anime) VALUES (" + result[0].id_myanimelist + ", '" + result[0].Tilte_Myanimelist + "') ON DUPLICATE KEY UPDATE Title_anime = VALUES(Title_anime)");
          })
        }
        creatAnotherTitle(conn);

      })
      .catch(err => { console.log("erreur: " + err); });
}

function creatAnotherTitle(conn)
{
  let selectAnime, anotherTitleList;
  selectAnime = conn.query("SELECT Title_anime from anime where id_adkami IS NULL AND id_other_anime IS NULL;");
  selectAnime.then(function(result)
  {
    for (let i = 0; i < result.length; i++)
    {
      anotherTitleList = "";
      if (titleTryOu(result[i].Title_anime) != undefined) { anotherTitleList = titleTryOu(result[i].Title_anime) + "\n"; }
      if (titleJustS(result[i].Title_anime) != undefined) { anotherTitleList += titleJustS(result[i].Title_anime) + "\n"; }
      if (titleNoDoblePoint(result[i].Title_anime) != undefined) { anotherTitleList += titleNoDoblePoint(result[i].Title_anime) + "\n"; }
      if (anotherTitleList != "") {console.log(anotherTitleList);}
    }
  })
}

function titleJustS(titleMyanimelist)
{
  let testSeason, testTenSeason, newTitle = '', numberSeason, numbre20Saison;


  testSeason = titleMyanimelist.indexOf('1st');
  if ( testSeason != -1 )
  {
    testTenSeason = titleMyanimelist[testSeason - 1]

    if ( !isNaN( parseInt(testTenSeason) ) )  // X1  [X>1]
    {
      numberSeason = titleMyanimelist.slice(testSeason - 1, testSeason + 1);
      newTitle = titleMyanimelist.slice(0, testSeason -1);
    }
    else //1
    {
      numberSeason = 1;
      newTitle = titleMyanimelist.slice(0, testSeason);
    }

    newTitle = newTitle + "S" + numberSeason;
  }

  testSeason = titleMyanimelist.indexOf('2nd');
  if ( testSeason != -1 )
  {
    testTenSeason = titleMyanimelist[testSeason - 1]

    if ( !isNaN( parseInt(testTenSeason) ) ) // X2  [X>1]
    {
      numberSeason = titleMyanimelist.slice(testSeason - 1, testSeason + 1);
      newTitle = titleMyanimelist.slice(0, testSeason -1);
    }
    else //2
    {
      numberSeason = 2;
      newTitle = titleMyanimelist.slice(0, testSeason);
    }
    newTitle = newTitle + "S" + numberSeason;
  }

  testSeason = titleMyanimelist.indexOf('3rd');
  if ( testSeason != -1 )
  {
    testTenSeason = titleMyanimelist[testSeason - 1]

    if ( !isNaN( parseInt(testTenSeason) ) ) // X3 [X>1]
    {
      numberSeason = titleMyanimelist.slice(testSeason - 1, testSeason + 1);
      newTitle = titleMyanimelist.slice(0, testSeason -1);
    }
    else//3
    {
      numberSeason = 3;
      newTitle = titleMyanimelist.slice(0, testSeason);
    }

    newTitle = newTitle + "S" + numberSeason;
  }

  testSeason = titleMyanimelist.indexOf('th');
  if ( testSeason != -1 )  // th est detecter dans la chaine de character
  {
    testTEnSeason = titleMyanimelist[testSeason - 1] // character avant th
    if ( !isNaN( parseInt(testTEnSeason) ) ) // test si Xth et un chiffre
    {

      testTEnSeason = titleMyanimelist[testSeason - 2] // character avant Xth
      if ( !isNaN( parseInt(testTEnSeason) ) ) // test character avant Xth et un chiffre ou pas  [XXth]
      {
        numberSeason = titleMyanimelist.slice(testSeason - 2, testSeason);
        newTitle = titleMyanimelist.slice(0, testSeason - 2);
      }
      else // [Xth]
      {
        numberSeason = titleMyanimelist.slice(testSeason - 1, testSeason);
        newTitle = titleMyanimelist.slice(0, testSeason - 1);
      }

      newTitle = newTitle + "S" + numberSeason;
    }
  }
  if (newTitle != "") {  return newTitle; }
}

function titleNoDoblePoint(titleMyanimelist)
{
  let titleNoDoblePointlist;
  let firstSplit;

  if ( titleMyanimelist.indexOf(":") != -1 )
  {
    titleNoDoblePointlist = titleMyanimelist.replace(":", "");
    return titleNoDoblePointlist;
  }
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
