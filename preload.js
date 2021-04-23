// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
window.addEventListener('DOMContentLoaded', () => {

  const fs = require('fs');
  const butonRefresh = document.querySelector("#butonRefresh");

  butonRefresh.addEventListener('click', function(){refreshAnime()});

  function refreshAnime()
  {
    getAnimeCurrentlyWatching("cheark");
    getAnimeAgendaAdkami();
    anotherTitle();
  }

  function getAnimeCurrentlyWatching(user)
  {
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
    console.log("fichier MyAnimeList Json:  A Jour");
  }

  function refreshMyAnimeListJson(reply_watching_list)
  {
    let animelist = reply_watching_list['anime'];
    let json_watching_anime = '{\n\t\t"animeMyanimelist":[';
    let statusAnime;

    for (let i = 0; i < animelist.length; i++)
    {
      statusAnime = animelist[i].end_date;
      json_watching_anime += '\n\t\t{';
      json_watching_anime += '\n\t\t\t"Mal_id":' + animelist[i].mal_id;
      json_watching_anime += ',\n\t\t\t"Title":"' + animelist[i].title;
      json_watching_anime += '",\n\t\t\t"Watched_episodes":' + animelist[i].watched_episodes;
      json_watching_anime += ',\n\t\t\t"Total_episodes":' + animelist[i].total_episodes;

      if (statusAnime == null)
      {
        json_watching_anime += ',\n\t\t\t"status":"' + "Airing";
      }
      else
      {
        json_watching_anime += ',\n\t\t\t"status":"' + "Release";
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
        if(err) console.log('error', err);
      });
  }

  function getAnimeAgendaAdkami()
  {
    let url = "https://www.adkami.com/agenda";
    let request = new XMLHttpRequest();
    request.open('GET', url );

    request.responseType = 'text';
    request.send();
    request.onload = function()
    {
      var infosAnimeAdkami = request.response;
      refreshAgendaAdkamiJson(infosAnimeAdkami);
    }
    console.log("fichier adkami Json:  A Jour");
  }

  function refreshAgendaAdkamiJson(infosAnimeAdkami)
  {
    const daysList = ["null", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
    let splitPictureAnime = infosAnimeAdkami.split('<div class="agenda-list">');
    let agendaList = splitPictureAnime[1].split('<div class="col-12">');
    let agendaListSplitDay = agendaList[0].split('<h3>');
    let animesOfTheDay;
    let animeInfoList = "";
    let dayStockage = "";
    let animeInfosSplit, animePicture, animeHours, animeEpisodeStock, animeEpisode, animeTypeEpisode, animeVoice;
    let animeTitle, testAnimeTitle1, testAnimeTitle2, clearAnimeTitle;

    animeInfoList = '{\n\t\t"animeAdkami":[';
    //boucle des anime separer par les jour
    for (let y = 1; y < agendaListSplitDay.length; y++)
    {
      animesOfTheDay = agendaListSplitDay[y].split('<div class="col-12 episode');
      dayStockage = daysList[y];

      // boucle pour recuperais le contenu de chaque anime d'une journer
      for (var i = 1; i < animesOfTheDay.length; i++)
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

        testAnimeTitle1 = animeInfosSplit[5].slice(0 , 2);
        testAnimeTitle2 = animeInfosSplit[6].slice(0 , 2);

        if (testAnimeTitle1 == "<p")
        {
          clearAnimeTitle = animeInfosSplit[5].indexOf('">');
          clearAnimeTitle += 2;
          animeTitle = animeInfosSplit[5].slice(clearAnimeTitle, -4);
        }
        else if (testAnimeTitle2 == "<p")
        {
          clearAnimeTitle = animeInfosSplit[6].indexOf('">');
          clearAnimeTitle += 2;
          animeTitle = animeInfosSplit[6].slice(clearAnimeTitle, -4);
        }

        animeInfoList += '\n\t\t{';
        animeInfoList += '\n\t\t\t"Title":"' + animeTitle;
        animeInfoList += '",\n\t\t\t"Episode":' + animeEpisode;
        animeInfoList += ',\n\t\t\t"Type episode":"' + animeTypeEpisode;
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
      if(err) console.log('error', err);
    })
  }

  function anotherTitle()
  {
    console.log("pas encore fait");
  }

})
