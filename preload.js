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

async function refreshAnime()
{
  let arrayAnimeAdkami, anotherTItle;

  await getAnimeMalWatching("cheark");
  anotherTItle = await creatAnotherTitle();
  arrayAnimeAdkami = await getAnimeAgendaAdkami();
  adkamiAnimeLink = await adkami(anotherTItle, arrayAnimeAdkami);
  await adkamiInsertDb(adkamiAnimeLink);
  //gestion des anime qui ne son pas dans adkami
  //affichage()
}

function getAnimeMalWatching(userName)
{
   return new Promise((resolve,reject)=>{

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
    setTimeout(()=>{resolve(";)");} , 5000);
  });
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
  return new Promise((resolve, reject)=>{
    let selectAnime, stockTitle;
     anotherTitleList = new Array();

    pool.getConnection()
    .then(conn => {
      selectAnime = conn.query("SELECT Title_anime from anime JOIN myanimelist ON anime.id_myanimelist = myanimelist.id_myanimelist where id_adkami IS NULL AND id_other_anime IS NULL AND myanimelist.Status = 'Airing'");
      selectAnime.then(function(result)
      {
        for (let i = 0; i < result.length; i++)
        {
          stockTitle = "";
          anotherTitleList[i] = new Array();
          anotherTitleList[i][0] = result[i].Title_anime;
          if ( titleTryOu(result[i].Title_anime) != undefined ) { stockTitle += titleTryOu(result[i].Title_anime + "|||"); }
          if ( titleJustS(result[i].Title_anime) != undefined ) { stockTitle += titleJustS(result[i].Title_anime + "|||"); }
          if ( titleNoDoblePoint(result[i].Title_anime) != undefined ) { stockTitle += titleNoDoblePoint(result[i].Title_anime); }

          if (stockTitle != "")
          {
            stockTitle = stockTitle.split("|||");
            for (let y = 0; y < stockTitle.length; y++)
            {
              if (stockTitle[y] != "")
              {
                anotherTitleList[i][y+1] = stockTitle[y]
              }
            }
          }
        }
      resolve(anotherTitleList);
      })
    })
    .catch(err => { console.log("erreur: " + err); });
  });
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
      titleFromOuToO = stockTitle1 + "";

      // o|o
      stockTitle2 = stockTitle1.replace('ou', 'o');
      titleFromOuToO += stockTitle2 + "";

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
      titleFromOuToO = stockTitle1 + "";

      // o o ou
      stockTitle2 = stockTitle1.replace('ou', 'o');
      titleFromOuToO += stockTitle2 + "";

      // ou o ou
      stockFirstOu = titleMyanimelist.indexOf('ou');
      stockTitle3 = stockTitle2.split('');
      stockTitle3.splice(stockFirstOu + 1, 0, 'u');

      for (let i = 0; i < stockTitle3.length; i++)
        {
          titleFromOuToO += stockTitle3[i];
        }
        titleFromOuToO += "";

      // o o o
      stockTitle4 = stockTitle2.replace('ou', 'o');
      titleFromOuToO += stockTitle4 + "";

      // ou o o
      stockFirstOu = titleMyanimelist.indexOf('ou');

      stockTitle5 = stockTitle4.split('');
      stockTitle5.splice(stockFirstOu + 1, 0, 'u');

      for (let i = 0; i < stockTitle5.length; i++)
        {
          titleFromOuToO += stockTitle5[i];
        }
        titleFromOuToO += "";

      // o ou o
      stockFirstOu = titleMyanimelist.indexOf('ou');
      stockSecondeOu = titleMyanimelist.indexOf('ou', stockFirstOu + 1);

      stockTitle6 = stockTitle4.split('');
      stockTitle6.splice(stockSecondeOu, 0, 'u');

      for (let i = 0; i < stockTitle6.length; i++)
        {
          titleFromOuToO += stockTitle6[i];
        }
        titleFromOuToO += "";

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
  return new Promise((resolve,reject)=>{
    // get agenda anime from adkami
    let arrayAnimeAdkami;
    let url = "https://www.adkami.com/agenda";
    let request = new XMLHttpRequest();
    request.open('GET', url );

    request.responseType = 'document';
    request.send();
    request.onload = function()
    {
      let infosAnimeAdkami = request.response;
      arrayAnimeAdkami = refreshAgendaAdkamiJson(infosAnimeAdkami);
      resolve(arrayAnimeAdkami);
    }
  });
}

function refreshAgendaAdkamiJson(infosAnimeAdkami)
{
  let day, testSortie, episodesAnime, nbAnimeDay, picture_url, yAnime = 0;
  let maxDay = infosAnimeAdkami.getElementsByClassName('colone');
  let arrayAnimeAdkami = new Array();

  for (let iDay = 0; iDay < maxDay.length; iDay++)
  {
    day = infosAnimeAdkami.getElementsByClassName('colone')[iDay].children[0].textContent;
    nbAnimeDay = infosAnimeAdkami.getElementsByClassName('colone')[iDay].children;

    for (let iAnime = 1; iAnime < nbAnimeDay.length; iAnime++) // check all anime by days
    {
      arrayAnimeAdkami[yAnime] = new Array();
      testSortie = infosAnimeAdkami.getElementsByClassName('colone')[iDay].children[iAnime].localName; // first tags by anime

      if (testSortie == "a") // anime out
      {
        testSortie = infosAnimeAdkami.getElementsByClassName('colone')[iDay].children[iAnime].children[0].children[0].localName;

        if (testSortie == "script")
        {
          picture_url = infosAnimeAdkami.getElementsByClassName('colone')[iDay].children[iAnime].children[0].children[1].outerHTML; //url_images
          episodesAnime = infosAnimeAdkami.getElementsByClassName('colone')[iDay].children[iAnime].children[0].children[3].children[0].textContent;


          arrayAnimeAdkami[yAnime][0] = infosAnimeAdkami.getElementsByClassName('colone')[iDay].children[iAnime].children[0].children[3].children[1].textContent; //tile
          arrayAnimeAdkami[yAnime][1] = infosAnimeAdkami.getElementsByClassName('colone')[iDay].children[iAnime].children[0].children[1].textContent; //hours
        }
        else
        {
          picture_url = infosAnimeAdkami.getElementsByClassName('colone')[iDay].children[iAnime].children[0].children[0].outerHTML; //url_images
          episodesAnime = infosAnimeAdkami.getElementsByClassName('colone')[iDay].children[iAnime].children[0].children[2].children[0].textContent;

          arrayAnimeAdkami[yAnime][0] = infosAnimeAdkami.getElementsByClassName('colone')[iDay].children[iAnime].children[0].children[2].children[1].textContent; //tile
          arrayAnimeAdkami[yAnime][1] = infosAnimeAdkami.getElementsByClassName('colone')[iDay].children[iAnime].children[0].children[1].textContent; //hours
        }

        picture_url = picture_url.split('"');
        episodesAnime = episodesAnime.split(" ");

        arrayAnimeAdkami[yAnime][2] = day; //day
        arrayAnimeAdkami[yAnime][3] = picture_url[1];//picture_url
        arrayAnimeAdkami[yAnime][4] = episodesAnime[0]; //type Episode
        arrayAnimeAdkami[yAnime][5] = episodesAnime[1]; //Episode

        if (episodesAnime.length == 3)
        {
          arrayAnimeAdkami[yAnime][6] = episodesAnime[2]; //voice
        }
        else
        {
          arrayAnimeAdkami[yAnime][6] = "vostfr";//voice
        }

      }
      else if (testSortie == 'div') // anime not out
      {
        episodesAnime = infosAnimeAdkami.getElementsByClassName('colone')[iDay].children[iAnime].children[2].children[0].textContent;
        episodesAnime = episodesAnime.split(" ");

        picture_url = infosAnimeAdkami.getElementsByClassName('colone')[iDay].children[iAnime].children[0].outerHTML; //url_images
        picture_url = picture_url.split('"');

        arrayAnimeAdkami[yAnime][0] = infosAnimeAdkami.getElementsByClassName('colone')[iDay].children[iAnime].children[2].children[1].children[0].textContent; //titre
        arrayAnimeAdkami[yAnime][1] = infosAnimeAdkami.getElementsByClassName('colone')[iDay].children[iAnime].children[1].textContent; //hours
        arrayAnimeAdkami[yAnime][2] = day; //day
        arrayAnimeAdkami[yAnime][3] = picture_url[1];//picture_url
        arrayAnimeAdkami[yAnime][4] = episodesAnime[0]; //type Episode
        arrayAnimeAdkami[yAnime][5] = episodesAnime[1]; //Episode


        if (episodesAnime.length == 3)
        {
          arrayAnimeAdkami[yAnime][6] = episodesAnime[2]; //voice
        }
        else
        {
          arrayAnimeAdkami[yAnime][6] = "vostfr";//voice
        }
      }
      else
      {
        arrayAnimeAdkami[yAnime][0] = "warning anime not found";
      }
      yAnime++;
    }
  }
  return arrayAnimeAdkami;
}

function adkami(anotherTItle, arrayAnimeAdkami)
{
  return new Promise((resolve,reject)=>{
    let animeLinkAdkami = new Array();
    let testAnimeLink = "", nbAnimeLink = 0;
    for (let i = 0; i < anotherTItle.length; i++)
    {
      testAnimeLink = tryAnimeAdkami(anotherTItle[i], arrayAnimeAdkami, 0, anotherTItle[i].length);
      if (testAnimeLink != "animeNOtFound")
      {
        animeLinkAdkami[nbAnimeLink] = new Array()
        animeLinkAdkami[nbAnimeLink][0] = anotherTItle[i][0];
        testAnimeLink = testAnimeLink.split(",");
        if (testAnimeLink.length > 7)
        {
          animeLinkAdkami[nbAnimeLink][1] = testAnimeLink.slice(0, 7);
          animeLinkAdkami[nbAnimeLink][2] = testAnimeLink.slice(7);
        }
        else
        {
          animeLinkAdkami[nbAnimeLink][1] = testAnimeLink;
        }

        nbAnimeLink = nbAnimeLink + 1;
      }
      else
      {
        adkamiManuelle(anotherTItle[i][0]);
      }
    }
    resolve(animeLinkAdkami);
  });
}

function tryAnimeAdkami(anotherTItle, arrayAnimeAdkami, animeNb, anotherTItleSize)
{
  let animeFound = 0, stock = "";

  for (let y = 0; y < arrayAnimeAdkami.length; y++)
  {
    if (anotherTItle[animeNb] == arrayAnimeAdkami[y][0])
    {
      animeFound = 1;
      if ( stock != "" )
      {
        stock += ",";
      }
      stock += arrayAnimeAdkami[y];
    }
  }

  if ( animeFound == 1 )
  {
    return stock;
  }
  else
  {
    animeNb = animeNb + 1;
    if ( animeNb < anotherTItleSize )
    {
      stock = tryAnimeAdkami( anotherTItle, arrayAnimeAdkami, animeNb, anotherTItleSize);
      return stock;
    }
    else
    {
      return "animeNOtFound";
    }
  }
}

function adkamiInsertDb(adkamiAnimeLink)
{
  return new Promise((resolve,reject)=>{
    let selectAnime;
    pool.getConnection()
      .then(conn => {
      for (let i = 0; i < adkamiAnimeLink.length; i++)
      {
        for (let y = 1; y < adkamiAnimeLink[i].length; y++)
        {
          conn.query("INSERT INTO adkami (Unique_title, Title_Adkami, Last_episodes_release, Picture_adkami, Voice, Day, Hours, Type_episodes) VALUES ('" + adkamiAnimeLink[i][y][0] + " " + adkamiAnimeLink[i][y][4] + " " + adkamiAnimeLink[i][y][6] + "','" + adkamiAnimeLink[i][y][0] + "'," + adkamiAnimeLink[i][y][5] + ",'" + adkamiAnimeLink[i][y][3] + "','" + adkamiAnimeLink[i][y][6] + "','" + adkamiAnimeLink[i][y][2] + "','" + adkamiAnimeLink[i][y][1] + "','" + adkamiAnimeLink[i][y][4] + "') ON DUPLICATE KEY UPDATE Last_episodes_release = VALUES(Last_episodes_release), Day = VALUES(Day), Hours = VALUES(Hours)");
        }
        selectAnime = conn.query("SELECT id_adkami from adkami where Title_Adkami = '" + adkamiAnimeLink[i][1][0] + "' AND Voice = 'Vostfr';");
        selectAnime.then(function(result)
        {
          conn.query("UPDATE anime SET id_adkami = " + result[0].id_adkami + " WHERE Title_anime = '" + adkamiAnimeLink[i][0] + "' AND id_adkami is NULL;");
        })
      }
    })
    .catch(err => { console.log("erreur: " + err); });
    resolve();
  });
}

function adkamiManuelle(animeTitle)
{
  console.log("adkamiManuelle");
}

function showAnimeAgenda() // pas oublier
{

}
