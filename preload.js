// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
window.addEventListener('DOMContentLoaded', () => {

  const bouton_test = document.querySelector("#bouton_test");
  const animeplace = document.querySelector('#animela');

  bouton_test.addEventListener('click', function(){animeRegarder()});

  function animeRegarder()
  {
    let url = "https://api.jikan.moe/v3/user/cheark/animelist/watching/";
    let request = new XMLHttpRequest();
    request.open('GET', url);
    request.responseType = 'json';
    request.send();

    request.onload = function()
    {
      let anime = request.response;
      showAnime(anime);
    }
  }

  function showAnime(anime)
  {
    let animelist = anime['anime'];
    let list_name_anime = "";
    for (let i = 0; i < animelist.length; i++)
    {

      list_name_anime = list_name_anime + animelist[i].title + "_";
      list_name_anime = list_name_anime + animelist[i].watched_episodes + "/";
      list_name_anime = list_name_anime + animelist[i].total_episodes + "---------------------------------------------------------";
      console.log(animelist[i].title);
      console.log(animelist[i].watched_episodes);
      console.log(animelist[i].total_episodes);
      console.log(animelist[i].image_url);

    }

    animeplace.textContent = list_name_anime;
  }

})
