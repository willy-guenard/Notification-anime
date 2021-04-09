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
    let list_anime_watching = "\n";
    for (let i = 0; i < animelist.length; i++) {

      list_anime_watching = list_anime_watching + "\n" + animelist[i].title;
    }

    animeplace.textContent = list_anime_watching;
  }
})
