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

function showFiltre(tags)
{
  let classTags = document.getElementsByClassName(tags);

   document.styleSheets[0].cssRules[2].style.display = "none";

  for (let i = 0; i < classTags.length; i++)
  {
      classTags[i].style.display = "block";
  }
}
