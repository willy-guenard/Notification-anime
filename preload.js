  // All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
const { ipcRenderer } = require("electron");
const mariadb = require("mariadb"); // Data base
const jikanjs  = require('jikanjs'); //api myanimelist no officiel
// const dateTime = require('DateTime');
const pool = mariadb.createPool({host: 'localhost', user:'test', password: 'xxx', database: "notification_anime"}); // DB login
const today = new Date();

window.addEventListener('DOMContentLoaded', () => {
  const kannap = document.querySelector("#kanap");
  const tokenMal = document.querySelector("#tokenMal");
  const butonfiltre = document.querySelector("#filtre");
  const butontestWindows = document.querySelector("#testWindows");

  kannap.addEventListener('click', function() { refreshAnime() });
  // tokenMal.addEventListener('click', function(){ ipcRenderer.send('asynchronous-message', 'token') });
  // butonfiltre.addEventListener('click', function(){ showFiltre("mehdi") });


  ipcRenderer.on('refreshDbF6', (event, arg) => {
    refreshAnime();
  });

  showAnimeAgenda();
})

async function refreshAnime() // refresh all data anime
{
  kanaRotate();
  const animeWatchingList = await jikanApiAnimeMalWatching("cheark"); // api myanimelist no officiel and insert db.myanimelist
  await insertUpdateMyanimelistDb(animeWatchingList); // function to inser or update anime in myanimelist DB
  const arrayAnimeAdkami = await getAnimeAgendaAdkami("https://www.adkami.com/agenda"); // get data from anime in Airing
  arrayAnimeAdkamiLastWeek = await getAnimeAgendaAdkami(urlLastWeek); // get data from anime in Airing
  await refreshAdkamiDB(arrayAnimeAdkami);
  const anotherTItle = await creatAnotherTitle(); // create variant of title anime to link myanimelist to adkami

  if ( anotherTItle != null )
  {
    const adkamiAnimeLink = await linkAdkamiAndMyanimelist(anotherTItle, arrayAnimeAdkami, arrayAnimeAdkamiLastWeek); // link data from adkami with myanimelist title
    await adkamiInsertDb(adkamiAnimeLink); // insert data in Db adkmi
    await refreshMainPages();
  }
  else
  {
    await refreshMainPages();
  }
}

async function refreshMainPages()
{
  ipcRenderer.send('refreshMainPages', "refresh");
}

function kanaRotate()
{
  let kanap = document.querySelector('#kanap');

  let angle = 0, mehdiCheck = "croquette";
  setInterval( function() {

    if ( angle == 360 || mehdiCheck == "Mon Velo?")
    {
      mehdiCheck = "Mon Velo?";
    }
   else
   {
     kanap.style.transform = "rotateZ(" + angle +++ "deg)";
   }
 }, 1);
}

async function jikanApiAnimeMalWatching(myanimelistName)
{
  return new Promise((resolve,reject) => {
    jikanjs.loadUser(myanimelistName, 'animelist', 'watching').then((response) => {
      resolve(response["anime"]);
    }).catch((err) => { console.error(err); }); // in case a error happens
  });
}

function insertUpdateMyanimelistDb(myAnimeListJson) // function to inser or update anime in myanimelist DB
{
  return new Promise((resolve,reject) => {
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
          conn.query("INSERT INTO myanimelist (MAL_id, Tilte_Myanimelist, Last_watched_episodes, Total_number_episodes, url_myanimelist, Picture_Myanimelist, Type_episodes, Tags, Status, is_rewatching, score) VALUES (" + myAnimeListJson[i].mal_id + ", '" + titleAnime + "', " + myAnimeListJson[i].watched_episodes + ", " + myAnimeListJson[i].total_episodes + ", '" + myAnimeListJson[i].url + "', '" + myAnimeListJson[i].image_url + "', '" + myAnimeListJson[i].type + "', '" + tags + "', '" + status + "', '" + myAnimeListJson[i].is_rewatching  + "', " + myAnimeListJson[i].score + ") ON DUPLICATE KEY UPDATE Last_watched_episodes = VALUES(Last_watched_episodes), Tags = VALUES(Tags), Status = VALUES(Status), score = VALUES(score)");

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
          setTimeout(()=>{
              resolve();
          } , 500);
        })
      })
      .catch(err => { console.log("erreur: " + err); });
  });
}

function supAnimeStopWatching(animeWatchingList, animeInDbMyanimelist)
{
  return new Promise((resolve,reject) => {
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
       resolve();
      })
      .catch(err => { console.log("erreur: " + err); });
  });
}

function getAnimeAgendaAdkami(url)
{
  return new Promise((resolve,reject)=>{
    // get agenda anime from adkami
    let arrayAnimeAdkami, infosAnimeAdkami;
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
  let day, testSortie, episodesAnime, nbAnimeDay, picture_url, yAnime = 0, titleClean;
  let maxDay = infosAnimeAdkami.getElementsByClassName('colone');
  let arrayAnimeAdkami = new Array();
  urlLastWeek =  infosAnimeAdkami.getElementsByClassName('left btn btn-db')[0].href;

  for (let iDay = 0; iDay < maxDay.length; iDay++) //separates the animes from the day it out
  {
    day = infosAnimeAdkami.getElementsByClassName('colone')[iDay].children[0].textContent;
    nbAnimeDay = infosAnimeAdkami.getElementsByClassName('colone')[iDay].children;

    for (let iAnime = 1; iAnime < nbAnimeDay.length; iAnime++) // check all anime day by day
    {
      arrayAnimeAdkami[yAnime] = new Object();
      testSortie = infosAnimeAdkami.getElementsByClassName('colone')[iDay].children[iAnime].localName; // first tags by anime

      if ( testSortie == "a" ) // anime out
      {
        testSortie = infosAnimeAdkami.getElementsByClassName('colone')[iDay].children[iAnime].children[0].children[0].localName;

        if ( testSortie == "script" )
        {
          picture_url = infosAnimeAdkami.getElementsByClassName('colone')[iDay].children[iAnime].children[0].children[1].outerHTML; //url_images
          episodesAnime = infosAnimeAdkami.getElementsByClassName('colone')[iDay].children[iAnime].children[0].children[3].children[0].textContent;

          titleClean = infosAnimeAdkami.getElementsByClassName('colone')[iDay].children[iAnime].children[0].children[3].children[1].textContent; //tile
          titleClean = removeSpecialCharacter(titleClean);

          arrayAnimeAdkami[yAnime].Title = titleClean
          arrayAnimeAdkami[yAnime].Title_low_caps = titleClean.toLowerCase();
          arrayAnimeAdkami[yAnime].Hours = infosAnimeAdkami.getElementsByClassName('colone')[iDay].children[iAnime].children[0].children[1].textContent; //hours
        }
        else
        {
          picture_url = infosAnimeAdkami.getElementsByClassName('colone')[iDay].children[iAnime].children[0].children[0].outerHTML; //url_images
          episodesAnime = infosAnimeAdkami.getElementsByClassName('colone')[iDay].children[iAnime].children[0].children[2].children[0].textContent;

          titleClean = infosAnimeAdkami.getElementsByClassName('colone')[iDay].children[iAnime].children[0].children[2].children[1].textContent; //tile
          titleClean = removeSpecialCharacter(titleClean);
          arrayAnimeAdkami[yAnime].Title = titleClean;
          arrayAnimeAdkami[yAnime].Title_low_caps = titleClean.toLowerCase();
          arrayAnimeAdkami[yAnime].Hours = infosAnimeAdkami.getElementsByClassName('colone')[iDay].children[iAnime].children[0].children[1].textContent; //hours
        }

        picture_url = picture_url.split('"');
        episodesAnime = episodesAnime.split(" ");

        arrayAnimeAdkami[yAnime].Day = day; //day
        arrayAnimeAdkami[yAnime].Picture_url = picture_url[1];//picture_url
        arrayAnimeAdkami[yAnime].Type_episode = episodesAnime[0]; //type Episode
        arrayAnimeAdkami[yAnime].Episode = episodesAnime[1]; //Episode

        if ( episodesAnime.length == 3 )
        {
          arrayAnimeAdkami[yAnime].Voice = episodesAnime[2]; //voice
        }
        else
        {
          arrayAnimeAdkami[yAnime].Voice = "vostfr";//voice
        }

      }
      else if ( testSortie == 'div' ) // anime not out
      {
        episodesAnime = infosAnimeAdkami.getElementsByClassName('colone')[iDay].children[iAnime].children[2].children[0].textContent; // episode
        episodesAnime = episodesAnime.split(" ");

        picture_url = infosAnimeAdkami.getElementsByClassName('colone')[iDay].children[iAnime].children[0].outerHTML; //url_images
        picture_url = picture_url.split('"');

        titleClean = infosAnimeAdkami.getElementsByClassName('colone')[iDay].children[iAnime].children[2].children[1].children[0].textContent; //titre
        titleClean = removeSpecialCharacter(titleClean);
        arrayAnimeAdkami[yAnime].Title = titleClean;
        arrayAnimeAdkami[yAnime].Title_low_caps = titleClean.toLowerCase();
        arrayAnimeAdkami[yAnime].Hours = infosAnimeAdkami.getElementsByClassName('colone')[iDay].children[iAnime].children[1].textContent; //hours
        arrayAnimeAdkami[yAnime].Day = day; //day
        arrayAnimeAdkami[yAnime].Picture_url = picture_url[1];//picture_url
        arrayAnimeAdkami[yAnime].Type_episode = episodesAnime[0]; //type Episode
        arrayAnimeAdkami[yAnime].Episode = episodesAnime[1]; //Episode

        if ( episodesAnime.length == 3 )
        {
          arrayAnimeAdkami[yAnime].Voice = episodesAnime[2]; //voice
        }
        else
        {
          arrayAnimeAdkami[yAnime].Voice = "vostfr";//voice
        }
      }
      else
      {
        arrayAnimeAdkami[yAnime].CheckFound = "warning anime not found";
      }
      yAnime++;
    }
  }
  return arrayAnimeAdkami;
}

async function refreshAdkamiDB(arrayAnimeAdkami)
{
  let selectAnimeAdkamiUpdate, dataAnime;

  pool.getConnection()
    .then(conn => {
      selectAnimeAdkamiUpdate = conn.query("SELECT Title_Adkami, Voice FROM adkami");
      selectAnimeAdkamiUpdate.then(function(animeUpdateAdkami)
      {
        for (let i = 0; i < animeUpdateAdkami.length; i++)
        {
          dataAnime = arrayAnimeAdkami.find(element => element.Title == animeUpdateAdkami[i].Title_Adkami && element.Voice == animeUpdateAdkami[i].Voice);

          if ( dataAnime != undefined )
          {
            conn.query("UPDATE adkami SET Last_episodes_release = " + dataAnime.Episode + ", Present_this_week = 'Yes', Day ='" + dataAnime.Day + "', Hours ='" + dataAnime.Hours + "' WHERE Title_Adkami = '" + animeUpdateAdkami[i].Title_Adkami + "'AND Voice = '" + animeUpdateAdkami[i].Voice + "' ;");
          }
          else
          {
            conn.query("UPDATE adkami SET Present_this_week = 'No' WHERE Title_Adkami = '" + animeUpdateAdkami[i].Title_Adkami + "' AND Voice = '" + animeUpdateAdkami[i].Voice + "' ;");
          }
        }
      })
    })
    .catch(err => { console.log("erreur: " + err); });
}

async function creatAnotherTitle() // creat recurrent variant of title anime from myanimelist
{
  return new Promise((resolve, reject)=>{
    let selectAnime;
     anotherTitleList = new Array();

    pool.getConnection()
    .then(conn => {
      selectAnime = conn.query("SELECT Title_anime from anime JOIN myanimelist ON anime.id_myanimelist = myanimelist.id_myanimelist where id_adkami IS NULL AND id_other_anime IS NULL AND myanimelist.Status = 'Airing'");
      selectAnime.then(function(result)
      {
        if ( result.length == 0 )
        {
          resolve(null);
        }
        else
        {
          for (let i = 0; i < result.length; i++) // try all title
          {
            title = result[i].Title_anime.toLowerCase();
            anotherTitleList[i] = new Object();
            anotherTitleList[i].Title_originel = title;

            if ( titleTryOu(result[i].Title_anime) != undefined ) //test if this variant make a result
            {
              anotherTitleList[i].Title_try_ou = titleTryOu(title);
            }

            if ( titleJustS(result[i].Title_anime) != undefined ) { anotherTitleList[i].Title_just_S = titleJustS(title); } //test if this variant make a result
            if ( titleNoDoblePoint(result[i].Title_anime) != undefined ) { anotherTitleList[i].Title_no_double_point = titleNoDoblePoint(title); } //test if this variant make a result
          }

          resolve(anotherTitleList);
        }
      })
    })
    .catch(err => { console.log("erreur: " + err); });
  });
}

function titleTryOu(titleMyanimelist)
{
  let nbOFOu = numberOfRepetitions(titleMyanimelist, "ou"); // get number of "ou" in title
  let titleFromOuToO = new Array();
  let stockIndexOu, stockIndexOu2;

  switch (nbOFOu) // distributed according to the number of "ou" find
  {
    case 0:
      //don't find "ou" in title
      titleFromOuToO = undefined;
    break;

    case 1:
      // o
      titleFromOuToO[0] = titleMyanimelist.replace('ou', 'o');
    break;

    case 2:

      // o|ou
      titleFromOuToO[0] = titleMyanimelist.replace('ou', 'o');

      // o|o
      titleFromOuToO[1] = titleFromOuToO[0].replace('ou', 'o');

      // ou|o
      stockIndexOu = titleFromOuToO[0].indexOf('ou');
      titleFromOuToO[2] = titleMyanimelist.slice(0, stockIndexOu + 1) + titleMyanimelist.slice(stockIndexOu + 2)

    break;

    case 3:
      // o ou ou
      titleFromOuToO[0] = titleMyanimelist.replace('ou', 'o');

      // o o ou
      titleFromOuToO[1] = titleFromOuToO[0].replace('ou', 'o');

      // o o o
      titleFromOuToO[2] = titleFromOuToO[1].replace('ou', 'o');

      //stock index
      stockIndexOu = titleFromOuToO[0].indexOf('ou'); // index ou potition 2
      stockIndexOu2 = titleFromOuToO[1].indexOf('ou'); // index ou potition 3

      // ou o o
      titleFromOuToO[3] = titleMyanimelist.slice(0, stockIndexOu + 2) + titleMyanimelist.slice(stockIndexOu + 3, stockIndexOu2 + 3) + titleMyanimelist.slice(stockIndexOu2 + 4);

      // ou o ou
      titleFromOuToO[4] = titleMyanimelist.slice(0, stockIndexOu + 2) + titleMyanimelist.slice(stockIndexOu + 3);

      // ou ou o
      titleFromOuToO[5] = titleMyanimelist.slice(0, stockIndexOu2 + 3) + titleMyanimelist.slice(stockIndexOu2 + 4);

      // o ou o
      titleFromOuToO[6] = titleFromOuToO[0].slice(0, stockIndexOu2 + 2) + titleFromOuToO[0].slice(stockIndexOu2 + 3);

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

    newTitle = newTitle + "s" + numberSeason;
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
    newTitle = newTitle + "s" + numberSeason;
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

    newTitle = newTitle + "s" + numberSeason;
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

      newTitle = newTitle + "s" + numberSeason;
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

async function linkAdkamiAndMyanimelist(anotherTitle, arrayAnimeAdkami, arrayAnimeAdkamiLastWeek)
{
  return new Promise((resolve,reject)=>{
    let animeLinkAdkami = new Array(); let animeManuelle = new Array();
    let nbAnimeLink = 0, nbManuelleAnime = 0 ;
    let indexAnime = new Object();
    let stockArray = arrayAnimeAdkami

    for (let i = 0; i < anotherTitle.length; i++)
    {
      indexAnime = tryAnimeAdkami(anotherTitle[i], arrayAnimeAdkami);
      arrayAnimeAdkami = stockArray;

      if ( indexAnime.animeVostfr == -1 && indexAnime.animeVf == -1 )
      {
        indexAnime = tryAnimeAdkami(anotherTitle[i], arrayAnimeAdkamiLastWeek);
        arrayAnimeAdkami = arrayAnimeAdkamiLastWeek;
      }

      if ( indexAnime.animeVostfr != -1 || indexAnime.animeVf != -1)
      {
        if (indexAnime.animeVostfr != -1)
        {
          animeLinkAdkami[nbAnimeLink] = new Object();
          animeLinkAdkami[nbAnimeLink].Title_myanimelist = anotherTitle[i].Title_originel;
          animeLinkAdkami[nbAnimeLink].Title_adkami = arrayAnimeAdkami[indexAnime.animeVostfr].Title;
          animeLinkAdkami[nbAnimeLink].Day = arrayAnimeAdkami[indexAnime.animeVostfr].Day;
          animeLinkAdkami[nbAnimeLink].Episode = arrayAnimeAdkami[indexAnime.animeVostfr].Episode;
          animeLinkAdkami[nbAnimeLink].Hours = arrayAnimeAdkami[indexAnime.animeVostfr].Hours;
          animeLinkAdkami[nbAnimeLink].Picture_url = arrayAnimeAdkami[indexAnime.animeVostfr].Picture_url;
          animeLinkAdkami[nbAnimeLink].Type_episode = arrayAnimeAdkami[indexAnime.animeVostfr].Type_episode;
          animeLinkAdkami[nbAnimeLink].Voice = arrayAnimeAdkami[indexAnime.animeVostfr].Voice;

          nbAnimeLink++;
        }

        if (indexAnime.animeVf != -1)
        {
          animeLinkAdkami[nbAnimeLink] = new Object();
          animeLinkAdkami[nbAnimeLink].Title_myanimelist = anotherTitle[i].Title_originel;
          animeLinkAdkami[nbAnimeLink].Title_adkami = arrayAnimeAdkami[indexAnime.animeVf].Title;
          animeLinkAdkami[nbAnimeLink].Day = arrayAnimeAdkami[indexAnime.animeVf].Day;
          animeLinkAdkami[nbAnimeLink].Episode = arrayAnimeAdkami[indexAnime.animeVf].Episode;
          animeLinkAdkami[nbAnimeLink].Hours = arrayAnimeAdkami[indexAnime.animeVf].Hours;
          animeLinkAdkami[nbAnimeLink].Picture_url = arrayAnimeAdkami[indexAnime.animeVf].Picture_url;
          animeLinkAdkami[nbAnimeLink].Type_episode = arrayAnimeAdkami[indexAnime.animeVf].Type_episode;
          animeLinkAdkami[nbAnimeLink].Voice = arrayAnimeAdkami[indexAnime.animeVf].Voice;

          nbAnimeLink++
        }

      }
      else
      {
        animeManuelle[nbManuelleAnime] = anotherTitle[i].Title_originel;
        nbManuelleAnime ++;
      }
    }
    adkamiManuelle(animeManuelle, arrayAnimeAdkami, arrayAnimeAdkamiLastWeek);
    resolve(animeLinkAdkami);
  });
}

function tryAnimeAdkami(anotherTitle, arrayAnimeAdkami)
{
  let indexAnime = new Object();

  indexAnime = findAnimeAdkami(indexAnime, arrayAnimeAdkami, anotherTitle.Title_originel, -1, null);
  if ( indexAnime.animeVostfr != -1 || indexAnime.animeVf != -1 ) { return indexAnime; }

  if ( anotherTitle.Title_just_S != null )
  {
    indexAnime = findAnimeAdkami(indexAnime, arrayAnimeAdkami, anotherTitle.Title_just_S, -1, null);
    if ( indexAnime.animeVostfr != -1 || indexAnime.animeVf != -1 ) { return indexAnime; }
  }

  if ( anotherTitle.Title_no_double_point != null )
  {
    indexAnime = findAnimeAdkami(indexAnime, arrayAnimeAdkami, anotherTitle.Title_no_double_point, -1, null);
    if ( indexAnime.animeVostfr != -1 || indexAnime.animeVf != -1 ) { return indexAnime; }
  }

  if ( anotherTitle.Title_try_ou != null )
  {
    for (let i = 0; i < anotherTitle.Title_try_ou.length; i++)
    {
      indexAnime = findAnimeAdkami(indexAnime, arrayAnimeAdkami, anotherTitle.Title_try_ou[i], -1, null);
      if ( indexAnime.Vostfr != -1 || indexAnime.animeVf != -1 ) { return indexAnime; }
    }
  }

  return indexAnime;
}

function findAnimeAdkami(indexAnime, arrayAnimeAdkami, title, index, firstVoice)
{
  if (index != -1 )
  {
    if ( firstVoice == "vostfr" )
    {
      arrayAnimeAdkami = arrayAnimeAdkami.slice(index + 1);
      indexSeconde = arrayAnimeAdkami.findIndex(element => element.Title_low_caps == title);
      if (indexSeconde == -1) { indexAnime.animeVostfr = index; indexAnime.animeVf = -1}
      else { indexAnime.animeVostfr  = index; indexAnime.animeVf = indexSeconde + index + 1; }
    }
    else
    {
      arrayAnimeAdkami = arrayAnimeAdkami.slice(index + 1);
      indexSeconde = arrayAnimeAdkami.findIndex(element => element.Title_low_caps == title)
      if (indexSeconde == -1) { indexAnime.animeVf = index; indexAnime.animeVostfr = -1}
      else {indexAnime.animeVf = index;  indexAnime.animeVostfr  = indexSeconde + index + 1; }
    }
  }

  index = arrayAnimeAdkami.findIndex(element => element.Title_low_caps == title);
  if ( index != -1 && firstVoice == null )
  {
    firstVoice = arrayAnimeAdkami[index].Voice;
    findAnimeAdkami(indexAnime, arrayAnimeAdkami, title, index, firstVoice);
  }

  if ( indexAnime.animeVostfr != undefined && indexAnime.animeVf != undefined)
  { return indexAnime; }
  else
  { indexAnime.animeVostfr = -1; indexAnime.animeVf = -1; return indexAnime;}
}

function adkamiManuelle(animeTitle, arrayAnimeAdkami, arrayAnimeAdkamiLastWeek)
{
  console.log( ipcRenderer.sendSync('windowsAnimeManuelle', animeTitle, arrayAnimeAdkami, arrayAnimeAdkamiLastWeek) );
}

async function adkamiInsertDb(adkamiAnimeLink)
{
  return new Promise((resolve,reject) => {
    let selectAnime, timeStop;
    pool.getConnection()
      .then(conn => {
        for (let i = 0; i < adkamiAnimeLink.length; i++)
        {
          conn.query("INSERT INTO adkami (Unique_title, Title_Adkami, Last_episodes_release, Picture_adkami, Voice, Day, Hours, Type_episodes, Present_this_week) VALUES ('" + adkamiAnimeLink[i].Title_adkami + " " + adkamiAnimeLink[i].Type_episode + " " + adkamiAnimeLink[i].Voice + "','" + adkamiAnimeLink[i].Title_adkami + "'," + adkamiAnimeLink[i].Episode + ",'" + adkamiAnimeLink[i].Picture_url + "','" + adkamiAnimeLink[i].Voice + "','" + adkamiAnimeLink[i].Day + "','" + adkamiAnimeLink[i].Hours + "','" + adkamiAnimeLink[i].Type_episode + "', 'Yes' ) ON DUPLICATE KEY UPDATE Last_episodes_release = VALUES(Last_episodes_release), Day = VALUES(Day), Hours = VALUES(Hours)");

          selectAnime = conn.query("SELECT adkami.id_adkami from adkami where Title_Adkami = '" + adkamiAnimeLink[i].Title_adkami + "' AND Voice = 'Vostfr';"); // pour la version ou les vf son pris en compte changer apres AND
          selectAnime.then(function(result)
          {
            conn.query("UPDATE anime SET id_adkami = " + result[0].id_adkami + " WHERE Title_anime = '" + adkamiAnimeLink[i].Title_myanimelist + "' AND id_adkami is NULL;");
          })
        }
      timeStop = adkamiAnimeLink.length * 66.6;
      setTimeout(()=>{
          resolve();
      } , timeStop);
    })
    .catch(err => { console.log("erreur: " + err); });

  });
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

  let horraire = anime.Hours;
  horraire = horraire.split(":");
  let pEpisode = anime.Type_episodes + " ";
  let tags = anime.Tags;
  let tagSplit, tagsTight = "", tagsNoSpecial, episodeSupTotal, animeDivClass, animeClass ="";

  lien.href = anime.url_myanimelist;
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

  if ( anime.Last_episodes_release > anime.Total_number_episodes && anime.Total_number_episodes != 0 ) // anime avec episode qui continue avec celui de la saison dernier
  {
    episodeSupTotal = anime.Last_episodes_release - anime.Total_number_episodes ; //on retire les episode de la saison dernier
    pEpisode += episodeSupTotal;
  }
  else
  {
    pEpisode += anime.Last_episodes_release; // le nombre d'episode est correct
  }


  if ( daysArray.indexOf(anime.Day) < today.getDay() && anime.Day != "Dimanche" || today.getDay() == 0 && anime.Day != "Dimanche") //jour passer
  {
    animeClass = "Sortie";
  }
  else if ( daysArray[today.getDay()] == anime.Day ) //jour meme
  {
    if ( horraire[0] < today.getHours() ) //heures depasser
    {
      animeClass = "Sortie";
    }
    else if ( horraire[0] == today.getHours() ) //heures piles
    {
      if ( horraire[1] <= today.getMinutes() )
      {
        animeClass = "Sortie";
      }
    }
  }

  if ( anime.Last_watched_episodes < anime.Last_episodes_release ) // je ne suis pas a jour
  {
    animeClass += "Retard";
  }


  if ( anime.Present_this_week == "Yes" || anime.Last_watched_episodes == anime.Last_episodes_release)
  {
    horraire = horraire[0] + ":" + horraire[1];
  }
  else
  {
    horraire = "???"
  }

  divAnime.className = "anime " + animeClass;
  heure.className = "time " + animeClass;
  heure.textContent = horraire;
  image.src = anime.Picture_adkami;
  divInfosclass.className = "infosanime";
  episode.className = "episode";
  episode.textContent = pEpisode ;
  title.className = "title";
  title.textContent = anime.Tilte_Myanimelist;

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
      selectAnimeAiringAdkami = conn.query("SELECT myanimelist.Tilte_Myanimelist, myanimelist.Last_watched_episodes, myanimelist.Total_number_episodes, myanimelist.url_myanimelist, myanimelist.Tags, anime.Voice_watching, adkami.Picture_adkami, adkami.Last_episodes_release, adkami.Day, adkami.Hours, adkami.Type_episodes, adkami.Present_this_week FROM anime  JOIN myanimelist ON anime.id_myanimelist = myanimelist.id_myanimelist JOIN adkami ON anime.id_adkami = adkami.id_adkami WHERE anime.id_adkami is not null ORDER BY DAY, Hours");
      selectAnimeAiringAdkami.then(function(result)
      {
        for (let x = 0; x < result.length; x++)
        {
          newAnime(result[x]);
        }
      })
    })
    .catch(err => { console.log("erreur: " + err); });
}
