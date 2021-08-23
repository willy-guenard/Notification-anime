  // All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
const { ipcRenderer } = require("electron");
const mariadb = require("mariadb"); // Data base
const jikanjs  = require('jikanjs'); //api myanimelist no officiel
const pool = mariadb.createPool({host: 'localhost', user:'test', password: 'xxx', database: "notification_anime"}); // DB login
const today = new Date();

window.addEventListener('DOMContentLoaded', () => {

  const butonShowanime = document.querySelector("#butonShowanime");
  const tokenMal = document.querySelector("#tokenMal");
  const butonfiltre = document.querySelector("#filtre");
  const butonSupDB = document.querySelector("#supDB"); // buton temporaire
  const butontestWindows = document.querySelector("#testWindows");


  butonShowanime.addEventListener('click', function(){ refreshAnime() });
  tokenMal.addEventListener('click', function(){ ipcRenderer.send('asynchronous-message', 'token') });
  butonfiltre.addEventListener('click', function(){ showFiltre("mehdi") });
  butonSupDB.addEventListener('click', function(){ deleteDb() }); // function temporaire
  butontestWindows.addEventListener('click', function(){ testWindows() });

  showAnimeAgenda();
})

function testWindows()
{
  ipcRenderer.sendSync('windowsAnimeManuelle', "kobayashi-san Chi no maid dragon S2");

  ipcRenderer.on('windowsAnimeManuelle-reply', (event, arg) => {
    console.log(arg) // affiche "pong"
  })
}

function deleteDb() // function temporaire/ test whith clear DB
{
  pool.getConnection()
    .then(conn => {
      conn.query("DELETE FROM `notification_anime`.`myanimelist` WHERE  `score` = 0;");
      conn.query("DELETE FROM `notification_anime`.`adkami` WHERE  `Type_episodes`= 'Episode';");
    })
    .catch(err => { console.log("erreur: " + err); });
}

async function refreshAnime() // refresh all data anime
{
  let arrayAnimeAdkami, anotherTItle, actualise;

  await jikanApiAnimeMalWatching("cheark"); // api myanimelist no officiel and insert db.myanimelist
  anotherTItle = await creatAnotherTitle(); // create variant of title anime to link myanimelist to adkami
  arrayAnimeAdkami = await getAnimeAgendaAdkami(); // get data from anime in Airing
  adkamiAnimeLink = await linkAdkamiAndMyanimelist(anotherTItle, arrayAnimeAdkami); // link data from adkami with myanimelist title
  actualise = await adkamiInsertDb(adkamiAnimeLink); // insert data in Db adkmi

  setTimeout(()=>{
    if ( actualise == "ready" )
    {
      window.location.reload();
    }
  } , 5000);
}

function  jikanApiAnimeMalWatching(myanimelistName)
{
  jikanjs.loadUser(myanimelistName, 'animelist', 'watching').then((response) => {
    insertUpdateMyanimelistDb(response["anime"]); // function to inser or update anime in myanimelist DB
  }).catch((err) => {
    console.error(err); // in case a error happens
  });
}

function insertUpdateMyanimelistDb(myAnimeListJson) // function to inser or update anime in myanimelist DB
{
  let selectMyanimelist, selectAnimeMyanimelist, status, titleAnime, tags , checkAnimeList;
  checkAnimeList = new Array();
  //conection to data DB
  pool.getConnection()
    .then(conn => {
      for (let i = 0; i < myAnimeListJson.length; i++)
      {
        if ( myAnimeListJson[i].airing_status == 1 ) { status = "Airing" } else { status = "Release" }
        titleAnime = removeSpecialCharacter(myAnimeListJson[i].title);
        if ( myAnimeListJson[i].tags !=  null ) { tags = removeSpecialCharacter(myAnimeListJson[i].tags); } else { tags = myAnimeListJson[i].tags; }

        //inser new anime in myanimelist if it already exists just update it
        conn.query("INSERT INTO myanimelist (MAL_id, Tilte_Myanimelist, Last_watched_episodes, Total_number_episodes, url_myanimelist, Picture_Myanimelist, Type_episodes, Tags, Status, is_rewatching, score) VALUES (" + myAnimeListJson[i].mal_id + ", '" + titleAnime + "', " + myAnimeListJson[i].watched_episodes + ", " + myAnimeListJson[i].total_episodes + ", '" + myAnimeListJson[i].url + "', '" + myAnimeListJson[i].image_url + "', '" + myAnimeListJson[i].type + "', '" + tags + "', '" + status + "', '" + myAnimeListJson[i].is_rewatching  + "', " + 0 + ") ON DUPLICATE KEY UPDATE Last_watched_episodes = VALUES(Last_watched_episodes), Tags = VALUES(Tags), Status = VALUES(Status), score = VALUES(score)");

        // select myanimelist table for get id and title to create link with foreign key
        selectMyanimelist = conn.query("SELECT id_myanimelist, Tilte_Myanimelist from myanimelist where Tilte_Myanimelist = '" + titleAnime + "';");
        selectMyanimelist.then(function(result)
        {
          conn.query("INSERT INTO anime (id_myanimelist, Title_anime) VALUES (" + result[0].id_myanimelist + ", '" + result[0].Tilte_Myanimelist + "') ON DUPLICATE KEY UPDATE Title_anime = VALUES(Title_anime)");
        })
        checkAnimeList[i] = titleAnime; //stock all anime in watching list
      }

      selectAnimeMyanimelist = conn.query("SELECT myanimelist.id_myanimelist, myanimelist.Tilte_Myanimelist, anime.id_adkami, anime.id_other_anime  FROM myanimelist JOIN anime ON myanimelist.id_myanimelist = anime.id_myanimelist;"); //all anime in db myanimelist
      selectAnimeMyanimelist.then(function(animeInDbMyanimelist)
      {
        supAnimeStopWatching(checkAnimeList, animeInDbMyanimelist)
      })
    })
    .catch(err => { console.log("erreur: " + err); });

}

function supAnimeStopWatching(animeWatchingList, animeInDbMyanimelist)
{
  let testFindAnime, nbAnimeNotFound = 0;
  animeNofoundInWatchinList = new Array();

  for (let i = 0; i < animeInDbMyanimelist.length; i++)
  {
    testFindAnime = animeWatchingList.find(element => element == animeInDbMyanimelist[i].Tilte_Myanimelist);

    if (testFindAnime ==  undefined)
    {
      animeNofoundInWatchinList[nbAnimeNotFound]  = animeInDbMyanimelist[i];
      nbAnimeNotFound ++;
    }
  }

  pool.getConnection()
   .then(conn => {
     for (let y = 0; y < animeNofoundInWatchinList.length; y++)
     {
       conn.query("DELETE FROM myanimelist WHERE id_myanimelist = " + animeNofoundInWatchinList[y].id_myanimelist + ";");

       if(animeNofoundInWatchinList[y].id_adkami != null)
       {
         conn.query("DELETE FROM adkami WHERE id_adkami = " + animeNofoundInWatchinList[y].id_adkami + ";");
       }
       else
       {
         if (animeNofoundInWatchinList[y].id_other_anime != null)  //secutier
         {
           conn.query("DELETE FROM other_anime WHERE id_other_anime = " + animeNofoundInWatchinList[y].id_other_anime + ";");
         }
         else
         {
            console.log("Warning: anime sans DB fixe");
         }
       }
     }
    })
    .catch(err => { console.log("erreur: " + err); });
}

function creatAnotherTitle() // creat recurrent variant of title anime from myanimelist
{
  return new Promise((resolve, reject)=>{
    let selectAnime, stockTitle;
     anotherTitleList = new Array();

    pool.getConnection()
    .then(conn => {
      selectAnime = conn.query("SELECT Title_anime from anime JOIN myanimelist ON anime.id_myanimelist = myanimelist.id_myanimelist where id_adkami IS NULL AND id_other_anime IS NULL AND myanimelist.Status = 'Airing'");
      selectAnime.then(function(result)
      {
        for (let i = 0; i < result.length; i++) // try all title
        {
          stockTitle = "";
          anotherTitleList[i] = new Array();
          anotherTitleList[i][0] = result[i].Title_anime;
          if ( titleTryOu(result[i].Title_anime) != undefined ) { stockTitle += titleTryOu(result[i].Title_anime + "|||"); } //test if this variant make a result
          if ( titleJustS(result[i].Title_anime) != undefined ) { stockTitle += titleJustS(result[i].Title_anime + "|||"); } //test if this variant make a result
          if ( titleNoDoblePoint(result[i].Title_anime) != undefined ) { stockTitle += titleNoDoblePoint(result[i].Title_anime); } //test if this variant make a result

          if ( stockTitle != "" ) // check if we have created new titles
          {
            stockTitle = stockTitle.split("|||");
            for (let y = 0; y < stockTitle.length; y++) // display all new title
            {
              if ( stockTitle[y] != "" )
              {
                anotherTitleList[i][y + 1] = stockTitle[y]
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
  let nbOFOu = numberOfRepetitions(titleMyanimelist, "ou"); // get number of "ou" in title
  let titleFromOuToO;
  let stockTitle1, stockTitle2, stockTitle3, stockTitle4, stockTitle5, stockTitle6, stockTitle7;
  let stockFirstOu, stockSecondeOu;

  switch (nbOFOu) // distributed according to the number of "ou" find
  {
    case 0:
      //don't find "ou" in title
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
    console.log("too much 'ou' in Title");
  }
  return titleFromOuToO;
}

function numberOfRepetitions(maChaine, recherche)
{
 let melange, nbOFOu = 0;

 for (let i = 0; i < maChaine.length; i++)
 {
   melange = maChaine[i] + maChaine[i + 1]
   if ( melange == recherche )
   {
     nbOFOu++;
   }
  }

 return nbOFOu;
}

function titleJustS(titleMyanimelist) // change the way to display the number of the season
{
  let testSeason, testTenSeason, newTitle = '', numberSeason;

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
      testTEnSeason = titleMyanimelist[testSeason - 2]; // character avant Xth
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
  if  (newTitle != "" ) {  return newTitle; }
}

function titleNoDoblePoint(titleMyanimelist)
{
  let titleNoDoblePointlist;

  if ( titleMyanimelist.indexOf(":") != -1 )
  {
    titleNoDoblePointlist = titleMyanimelist.replace(":", "");
    return titleNoDoblePointlist;
  }
  else
  {
    return titleNoDoblePointlist;
  }
}

function removeSpecialCharacter(title)
{
  title = title.replace(/[^\ws!.:=?I~_)(;0-9 -]/, '');
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
    let arrayAnimeAdkami, infosAnimeAdkami;
    let url = "https://www.adkami.com/agenda";
    let request = new XMLHttpRequest();
    request.open('GET', url );

    request.responseType = 'document';
    request.send();
    request.onload = function()
    {
      infosAnimeAdkami = request.response;
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

  for (let iDay = 0; iDay < maxDay.length; iDay++) //separates the animes from the day it out
  {
    day = infosAnimeAdkami.getElementsByClassName('colone')[iDay].children[0].textContent;
    nbAnimeDay = infosAnimeAdkami.getElementsByClassName('colone')[iDay].children;

    for (let iAnime = 1; iAnime < nbAnimeDay.length; iAnime++) // check all anime day by day
    {
      arrayAnimeAdkami[yAnime] = new Array();
      testSortie = infosAnimeAdkami.getElementsByClassName('colone')[iDay].children[iAnime].localName; // first tags by anime

      if ( testSortie == "a" ) // anime out
      {
        testSortie = infosAnimeAdkami.getElementsByClassName('colone')[iDay].children[iAnime].children[0].children[0].localName;

        if ( testSortie == "script" )
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

        if ( episodesAnime.length == 3 )
        {
          arrayAnimeAdkami[yAnime][6] = episodesAnime[2]; //voice
        }
        else
        {
          arrayAnimeAdkami[yAnime][6] = "vostfr";//voice
        }

      }
      else if ( testSortie == 'div' ) // anime not out
      {
        episodesAnime = infosAnimeAdkami.getElementsByClassName('colone')[iDay].children[iAnime].children[2].children[0].textContent; // episode
        episodesAnime = episodesAnime.split(" ");

        picture_url = infosAnimeAdkami.getElementsByClassName('colone')[iDay].children[iAnime].children[0].outerHTML; //url_images
        picture_url = picture_url.split('"');

        arrayAnimeAdkami[yAnime][0] = infosAnimeAdkami.getElementsByClassName('colone')[iDay].children[iAnime].children[2].children[1].children[0].textContent; //titre
        arrayAnimeAdkami[yAnime][1] = infosAnimeAdkami.getElementsByClassName('colone')[iDay].children[iAnime].children[1].textContent; //hours
        arrayAnimeAdkami[yAnime][2] = day; //day
        arrayAnimeAdkami[yAnime][3] = picture_url[1];//picture_url
        arrayAnimeAdkami[yAnime][4] = episodesAnime[0]; //type Episode
        arrayAnimeAdkami[yAnime][5] = episodesAnime[1]; //Episode

        if ( episodesAnime.length == 3 )
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

function linkAdkamiAndMyanimelist(anotherTItle, arrayAnimeAdkami)
{
  return new Promise((resolve,reject)=>{
    let animeLinkAdkami = new Array();
    let testAnimeLink = "", nbAnimeLink = 0;
    for (let i = 0; i < anotherTItle.length; i++)
    {
      testAnimeLink = tryAnimeAdkami(anotherTItle[i], arrayAnimeAdkami, 0, anotherTItle[i].length);

      if ( testAnimeLink != "animeNOtFound" )
      {
        animeLinkAdkami[nbAnimeLink] = new Array();
        animeLinkAdkami[nbAnimeLink][0] = removeSpecialCharacter(anotherTItle[i][0]);
        animeLinkAdkami[nbAnimeLink][1] = new Array();

        console.log(animeLinkAdkami);
        for (let y = 0; y < testAnimeLink.length; y++)
        {
          animeLinkAdkami[nbAnimeLink][1][y] = testAnimeLink[y];
        }

        nbAnimeLink = nbAnimeLink + 1;
      }
      else
      {
        adkamiManuelle(anotherTItle[i][0], arrayAnimeAdkami);
      }
    }
    resolve(animeLinkAdkami);
  });
}

function tryAnimeAdkami(anotherTItle, arrayAnimeAdkami, animeNb, anotherTItleSize)
{
  let iAnime = 0, animeFound = 0, stock = new Array();
  stock[0] = "";

  for (let y = 0; y < arrayAnimeAdkami.length; y++)
  {
    arrayAnimeAdkami[y][0] = removeSpecialCharacter(arrayAnimeAdkami[y][0]);
    if ( anotherTItle[animeNb].toLowerCase() == arrayAnimeAdkami[y][0].toLowerCase() )
    {
      animeFound = 1;

      if ( stock[0] != "" )
      {
        iAnime++;
      }
      stock[iAnime] = arrayAnimeAdkami[y];
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

function adkamiManuelle(animeTitle, arrayAnimeAdkami)
{
  console.log("adkamiManuelle");
  // ipcRenderer.send('asynchronous-message', 'token')

}

function adkamiInsertDb(adkamiAnimeLink)
{
  return new Promise((resolve,reject)=>{
    let selectAnime;
    pool.getConnection()
      .then(conn => {
      for (let i = 0; i < adkamiAnimeLink.length; i++)
      {
        for (let y = 0; y < adkamiAnimeLink[i][1].length; y++)
        {
          conn.query("INSERT INTO adkami (Unique_title, Title_Adkami, Last_episodes_release, Picture_adkami, Voice, Day, Hours, Type_episodes) VALUES ('" + adkamiAnimeLink[i][1][y][0] + " " + adkamiAnimeLink[i][1][y][4] + " " + adkamiAnimeLink[i][1][y][6] + "','" + adkamiAnimeLink[i][1][y][0] + "'," + adkamiAnimeLink[i][1][y][5] + ",'" + adkamiAnimeLink[i][1][y][3] + "','" + adkamiAnimeLink[i][1][y][6] + "','" + adkamiAnimeLink[i][1][y][2] + "','" + adkamiAnimeLink[i][1][y][1] + "','" + adkamiAnimeLink[i][1][y][4] + "') ON DUPLICATE KEY UPDATE Last_episodes_release = VALUES(Last_episodes_release), Day = VALUES(Day), Hours = VALUES(Hours)");
        }

        selectAnime = conn.query("SELECT id_adkami from adkami where Title_Adkami = '" + adkamiAnimeLink[i][1][0][0] + "' AND Voice = 'Vostfr';");
        selectAnime.then(function(result)
        {
          conn.query("UPDATE anime SET id_adkami = " + result[0].id_adkami + " WHERE Title_anime = '" + adkamiAnimeLink[i][0] + "' AND id_adkami is NULL;");
        })
      }
    })
    .catch(err => { console.log("erreur: " + err); });
    resolve("ready");
  });
}

function splitDay(animeAiring)
{
  let animeLundi = [], iLundi = 0;
  let animeMardi  = [], iMardi = 0;
  let animeMercredi = [], iMercredi = 0;
  let animeJeudi = [], iJeudi = 0;
  let animeVendredi = [], iVendredi = 0;
  let animeSamedi = [], iSamedi = 0;
  let animeDimanche = [], iDimanche = 0;
  let animeSortie;

  for (let i = 0; i < animeAiring.length; i++)
  {
   switch (animeAiring[i].Day)
   {
     case "Lundi":
       animeLundi[iLundi] = animeAiring[i];
       iLundi ++;
       break;

     case "Mardi":
       animeMardi[iMardi] = animeAiring[i];
       iMardi ++;
       break;

     case "Mercredi":
       animeMercredi[iMercredi] = animeAiring[i];
       iMercredi ++;
       break;

     case "Jeudi":
       animeJeudi[iJeudi] = animeAiring[i];
       iJeudi ++;
       break;

     case "Vendredi":
       animeVendredi[iVendredi] = animeAiring[i];
       iVendredi ++;
       break;

     case "Samedi":
       animeSamedi[iSamedi] = animeAiring[i];
       iSamedi ++;
       break;

     case "Dimanche":
       animeDimanche[iDimanche] = animeAiring[i];
       iDimanche ++;
       break;

     default:
     // console.log("anime pas reconu " + anime[i].Title_Myanimelist);
   }
  }

  if ( animeLundi != "" ) { oderAnimeDay(animeLundi); }
  if ( animeMardi != "" ) { oderAnimeDay(animeMardi); }
  if ( animeMercredi != "" ) { oderAnimeDay(animeMercredi); }
  if ( animeJeudi != "" ) { oderAnimeDay(animeJeudi); }
  if ( animeVendredi != "" ) { oderAnimeDay(animeVendredi); }
  if ( animeSamedi != "" ) { oderAnimeDay(animeSamedi); }
  if ( animeDimanche != "" ) { oderAnimeDay(animeDimanche); }
}

function oderAnimeDay(anime)
{
  let animeStock;

   testStock = anime.sort(function (a, b)
   {
    let stockA, stockB;
     stockA = a.Hours.split(":");
     stockB = b.Hours.split(":");

     if ( stockA[0] == stockB[0] )
     {
       return stockA[1] - stockB[1];
     }
     else
     {
       return stockA[0] - stockB[0];
     }
   });

   for (let x = 0; x < testStock.length; x++)
   {
     newAnime(testStock[x]);
   }
}

function newAnime(anime)
{
  let daysArray = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
  let lien = document.createElement('a');
  let divAnime = document.createElement('div');
  let image = document.createElement('img');
  let heure = document.createElement('span');
  let divInfosclass = document.createElement('div');
  let episode = document.createElement('p');
  let title = document.createElement('p');

  let days = document.querySelector("#" + anime.Day);
  let aHref = anime.url_myanimelist;
  let imgSrc = anime.Picture_adkami;
  let horraire = anime.Hours;
  horraire = horraire.split(":");
  let pEpisode = anime.Type_episodes + " ";
  let pTitle = anime.Tilte_Myanimelist;
  let tags = anime.Tags;
  let tagSplit, tagsTight = "", tagsNoSpecial, episodeSupTotal, animeDivClass;

  lien.href = aHref;
  tags = tags.split(",");

  if ( tags[1] == null )
  {
      lien.className = tags;
  }
  else
  {
    for (let i = 0; i < tags.length; i++)
    {
      tagSplit = tags[i].split(" ");
      for (let y = 0; y < tagSplit.length; y++)
      {
        if ( tagSplit[y] != "" )
        {
           tagsNoSpecial = removeSpecialCharacter(tagSplit[y]);
            tagsTight += tagsNoSpecial;
        }
      }
      tagsTight += " ";
    }
    lien.className = tagsTight;
  }

  if ( anime.Last_episodes_release > anime.Total_number_episodes && anime.Total_number_episodes != 0 )
  {
    episodeSupTotal = anime.Last_episodes_release - anime.Total_number_episodes ;
    pEpisode += episodeSupTotal;
  }
  else
  {
    episodeSupTotal = anime.Last_episodes_release;
    pEpisode += episodeSupTotal;
  }


  if ( daysArray.indexOf(anime.Day) < today.getDay() && anime.Day != "Dimanche" ) // jour passer
  {
    animeDivClass = testAnimeUpdate(episodeSupTotal, anime.Last_watched_episodes, 1);
    divAnime.className = "anime " + animeDivClass;
    heure.className = "time " + animeDivClass;
  }
  else if ( daysArray[today.getDay()] == anime.Day ) // jour en cour
  {
    if ( horraire[0] < today.getHours() ) // heures depasser
    {
      animeDivClass = testAnimeUpdate(episodeSupTotal, anime.Last_watched_episodes, 1);
      divAnime.className = "anime " + animeDivClass;
      heure.className = "time " + animeDivClass;
    }
    else if ( horraire[0] == today.getHours() ) //heurs pile
    {
      if ( horraire[1] <= today.getMinutes() ) // test minute sortie
      {
        animeDivClass = testAnimeUpdate(episodeSupTotal, anime.Last_watched_episodes, 1) // sortie  ajour/retard
        divAnime.className = "anime " + animeDivClass;
        heure.className = "time " + animeDivClass;
      }
      else  // pas sortie
      {
        animeDivClass = testAnimeUpdate(episodeSupTotal - 1, anime.Last_watched_episodes, 0) // pas sortie ajour/retard
        divAnime.className = "anime " + animeDivClass;
        heure.className = "time " + animeDivClass;
      }
    }
    else  // pas sortie
    {
      animeDivClass = testAnimeUpdate(episodeSupTotal - 1, anime.Last_watched_episodes, 0) // pas sortie ajour/retard
      divAnime.className = "anime " + animeDivClass;
      heure.className = "time " + animeDivClass;
    }
  }
  else //jour pas arriver
  {
    animeDivClass = testAnimeUpdate(episodeSupTotal - 1, anime.Last_watched_episodes, 0) // pas sortie ajour/retard
    divAnime.className = "anime " + animeDivClass;
    heure.className = "time " + animeDivClass;
  }

  horraire = horraire[0] + ":" + horraire[1];
  heure.textContent = horraire;
  image.src = imgSrc;
  divInfosclass.className = "infosanime";
  episode.className = "episode";
  episode.textContent = pEpisode ;
  title.className = "title";
  title.textContent = pTitle;

  days.appendChild(lien);
  lien.appendChild(divAnime);
  divAnime.appendChild(image);
  divAnime.appendChild(heure);
  divAnime.appendChild(divInfosclass);
  divInfosclass.appendChild(episode);
  divInfosclass.appendChild(title);
}

function testAnimeUpdate(lastEpisodeRelease, lasEpisodeWatched, animeSortie)
{
  let divClass;
  if ( lastEpisodeRelease == lasEpisodeWatched && animeSortie == 1 )  // sortie a jour
  {
    divClass = "animeSortie";
  }
  else if ( lastEpisodeRelease > lasEpisodeWatched && animeSortie == 1 ) //sortie retard
  {
    divClass = "animeSortieRetard";
  }
  else if ( lastEpisodeRelease > lasEpisodeWatched && animeSortie != 1 ) //pas sortie retard
  {
    divClass = "AnimeRetard";
  }
  else
  {
    divClass = "";
  }

  return divClass;
}

function todayStyle()
{
  let daysArray = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
  let days = document.querySelector("#" + daysArray[today.getDay()]);
  days.className = "colone Today";
}

function showAnimeAgenda() // pas oublier
{
  let selectAnimeAiringAdkami;
  // day title picture hours Type_episodes Last_episodes_release
  todayStyle()
  pool.getConnection()
    .then(conn => {
      selectAnimeAiringAdkami = conn.query("SELECT myanimelist.Tilte_Myanimelist, myanimelist.Last_watched_episodes, myanimelist.Total_number_episodes, myanimelist.url_myanimelist, myanimelist.Tags, anime.Voice_watching, adkami.Picture_adkami, adkami.Last_episodes_release, adkami.Day, adkami.Hours, adkami.Type_episodes FROM anime  JOIN myanimelist ON anime.id_myanimelist = myanimelist.id_myanimelist JOIN adkami ON anime.id_adkami = adkami.id_adkami WHERE myanimelist.status = 'Airing'");
      selectAnimeAiringAdkami.then(function(result)
      {
        splitDay(result);
      })
    })
    .catch(err => { console.log("erreur: " + err); });
}
