// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
window.addEventListener('DOMContentLoaded', () => {

  const butonRefresh = document.querySelector("#butonRefresh");
  const tokenMal = document.querySelector("#tokenMal");
  const patchMal = document.querySelector("#patchMal");
  const butShowAnimeAgenda = document.querySelector("#showAgenda")
  const butonTest = document.querySelector("#butonTest")

  butonRefresh.addEventListener('click', function(){refreshAnime()});
  // tokenMal.addEventListener('click', function(){token_recuperation()});
  // patchMal.addEventListener('click', function(){patchMyanimelist(21, 107, 1000 , 8)});
  butShowAnimeAgenda.addEventListener('click', function(){creatAgendaAnime()})
  butonTest.addEventListener('click', function(){});

  showAnimeAgenda();
})
const {ipcRenderer} = require("electron");
const fs = require('fs');


function refreshAnime()
{
  getAnimeCurrentlyWatching("cheark");
  getAnimeAgendaAdkami();
  creatAnotherTitle();
  // creatAgendaAnime();
  // showAnimeAgenda();
}

function getAnimeCurrentlyWatching(user)
{
  // api jikan request to get anime in the watching list of a user
  let url = "https://api.jikan.moe/v3";
  let request = new XMLHttpRequest();
  let requestGetWathingList = "/user/"+ user + "/animelist/watching/";

  request.open('GET', url + requestGetWathingList);
  request.responseType = 'json';
  request.send();

  request.onload = function()
  {
    let reply_watching_list = request.response;
    refreshMyAnimeListJson(reply_watching_list);
  }
}

function refreshMyAnimeListJson(reply_watching_list)
{
  // creat a json myanimelist to api jikan request
  let animelist = reply_watching_list['anime'];
  let json_watching_anime = '{\n\t\t"animeMyanimelist":[';
  let statusAnime;

  for (let i = 0; i < animelist.length; i++)
  {
    json_watching_anime += '\n\t\t{';
    json_watching_anime += '\n\t\t\t"Mal_id":' + animelist[i].mal_id;
    json_watching_anime += ',\n\t\t\t"Title":"' + animelist[i].title;
    json_watching_anime += '",\n\t\t\t"Watched_episodes":' + animelist[i].watched_episodes;
    json_watching_anime += ',\n\t\t\t"Total_episodes":' + animelist[i].total_episodes;
    statusAnime = animelist[i].end_date;

    if (statusAnime == null)
    {
      json_watching_anime += ',\n\t\t\t"Status":"' + "Airing";
    }
    else
    {
      json_watching_anime += ',\n\t\t\t"Status":"' + "Release";
    }

    json_watching_anime += '",\n\t\t\t"Type":"' + animelist[i].type;
    json_watching_anime += '",\n\t\t\t"Tags":"' + animelist[i].tags;
    json_watching_anime += '"\n\t\t},';
  }

  json_watching_anime = json_watching_anime.slice(0, -1);
  json_watching_anime += '\n\t]\n}'

  let objet_json = JSON.stringify(json_watching_anime)


  fs.writeFile("./Json/myanimelistAnime.json", json_watching_anime, function(err, result)
    {
      if(err)
        {
          console.log('error', err);
        }
        else
        {
          console.log("File MyAnimeList Json: update");
        }
    });
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

function creatAnotherTitle()
{
  let myanimelistJsonFile = fs.readFileSync('./Json/myanimelistAnime.json');
  let myAnimeListJson = JSON.parse(myanimelistJsonFile);
  let objetMyanimelistJson = myAnimeListJson['animeMyanimelist'];
  let titleMyanimelist ;
  let anotherTitleList = "";
  let titleListSplitAnime = "";
  let titleListSplitTitle = "";
  let titleListAnother = "";
  let anotherTitleJson = "{";
  let teststock = "";

  for (let i = 0; i < objetMyanimelistJson.length; i++)
  {
    titleMyanimelist = objetMyanimelistJson[i].Title;
    teststock += titleMyanimelist + "//";
    anotherTitleList += titleTryOu(titleMyanimelist);
    anotherTitleList += titleJustS(titleMyanimelist);
    anotherTitleList += titleNoDoblePoint(titleMyanimelist);
    anotherTitleList += "//";
  }

  titleListSplitAnime = anotherTitleList.split("//");
  titleListSplitAnime.pop();
  teststock = teststock.split("//");


  for (let y = 0; y < titleListSplitAnime.length; y++)
  {
    titleListAnother = titleListSplitAnime[y].split("[]");
    anotherTitleJson += '\n\t"' + teststock[y] + '": [';

    for (let x = 0; x < titleListAnother.length; x++)
    {

      if (titleListAnother[x] != "")
      {
        anotherTitleJson += '\n\t\t"' + titleListAnother[x] + '",';
      }
      else if (titleListAnother.length == 1)
      {
        anotherTitleJson += '\n\t"" ';
      }
    }
    anotherTitleJson = anotherTitleJson.slice(0, -1);
    anotherTitleJson += '\n\t],';
  }

  anotherTitleJson = anotherTitleJson.slice(0, -1);
  anotherTitleJson += '\n}';

  fs.writeFile("./Json/anotherTitle.json", anotherTitleJson, function(err, result)
  {
    if(err)
      {
        console.log('error', err);
      }
      else
      {
        console.log("File anotherTitle Json: update");
      }
  })

}

function titleNoDoblePoint(titleMyanimelist)
{
  let titleNoDoblePointlist;
  let firstSplit;

  if (titleMyanimelist.indexOf(":") != -1)
  {
    titleNoDoblePointlist = '[]' + titleMyanimelist.replace(":", "");
    firstSplit = titleMyanimelist.split(":");
    titleNoDoblePointlist += '[]' + firstSplit[0];
  }
  else
  {
    titleNoDoblePointlist = "";
  }

  return titleNoDoblePointlist;
}

function titleJustS(titleMyanimelist)
{
  let titleJustSList = '';
  let splitSeason ='';
  let testSeason = '';

  // 2nd seconde Season
  testSeason = titleMyanimelist.indexOf('2nd');
  if (testSeason != -1)
  {
    splitSeason = titleMyanimelist.split('2nd');
    titleJustSList = '[]' + splitSeason[0] + "S2";
  }

  // 3rd third Season
  testSeason = titleMyanimelist.indexOf('3rd');
  if (testSeason != -1)
  {
    splitSeason = titleMyanimelist.split('3rd');
    titleJustSList = '[]' + splitSeason[0] + "S3";
  }

  // 4rd fourth Season
  testSeason = titleMyanimelist.indexOf('4th');
  if (testSeason != -1)
  {
    splitSeason = titleMyanimelist.split('4th');
    titleJustSList = '[]' + splitSeason[0] + "S4";
  }

  // 5rd fifth Season
  testSeason = titleMyanimelist.indexOf('5th');
  if (testSeason != -1)
  {
    splitSeason = titleMyanimelist.split('5th');
    titleJustSList = '[]' + splitSeason[0] + "S5";
  }

  return titleJustSList
}

function titleTryOu(titleMyanimelist)
{
  let nbOFOu = numberOfRepetitions(titleMyanimelist, "ou");
  let titleFromOuToO ='';
  let stockTitle1, stockTitle2, stockTitle3, stockTitle4, stockTitle5, stockTitle6, stockTitle7;
  let stockFirstOu, stockSecondeOu;

  switch (nbOFOu)
  {
    case 0:
      // c'est non
    break;

    case 1:
      titleFromOuToO = "[]" + titleMyanimelist.replace('ou', 'o');

    break;

    case 2:
      stockFirstOu = titleMyanimelist.indexOf('ou');

      // o|ou
      stockTitle1 = titleMyanimelist.replace('ou', 'o');
      titleFromOuToO += "[]" + stockTitle1 + "[]";

      // o|o
      stockTitle2 = stockTitle1.replace('ou', 'o');
      titleFromOuToO += stockTitle2 + "[]";

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
      titleFromOuToO += "[]" + stockTitle1 + '[]';

      // o o ou
      stockTitle2 = stockTitle1.replace('ou', 'o');
      titleFromOuToO += stockTitle2 + '[]';

      // ou o ou
      stockFirstOu = titleMyanimelist.indexOf('ou');
      stockTitle3 = stockTitle2.split('');
      stockTitle3.splice(stockFirstOu + 1, 0, 'u');

      for (let i = 0; i < stockTitle3.length; i++)
        {
          titleFromOuToO += stockTitle3[i];
        }
      titleFromOuToO += '[]';

      // o o o
      stockTitle4 = stockTitle2.replace('ou', 'o');
      titleFromOuToO += stockTitle4 + '[]';

      // ou o o
      stockFirstOu = titleMyanimelist.indexOf('ou');

      stockTitle5 = stockTitle4.split('');
      stockTitle5.splice(stockFirstOu + 1, 0, 'u');

      for (let i = 0; i < stockTitle5.length; i++)
        {
          titleFromOuToO += stockTitle5[i];
        }
      titleFromOuToO += '[]';

      // o ou o
      stockFirstOu = titleMyanimelist.indexOf('ou');
      stockSecondeOu = titleMyanimelist.indexOf('ou', stockFirstOu + 1);

      stockTitle6 = stockTitle4.split('');
      stockTitle6.splice(stockSecondeOu, 0, 'u');

      for (let i = 0; i < stockTitle6.length; i++)
        {
          titleFromOuToO += stockTitle6[i];
        }
      titleFromOuToO += '[]';

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

function creatAgendaAnime()
{
  let myanimelistFile = fs.readFileSync('./Json/myanimelistAnime.json');
  let myanimelistJson = JSON.parse(myanimelistFile);
  let objectMyanimelistJson = myanimelistJson['animeMyanimelist'];
  let animeAgendaJson = '{\n\t"anime": [\n';

  for (let i = 0; i < objectMyanimelistJson.length; i++)
  {
    if(objectMyanimelistJson[i].Status == "Airing") // anime en cour
    {
      animeAgendaJson += getAnimeAiring(objectMyanimelistJson[i]);
    }
    else if (objectMyanimelistJson[i].Status == "Release") // anime fini de sortire
    {
      animeAgendaJson += getAnimeRelease(objectMyanimelistJson[i]);
    }
    else // anime pas encore sortie
    {
      console.log(objectMyanimelistJson[i].Title + " pas encore sortie");
    }
  }

  animeAgendaJson = animeAgendaJson.slice(0, -2);
  animeAgendaJson += '\n\t]\n}'

  fs.writeFile("./Json/agendaAnime.json", animeAgendaJson, function(err, result)
  {
    if(err)
      {
        console.log('error', err);
      }
      else
      {
        console.log("File animeAgenda Json: update");
      }
  })
}

function getAnimeAiring(animeArray)
{
  let animeStock = "\t{";
  let animeAdkamiData;

  animeAdkamiData = linkMyanimelistAdkami(animeArray.Title);

  animeStock += '\n\t\t"Mal_id":' + animeArray.Mal_id;
  animeStock += ',\n\t\t"Title_Myanimelist":"' + animeArray.Title;
  animeStock += '",\n\t\t"last_watched_episodes":' + animeArray.Watched_episodes;
  animeStock += ',\n\t\t"total_number_episodes":' + animeArray.Total_episodes;
  animeStock += ',\n\t\t"Type":"' + animeArray.Type;
  animeStock += '",\n\t\t"Tags":"' + animeArray.Tags;
  animeStock += animeAdkamiData;
  animeStock += '"\n\t},\n';

  return animeStock;
}

function getAnimeRelease(animeArray)
{
  let animeStock = "\t{";
  animeStock += '\n\t\t"Mal_id":' + animeArray.Mal_id;
  animeStock += ',\n\t\t"Title_Myanimelist":"' + animeArray.Title;
  animeStock += '",\n\t\t"last_watched_episodes":' + animeArray.Watched_episodes;
  animeStock += ',\n\t\t"total_number_episodes":' + animeArray.Total_episodes;
  animeStock += ',\n\t\t"Type":"' + animeArray.Type;
  animeStock += '",\n\t\t"Tags":"' + animeArray.Tags;
  animeStock += '",\n\t\t"Day":' + '"sortie"';
  animeStock += '\n\t},\n';

  return animeStock;
  // console.log("Sortie: " + animeArray.Title);
}

function linkMyanimelistAdkami(tiltle)
{
  let adkamiFile = fs.readFileSync('./Json/adkamiAnime.json');
  let adkamiJson = JSON.parse(adkamiFile);
  let objectAdkamiJson = adkamiJson['animeAdkami'];

  let anotherTitleFile = fs.readFileSync('./Json/anotherTitle.json');
  let anotherTitleJson = JSON.parse(anotherTitleFile);
  let objectAnotherTitleJson = anotherTitleJson[tiltle];

  let stockAnimeData = "";
  let stockAnimeTitle = tiltle.toLowerCase();
  let titleNoCaps;
  let testTilte, testTilte2;
  let titleSplit3Time, titleSplit3Time2;
  let doubtTitle = "";

  for (let y = 0; y < objectAnotherTitleJson.length; y++)
  {
    if (objectAnotherTitleJson[y] != "")
    {
      titleNoCaps = objectAnotherTitleJson[y].toLowerCase();
      stockAnimeTitle += "[]" +  titleNoCaps;
    }
  }

  stockAnimeTitle = stockAnimeTitle.split("[]");

  for (let i = 0; i < objectAdkamiJson.length; i++)
  {
    for (let x = 0; x < stockAnimeTitle.length; x++)
    {
      titleNoCaps = objectAdkamiJson[i].Title.toLowerCase();
      testTilte = titleNoCaps.indexOf(stockAnimeTitle[x]);

      titleSplit3Time = titleNoCaps.split(" ");
      titleSplit3Time = titleSplit3Time[0] + " " + titleSplit3Time[1] + " " + titleSplit3Time[2] + " " + titleSplit3Time[3];

      titleSplit3Time2 = stockAnimeTitle[x].split(" ");
      titleSplit3Time2 =  titleSplit3Time2[0] + " " + titleSplit3Time2[1] + " " + titleSplit3Time2[2] + " " + titleSplit3Time2[3];

      testTilte2 =  titleSplit3Time.indexOf(titleSplit3Time2);

      if (titleNoCaps == stockAnimeTitle[x])
      {
        stockAnimeData = '",\n\t\t"Title_Adkami":"' + objectAdkamiJson[i].Title;
        stockAnimeData += '",\n\t\t"Picture":"' + objectAdkamiJson[i].Picture;
        stockAnimeData += '",\n\t\t"Last_episode_release":' + objectAdkamiJson[i].Episode;
        stockAnimeData += ',\n\t\t"Type_episodes":"' + objectAdkamiJson[i].Type_episode;
        stockAnimeData += '",\n\t\t"Voice":"' + objectAdkamiJson[i].Voice;
        stockAnimeData += '",\n\t\t"Hours":"' + objectAdkamiJson[i].Hours;
        stockAnimeData += '",\n\t\t"Day":"' + objectAdkamiJson[i].Day;

        return stockAnimeData;
      }
      else if (testTilte != -1) // "Titre trouver avec une partie du titre trouver";
      {
        // stockAnimeData = "Titre trouver avec une partie du titre trouver\n";
        stockAnimeData = '",\n\t\t"Title_Adkami":"' + objectAdkamiJson[i].Title;
        stockAnimeData += '",\n\t\t"Picture":"' + objectAdkamiJson[i].Picture;
        stockAnimeData += '",\n\t\t"Last_episode_release":' + objectAdkamiJson[i].Episode;
        stockAnimeData += ',\n\t\t"Type_episodes":"' + objectAdkamiJson[i].Type_episode;
        stockAnimeData += '",\n\t\t"Voice":"' + objectAdkamiJson[i].Voice;
        stockAnimeData += '",\n\t\t"Hours":"' + objectAdkamiJson[i].Hours;
        stockAnimeData += '",\n\t\t"Day":"' + objectAdkamiJson[i].Day;

        doubtTitle = 1;
      }
      else if (testTilte2 != -1) // "Titre trouver avec 3 premier mot du titre"
      {
        // stockAnimeData = "trouver avec les 3 premier mot\n";
        stockAnimeData = '",\n\t\t"Title_Adkami":"' + objectAdkamiJson[i].Title;
        stockAnimeData += '",\n\t\t"Picture":"' + objectAdkamiJson[i].Picture;
        stockAnimeData += '",\n\t\t"Last_episode_release":' + objectAdkamiJson[i].Episode;
        stockAnimeData += ',\n\t\t"Type_episodes":"' + objectAdkamiJson[i].Type_episode;
        stockAnimeData += '",\n\t\t"Voice":"' + objectAdkamiJson[i].Voice;
        stockAnimeData += '",\n\t\t"Hours":"' + objectAdkamiJson[i].Hours;
        stockAnimeData += '",\n\t\t"Day":"' + objectAdkamiJson[i].Day;

        doubtTitle = 1;
      }
    }
  }
  if (doubtTitle == 1)
  {
    // faire un teste en demandant a l'user de verifier le titre de l'anime
    return stockAnimeData;
  }
  else // afficher le nom de l'anime de myanimelist et faire taper par le user le name sur adkami
  {
    stockAnimeData = "Erreur: Anime no Find";
    return '",\n\t\t"Day":"erreur';
  }

}

function showAnimeAgenda()
{
  let animeFile = fs.readFileSync('./Json/agendaAnime.json');
  let animeJson = JSON.parse(animeFile);
  let anime = animeJson.anime;
  let animeLundi = [], iLundi = 0;
  let animeMardi  = [], iMardi = 0;
  let animeMercredi = [], iMercredi = 0;
  let animeJeudi = [], iJeudi = 0;
  let animeVendredi = [], iVendredi = 0;
  let animeSamedi = [], iSamedi = 0;
  let animeDimanche = [], iDimanche = 0;
  let animeSortie;


  for (let i = 0; i < anime.length; i++)
  {
   switch (anime[i].Day)
   {
     case "lundi":
       animeLundi[iLundi] = splitDataAnime(anime[i]);
       iLundi ++;
       break;

     case "mardi":
       animeMardi[iMardi] = splitDataAnime(anime[i]);
       iMardi ++;
       break;

     case "mercredi":
       animeMercredi[iMercredi] = splitDataAnime(anime[i]);
       iMercredi ++;
       break;

     case "jeudi":
       animeJeudi[iJeudi] = splitDataAnime(anime[i]);
       iJeudi ++;
       break;

     case "vendredi":
       animeVendredi[iVendredi] = splitDataAnime(anime[i]);
       iVendredi ++;
       break;

     case "samedi":
       animeSamedi[iSamedi] = splitDataAnime(anime[i]);
       iSamedi ++;
       break;

     case "dimanche":
       animeDimanche[iDimanche] = splitDataAnime(anime[i]);
       iDimanche ++;
       break;

     case "sortie":
       animeSortie = splitDataAnime(anime[i]);
       newAnime(animeSortie);
       break;

     default:
     // console.log("anime pas reconu " + anime[i].Title_Myanimelist);
   }
  }

  if (animeLundi != "" ) { oderAnimeDay(animeLundi); }

  if (animeMardi != "" ) { oderAnimeDay(animeMardi); }

  if (animeMercredi != "" ) { oderAnimeDay(animeMercredi); }

  if (animeJeudi != "" ) { oderAnimeDay(animeJeudi); }

  if (animeVendredi != "" ) { oderAnimeDay(animeVendredi); }

  if (animeSamedi != "" ) { oderAnimeDay(animeSamedi); }

  if (animeDimanche != "" ) { oderAnimeDay(animeDimanche); }

}

function splitDataAnime(arrayAnimeData)
{
  let day, aHref = "", imgSrc = "", horraire = "", pEpisode, pTitle, voice;
  let animeData = "";
  let tags = "";

  day = arrayAnimeData.Day;
  aHref = "";
  imgSrc = arrayAnimeData.Picture;
  horraire = arrayAnimeData.Hours;

  pTitle = arrayAnimeData.Title_Myanimelist;

  if (arrayAnimeData.Tags != null) { tags = arrayAnimeData.Tags; }


  if (arrayAnimeData.Day == "sortie")
  {
    pEpisode = arrayAnimeData.last_watched_episodes + 1;
    pEpisode =  "Episode "+ pEpisode
  }
  else
  {
     pEpisode = arrayAnimeData.Type_episodes + " ";
     pEpisode += arrayAnimeData.Last_episode_release ;
     if (arrayAnimeData.Voice == "vf")
     {
      pEpisode += " " + arrayAnimeData.Voice
     }
  }

  animeData = [day, aHref, imgSrc, horraire, pEpisode, pTitle, tags];

  return animeData;
}

function oderAnimeDay(animeDay)
{
  let animeStock;


   testStock = animeDay.sort(function (a, b)
   {
    let stockA, stockB;

     stockA = a[3].split(":");
     stockB = b[3].split(":");

     if (stockA[0] == stockB[0])
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

function newAnime(test)
{
  let lien = document.createElement('a');
  let divAnime = document.createElement('div');
  let image = document.createElement('img');
  let heure = document.createElement('span');
  let divInfosclass = document.createElement('div');
  let episode = document.createElement('p');
  let title = document.createElement('p');

  let days = document.querySelector("#" + test[0]);
  let aHref = test[1];
  let imgSrc = test[2];
  let horraire = test[3];
  let pEpisode = test[4];
  let pTitle = test[5];
  let tags = test[6];
  let tagSplit, tagsTight = "", tagsNoSpecial;

  lien.href = aHref;
  tags = tags.split(",");

  if (tags[1] == null)
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
        if (tagSplit[y] != "")
        {
           tagsNoSpecial = removeSpecial(tagSplit[y]);
            tagsTight += tagsNoSpecial;
        }
      }
      tagsTight += " ";
    }
    lien.className = tagsTight;
  }



  divAnime.className  = "anime";

  if (test[0] != "sortie")
  {
    image.src = imgSrc;
  }

  heure.className = "time";
  heure.textContent = horraire;
  divInfosclass.className = "infosanime";
  episode.className = "episode";
  episode.textContent = pEpisode;
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

function isNumber (text) {
      reg = new RegExp('[0-9]+$');
      if(text) {
        return reg.test(text);
      }
      return false;
    }

function removeSpecial (text) {
  if(text) {
    var lower = text.toLowerCase();
    var upper = text.toUpperCase();
    var result = "";
    for(var i=0; i<lower.length; ++i) {
      if(isNumber(text[i]) || (lower[i] != upper[i]) || (lower[i].trim() === '') || (lower[i].trim() === '.')) {
        result += text[i];
      }
    }
    return result;
  }
  return '';
}

function token_recuperation()
{
  window.open("https://myanimelist.net/v1/oauth2/authorize?response_type=code&client_id=29fc8b678220461db9399d28c82624e1&code_challenge=NklUDX_CzS8qrMGWaDzgKs6VqrinuVFHa0xnpWPDy7_fggtM6kAEr4jnTwOgzK7nPYfE9n60rsY4fhDExWzr5bf7PEvMMmSXcT2hWkCstFGIJKoaimoq5GvAEQD8NZ8g&state=testApi1");
}

function patchMyanimelist(id_anime, nb_episode, total_episodes, score)
{
  let tokenJsonFile = fs.readFileSync('./Json/token.json');
  let tokenJson = JSON.parse(tokenJsonFile);
  let token = tokenJson.access_token;

  let request = new XMLHttpRequest();
  let url = "https://api.myanimelist.net/v2";
  let requestGetWathingList = "/anime/"+ id_anime + "/my_list_status";
  let requestBody;

  if (nb_episode  >= total_episodes)
    {
      requestBody = "num_watched_episodes="+ nb_episode + "&status=completed&tags=&score=" + score;
    }
  else
    {
      requestBody = "num_watched_episodes="+ nb_episode;
    }

  request.open('PATCH', url + requestGetWathingList);
  request.setRequestHeader("Authorization", "Bearer " + token)
  request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
  request.send(requestBody);

   console.log("anime update");
}
