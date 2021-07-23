// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
const ipcRenderer = require("electron");
const fs = require('fs');
const mariadb = require("mariadb");
const pool = mariadb.createPool({host: 'localhost', user:'test', password: 'xxx', database: "notification_anime"});

window.addEventListener('DOMContentLoaded', () => {

  const butonShowanime = document.querySelector("#butonShowanime");
  const tokenMal = document.querySelector("#tokenMal");
  const butonfiltre = document.querySelector("#filtre");

  butonShowanime.addEventListener('click', function(){ refreshAnime() });
  tokenMal.addEventListener('click', function(){ ipcRenderer.send('asynchronous-message', 'token') });
  butonfiltre.addEventListener('click', function(){ deleteDb() }); // showFiltre("mehdi")

  showAnimeAgenda();
})

function deleteDb()
{
  pool.getConnection()
    .then(conn => {
      conn.query("DELETE FROM `notification_anime`.`myanimelist` WHERE  `score`=0;");
    })
    .catch(err => { console.log("erreur: " + err); });
}

function refreshAnime()
{
  let anotherTItle;

  getAnimeMalWatching("cheark"); // modifier apres prendre valleur que je recupaire de l'user
  getAnimeAgendaAdkami();

  setTimeout(()=>{
        anotherTItle = creatAnotherTitle();
   },2000);

  adkami(anotherTItle)
  //gestion des anime qui ne son pas dans adkami
  //affichage()
}

function getAnimeMalWatching(userName)
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
    let selectMyanimelist, status, titleAnime, anotherTitleList;
    pool.getConnection()
      .then(conn => {
        for (let i = 0; i < myAnimeListJson.length; i++)
        {
          if (myAnimeListJson[i].airing_status == 1) { status = "Airing" } else{ status = "Release"}
          titleAnime = removeSpecial(myAnimeListJson[i].title)

          conn.query("INSERT INTO myanimelist (MAL_id, Tilte_Myanimelist, Last_watched_episodes, Total_number_episodes, url_myanimelist, Picture_Myanimelist, Type_episodes, Tags, Status, is_rewatching, score) VALUES (" + myAnimeListJson[i].mal_id + ", '" + titleAnime + "', " + myAnimeListJson[i].watched_episodes + ", " + myAnimeListJson[i].total_episodes + ", '" + myAnimeListJson[i].url + "', '" + myAnimeListJson[i].image_url + "', '" + myAnimeListJson[i].type + "', '" + myAnimeListJson[i].tags + "', '" + status + "', '" + myAnimeListJson[i].is_rewatching  + "', " + 0 + ") ON DUPLICATE KEY UPDATE Last_watched_episodes = VALUES(Last_watched_episodes), Tags = VALUES(Tags), Status = VALUES(Status), score = VALUES(score)");


          selectMyanimelist = conn.query("SELECT id_myanimelist,Tilte_Myanimelist from myanimelist where Tilte_Myanimelist = '" + titleAnime + "';");
          selectMyanimelist.then(function(result)
          {
            conn.query("INSERT INTO anime (id_myanimelist, Title_anime) VALUES (" + result[0].id_myanimelist + ", '" + result[0].Tilte_Myanimelist + "') ON DUPLICATE KEY UPDATE Title_anime = VALUES(Title_anime)");
          })
        }
      })
      .catch(err => { console.log("erreur: " + err); });
}

function creatAnotherTitle()
{
  let selectAnime, anotherTitleList = "";

  pool.getConnection()
  .then(conn => {
    selectAnime = conn.query("SELECT Title_anime from anime where id_adkami IS NULL AND id_other_anime IS NULL;");
    selectAnime.then(function(result)
    {
      for (let i = 0; i < result.length; i++)
      {
        anotherTitleList += result[i].Title_anime + "\n";
        if ( titleTryOu(result[i].Title_anime) != undefined ) { anotherTitleList += titleTryOu(result[i].Title_anime) + "\n"; }
        if ( titleJustS(result[i].Title_anime) != undefined ) { anotherTitleList += titleJustS(result[i].Title_anime) + "\n"; }
        if ( titleNoDoblePoint(result[i].Title_anime) != undefined ) { anotherTitleList += titleNoDoblePoint(result[i].Title_anime) + "\n"; }
        anotherTitleList += "\n";
      }
    console.log("another Anime Crete");
    return anotherTitleList;
    })
  })
  .catch(err => { console.log("erreur: " + err); });
}

function titleTryOu(titleMyanimelist)
{
  let nbOFOu = numberOfRepetitions(titleMyanimelist, "ou");
  let titleFromOuToO;
  let stockTitle1, stockTitle2, stockTitle3, stockTitle4, stockTitle5, stockTitle6, stockTitle7;
  let stockFirstOu, stockSecondeOu;

  switch (nbOFOu)
  {
    case 0:
      // c'est non
    break;

    case 1:
      titleFromOuToO = titleMyanimelist.replace('ou', 'o');

    break;

    case 2:
      stockFirstOu = titleMyanimelist.indexOf('ou');

      // o|ou
      stockTitle1 = titleMyanimelist.replace('ou', 'o');
      titleFromOuToO = stockTitle1 + "\n";

      // o|o
      stockTitle2 = stockTitle1.replace('ou', 'o');
      titleFromOuToO += stockTitle2 + "\n";

      // ou|o
      stockTitle2 = stockTitle2.split('');
      stockTitle2.splice(stockFirstOu + 1, 0, 'u');

      for (let i = 0; i < stockTitle2.length; i++)
        {
          titleFromOuToO += stockTitle2[i];
        }

    break;

    case 3:
      // o ou ou
      stockTitle1 = titleMyanimelist.replace('ou', 'o');
      titleFromOuToO = stockTitle1 + "\n";

      // o o ou
      stockTitle2 = stockTitle1.replace('ou', 'o');
      titleFromOuToO += stockTitle2 + "\n";

      // ou o ou
      stockFirstOu = titleMyanimelist.indexOf('ou');
      stockTitle3 = stockTitle2.split('');
      stockTitle3.splice(stockFirstOu + 1, 0, 'u');

      for (let i = 0; i < stockTitle3.length; i++)
        {
          titleFromOuToO += stockTitle3[i];
        }
        titleFromOuToO += "\n";

      // o o o
      stockTitle4 = stockTitle2.replace('ou', 'o');
      titleFromOuToO += stockTitle4 + "\n";

      // ou o o
      stockFirstOu = titleMyanimelist.indexOf('ou');

      stockTitle5 = stockTitle4.split('');
      stockTitle5.splice(stockFirstOu + 1, 0, 'u');

      for (let i = 0; i < stockTitle5.length; i++)
        {
          titleFromOuToO += stockTitle5[i];
        }
        titleFromOuToO += "\n";

      // o ou o
      stockFirstOu = titleMyanimelist.indexOf('ou');
      stockSecondeOu = titleMyanimelist.indexOf('ou', stockFirstOu + 1);

      stockTitle6 = stockTitle4.split('');
      stockTitle6.splice(stockSecondeOu, 0, 'u');

      for (let i = 0; i < stockTitle6.length; i++)
        {
          titleFromOuToO += stockTitle6[i];
        }
        titleFromOuToO += "\n";

      // ou ou o
      stockFirstOu = titleMyanimelist.indexOf('ou');
      stockSecondeOu = titleMyanimelist.indexOf('ou', stockFirstOu + 1);

      stockTitle7 = stockTitle4.split('');
      stockTitle7.splice(stockFirstOu + 1, 0, 'u');
      stockTitle7.splice(stockSecondeOu + 1 , 0, 'u');

      for (let i = 0; i < stockTitle7.length; i++)
        {
          titleFromOuToO += stockTitle7[i];
        }
    break;

    default:
    console.log("O(u)verflow");
  }
  return titleFromOuToO;
}

function numberOfRepetitions(maChaine, recherche)
{
 let nbOFOu = 0;
 let melange;

 for (let i = 0; i < maChaine.length; i++)
 {
   melange = maChaine[i] + maChaine[i + 1]

   if (melange == recherche)
   {
     nbOFOu++;
   }

  }
 return nbOFOu;
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

function getAnimeAgendaAdkami()
{
  // get agenda anime from adkami
  let url = "https://www.adkami.com/agenda";
  let request = new XMLHttpRequest();
  request.open('GET', url );

  request.responseType = 'text';
  request.send();
  request.onload = function()
  {
    let infosAnimeAdkami = request.response;
    refreshAgendaAdkamiJson(infosAnimeAdkami);
  }
}

function refreshAgendaAdkamiJson(infosAnimeAdkami)
{
  const daysList = ["null", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];
  let splitPictureAnime = infosAnimeAdkami.split('<div class="agenda-list">');
  let agendaList = splitPictureAnime[1].split('<div class="col-12">');
  let agendaListSplitDay = agendaList[0].split('<h3>');
  let animesOfTheDay;
  let animeInfoList = "";
  let dayStockage = "";
  let animeInfosSplit, animePicture, animeHours, animeEpisodeStock, animeEpisode, animeTypeEpisode, animeVoice;
  let animeTitle, firstPlaceTitle, secondPlaceTitle, clearAnimeTitle;

  animeInfoList = '{\n\t\t"animeAdkami":[';
  //boucle des anime separer par les jour
  for (let y = 1; y < agendaListSplitDay.length; y++)
  {
    animesOfTheDay = agendaListSplitDay[y].split('<div class="col-12 episode');
    dayStockage = daysList[y];

    // boucle pour recuperais le contenu de chaque anime d'une journer
    for (let i = 1; i < animesOfTheDay.length; i++)
    {
      animeInfosSplit = animesOfTheDay[i].split('\n');
      animePicture  =  animeInfosSplit[1].slice(10, -2);
      animeHours = animeInfosSplit[2].slice(47, -7);

      animeEpisodeStock = animeInfosSplit[4].slice(16, -4);
      animeEpisodeStock = animeEpisodeStock.split(" ");
      animeTypeEpisode = animeEpisodeStock[0];
      animeEpisode = animeEpisodeStock[1];

      if (animeEpisodeStock[2] != null)
      {
        animeVoice = animeEpisodeStock[2];
      }
      else
      {
        animeVoice = "vostfr";
      }

      firstPlaceTitle = animeInfosSplit[5].slice(0 , 2);
      secondPlaceTitle = animeInfosSplit[6].slice(0 , 2);

      if (firstPlaceTitle == "<p")
      {
        clearAnimeTitle = animeInfosSplit[5].indexOf('">');
        clearAnimeTitle += 2;
        animeTitle = animeInfosSplit[5].slice(clearAnimeTitle, -4);
      }
      else if (secondPlaceTitle == "<p")
      {
        clearAnimeTitle = animeInfosSplit[6].indexOf('">');
        clearAnimeTitle += 2;
        animeTitle = animeInfosSplit[6].slice(clearAnimeTitle, -4);
      }
      else
      {
        console.log("Warning: don't find a title ");
      }

      animeInfoList += '\n\t\t{';
      animeInfoList += '\n\t\t\t"Title":"' + animeTitle;
      animeInfoList += '",\n\t\t\t"Episode":' + animeEpisode;
      animeInfoList += ',\n\t\t\t"Type_episode":"' + animeTypeEpisode;
      animeInfoList += '",\n\t\t\t"Voice":"' + animeVoice;
      animeInfoList += '",\n\t\t\t"Picture":"' + animePicture;
      animeInfoList += '",\n\t\t\t"Hours":"' + animeHours;
      animeInfoList += '",\n\t\t\t"Day":"' + dayStockage;
      animeInfoList += '"\n\t\t},';
    }
  }

  animeInfoList = animeInfoList.slice(0, -1);
  animeInfoList += '\n\t]\n}'
  fs.writeFile("./Json/adkamiAnime.json", animeInfoList, function(err, result)
  {
    if(err)
      {
        console.log('error', err);
      }
      else
      {
        console.log("File adkami Json: update");
      }
  })
}

function adkami(titleListAnother)
{
  console.log("boite");
}

function showAnimeAgenda() // pas oublier
{

}
