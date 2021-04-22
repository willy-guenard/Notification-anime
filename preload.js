// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
window.addEventListener('DOMContentLoaded', () => {

  const fs = require('fs');
  const test_button = document.querySelector("#test_button");
  const test_picture = document.querySelector("#test_picture");
  const animela = document.querySelector('#animela');


  test_button.addEventListener('click', function(){getAnimeCurrentlyWatching("cheark")});
  test_picture.addEventListener('click', function(){getAnimePicture(2)});

  //function qui interagie avec l'api de myanimelist pour recuperais les anime dans la list watching d'un user
  function getAnimeCurrentlyWatching(user)
  {
    let url = "https://api.jikan.moe/v3";
    let request = new XMLHttpRequest();
    let request_get_wathing_list = "/user/"+ user + "/animelist/watching/";

    request.open('GET', url + request_get_wathing_list);
    request.responseType = 'json';
    request.send();

    request.onload = function()
    {
      let reply_watching_list = request.response;
      refreshJsonAnime(reply_watching_list);
      // showAnime(reply_watching_list);
    }
  }

  // actuelliste affichage html
  function showAnime(reply_watching_list)
  {
    let animelist = reply_watching_list['anime'];
    // let list_name_anime = "";
    for (let i = 0; i < animelist.length; i++)
    {
      console.log(animelist[i].title);
      console.log(animelist[i].watched_episodes);
      console.log(animelist[i].total_episodes);
      console.log(animelist[i].image_url);
      console.log(animelist[i].tags);
    }
    // animela.textContent = list_name_anime;
  }

  // refresh le json
  function refreshJsonAnime(reply_watching_list)
  {
    let animelist = reply_watching_list['anime'];
    let json_watching_anime = '{\n\t\t"anime":[';
    for (let i = 0; i < animelist.length; i++)
    {
      json_watching_anime += '\n\t\t{';
      json_watching_anime += '\n\t\t\t"mal_id":' + animelist[i].mal_id;
      json_watching_anime += ',\n\t\t\t"title":"' + animelist[i].title;
      json_watching_anime += '",\n\t\t\t"image_url":"' + animelist[i].image_url;
      json_watching_anime += '",\n\t\t\t"watched_episodes":' + animelist[i].watched_episodes;
      json_watching_anime += ',\n\t\t\t"total_episodes":' + animelist[i].total_episodes;
      json_watching_anime += ',\n\t\t\t"tags":"' + animelist[i].tags;
      json_watching_anime += '",\n\t\t\t"last_episodes_release":' + 0;
      json_watching_anime += ',\n\t\t\t"day_episodes_release":"'  + 'saturday';
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

  function getAnimePicture(nb)
  {
    let url = "https://www.adkami.com/agenda";
    let request = new XMLHttpRequest();
    request.open('GET', url );

    request.responseType = 'text';
    request.send();
    request.onload = function()
    {
      const daysList = ["null", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
      let infosAnimeAdkami = request.response;
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
  }

})
