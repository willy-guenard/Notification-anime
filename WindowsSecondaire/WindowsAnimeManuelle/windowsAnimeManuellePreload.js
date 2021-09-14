const { ipcRenderer } = require('electron');
const mariadb = require('mariadb'); // Data base
const pool = mariadb.createPool({host: 'localhost', user:'test', password: 'xxx', database: "notification_anime"}); // DB login

window.addEventListener('DOMContentLoaded', () => {

  ipcRenderer.on('Anime_Manuelle', (event, listAnimeManuelle, arrayAnimeAdkami) => {
      console.log(listAnimeManuelle);
      global(arrayAnimeAdkami);
      createFormAnimeManuelle(listAnimeManuelle);

      document.querySelectorAll("input[name='adkami_linked']").forEach((input) => {
          input.addEventListener('change', radioChecked);
      });
    });
})

function global(arrayAnimeAdkami)
{
  listAdkami = arrayAnimeAdkami;
}

function createFormAnimeManuelle(titleAnimeManuelle)
{
  const body = document.body;

  for (let i = 0; i < titleAnimeManuelle.length; i++)
  {
    let form = document.createElement('form');
    let titleMyanimelistH3 = document.createElement('h3');
    let divRadios = document.createElement('div');
    let piRadios = document.createElement('pi');
    let inputRadiosYes = document.createElement('input');
    let labelRadiosYes = document.createElement('label');
    let inputRadiosNo = document.createElement('input');
    let labelRadiosNo = document.createElement('label');
    let divDataAnime = document.createElement('div');

    let animeClear = titleAnimeManuelle[i];
    let numberOfSpace = animeClear;

    numberOfSpace.split(' ');

    for (let i = 0; i < animeClear.length; i++)
    {
      animeClear = animeClear.replace(' ', '');
    }

    form.id = "form_" +  animeClear;
    form.className = "formAnimeManuelle";

    titleMyanimelistH3.innerHTML = titleAnimeManuelle[i];

    divRadios.id = "div_animeManuelle_" + animeClear;
    divRadios.className = "divRadios";

    piRadios.innerHTML = "Dans Adkami: ";

    inputRadiosYes.id = "adkami_yes";
    inputRadiosYes.name = "adkami_linked";
    inputRadiosYes.type = "radio";
    inputRadiosYes.value = "Yes";

    labelRadiosYes.innerHTML = "Yes";

    inputRadiosNo.id = "adkami_no";
    inputRadiosNo.name = "adkami_linked";
    inputRadiosNo.type = "radio";
    inputRadiosNo.value = "No";

    labelRadiosNo.innerHTML = "No";

    divDataAnime.id="div_Data_" + animeClear;

    body.appendChild(form);
    form.appendChild(titleMyanimelistH3);
    form.appendChild(divRadios);
    divRadios.appendChild(piRadios)
    labelRadiosYes.appendChild(inputRadiosYes)
    divRadios.appendChild(labelRadiosYes)
    labelRadiosNo.appendChild(inputRadiosNo)
    divRadios.appendChild(labelRadiosNo)
    form.appendChild(divDataAnime);
  }
}

function clearDivAnime(formAnime)
{
  const body = document.body;

  formAnime.remove();
  if ( body.firstElementChild == null )
  {
    window.close();
  }
}

function getNumberOfWeek()
{
    const today = new Date();
    const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
    const pastDaysOfYear = (today - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

function InsertDbAnime(formAnime, titleMyanimelist)
{
  console.log(formAnime);

  if ( formAnime.adkami_linked == "Yes" ) //Anime_in_adkami
  {
  //   let findidAnime = listAdkami.find(element => element.Title  == formAnime.title);
  //   pool.getConnection()
  //     .then(conn => {
  //         conn.query("INSERT INTO adkami (Unique_title, Title_Adkami, Last_episodes_release, Picture_adkami, Voice, Day, Hours, Type_episodes, Present_this_week) VALUES ('" + findidAnime.Title + " " + findidAnime.Type_episode + " " + findidAnime.Voice + "','" + findidAnime.Title + "'," + findidAnime.Episode + ",'" + findidAnime.Picture_url + "','" + findidAnime.Voice + "','" + findidAnime.Day + "','" + findidAnime.Hours + "','" + findidAnime.Type_episode + "', 'Yes' ) ON DUPLICATE KEY UPDATE Last_episodes_release = VALUES(Last_episodes_release), Day = VALUES(Day), Hours = VALUES(Hours)");
  //
  //         selectAnime = conn.query("SELECT adkami.id_adkami from adkami where Title_Adkami = '" + findidAnime.Title + "' AND Voice = 'Vostfr';"); // pour la version ou les vf son pris en compte changer apres AND
  //         selectAnime.then(function(result)
  //         {
  //           conn.query("UPDATE anime SET id_adkami = " + result[0].id_adkami + " WHERE Title_anime = '" + titleMyanimelist + "' AND id_adkami is NULL;");
  //         })
  //   })
  //   .catch(err => { console.log("erreur: " + err); });
  }
  else if ( formAnime.adkami_linked == "No" )  //Anime_other
  {
    pool.getConnection()
      .then(conn => {
          conn.query("INSERT INTO other_anime (Title_anime_other, Last_episodes_release, Picture_anime_other, Voice, Day, Hours, Type_episode, Number_week) VALUES ('" + formAnime.title + " " + formAnime.type_episode + " " + formAnime.voice + "','" + findidAnime.title + "'," + findidAnime.lastEpisodeRelease + ",'" + findidAnime.url_Picture + "','" + findidAnime.voice + "','" + findidAnime.day + "','" + findidAnime.hours + "','" + findidAnime.type_episode + "', $(getNumberOfWeek) ) ON DUPLICATE KEY UPDATE Last_episodes_release = VALUES(Last_episodes_release), Day = VALUES(Day), Hours = VALUES(Hours)");

          selectAnime = conn.query("SELECT adkami.id_adkami from adkami where Title_Adkami = '" + findidAnime.Title + "' AND Voice = 'Vostfr';"); // pour la version ou les vf son pris en compte changer apres AND
          selectAnime.then(function(result)
          {
            conn.query("UPDATE anime SET id_other_anime = " + result[0].id_adkami + " WHERE Title_anime = '" + titleMyanimelist + "' AND id_other_anime is NULL;");
          })
    })
    .catch(err => { console.log("erreur: " + err); });
  }
}

function radioChecked(event)
{
  let animeSelect = event.path[2].id;
  animeSelect = animeSelect.split("_");
  animeSelect = animeSelect[2];
  let divDataAnime = document.querySelector("#div_Data_" + animeSelect);

  while (divDataAnime.firstChild) {divDataAnime.removeChild(divDataAnime.firstChild);}

  if ( event.target.id == "adkami_yes" )
  {
    let br = document.createElement('br');
    let butonValide = document.createElement('input');
    let labelTitle = document.createElement('label');
    let inputTitle = document.createElement('input');

    // labelTitle.id = "title_label";
    labelTitle.innerHTML = "Title Anime:";

    inputTitle.id = "title";
    inputTitle.name = "title";
    inputTitle.type = "text";
    inputTitle.placeholder = animeSelect;

    butonValide.id = "form_button";
    butonValide.type = "submit";
    butonValide.value = "valider";

    divDataAnime.appendChild(labelTitle);
    divDataAnime.appendChild(inputTitle);
    divDataAnime.appendChild(br);
    divDataAnime.appendChild(butonValide);
  }
  else
  {
    let br = document.createElement('br');

    let labelTitle = document.createElement('label');
    let inputTitle = document.createElement('input');

    let labelTypeEpisode = document.createElement('label');
    let inputTypeEpisode = document.createElement('input');

    let labelDay = document.createElement('label');
    let inputDay = document.createElement('input');

    let labelHours = document.createElement('label');
    let inputHours = document.createElement('input');

    let labelVoiceVostfr = document.createElement('label');
    let inputVoiceVostfr = document.createElement('input');

    let labelVoiceVf = document.createElement('label');
    let inputVoiceVf = document.createElement('input');

    let labelUrlPicture = document.createElement('label');
    let inputUrlPicture = document.createElement('input');

    let labelLastEpisodesRelease = document.createElement('label');
    let inputLastEpisodesRelease = document.createElement('input');

    let butonValide = document.createElement('input');

    labelTitle.innerHTML = "Title Anime:";

    inputTitle.id = "title";
    inputTitle.name = "title";
    inputTitle.type = "text";
    inputTitle.placeholder = animeSelect;

    labelTypeEpisode.innerHTML = "Type Episode:";

    inputTypeEpisode.id = "type_episode";
    inputTypeEpisode.name = "type_episode";
    inputTypeEpisode.type = "text";

    labelDay.innerHTML = "Days:";

    inputDay.id = "day";
    inputDay.name = "day";
    inputDay.type = "text";

    labelHours.innerHTML = "Hours:";

    inputHours.id = "hours";
    inputHours.name = "hours";
    inputHours.type = "time";

    labelVoiceVostfr.innerHTML = "Vostfr";

    inputVoiceVostfr.id = "voice_Vostfr";
    inputVoiceVostfr.name = "voice";
    inputVoiceVostfr.type = "radio";
    inputVoiceVostfr.value = "Vostfr";

    labelVoiceVf.innerHTML = "Vf";

    inputVoiceVf.id = "voice_Vf";
    inputVoiceVf.name = "voice";
    inputVoiceVf.type = "radio";
    inputVoiceVf.value = "Vf";

    labelUrlPicture.innerHTML = "Picture Url:";

    inputUrlPicture.id = "url_Picture";
    inputUrlPicture.name = "url_Picture";
    inputUrlPicture.type = "url";
    inputUrlPicture.placeholder = "https://www.google.com/imgres?imgurl=exemple";

    labelLastEpisodesRelease.innerHTML = "Last Episode Sortie";

    inputLastEpisodesRelease.id = "lastEpisodeRelease";
    inputLastEpisodesRelease.name = "lastEpisodeRelease";
    inputLastEpisodesRelease.type = "number";

    butonValide.id = "form_button";
    butonValide.type = "submit";
    butonValide.value = "valider";

    divDataAnime.appendChild(labelTitle);
    divDataAnime.appendChild(inputTitle);

    divDataAnime.appendChild(labelTypeEpisode);
    divDataAnime.appendChild(inputTypeEpisode);

    divDataAnime.appendChild(labelDay);
    divDataAnime.appendChild(inputDay);

    divDataAnime.appendChild(labelHours);
    divDataAnime.appendChild(inputHours);

    divDataAnime.appendChild(labelVoiceVostfr);
    labelVoiceVostfr.appendChild(inputVoiceVostfr);
    divDataAnime.appendChild(labelVoiceVf);
    labelVoiceVf.appendChild(inputVoiceVf);

    divDataAnime.appendChild(labelUrlPicture);
    divDataAnime.appendChild(inputUrlPicture);

    divDataAnime.appendChild(labelLastEpisodesRelease);
    divDataAnime.appendChild(inputLastEpisodesRelease);

    divDataAnime.appendChild(br);
    divDataAnime.appendChild(butonValide);
  }

  document.querySelector('form').addEventListener('submit', (e) => {
    let data = Object.fromEntries(new FormData(e.target).entries());
    InsertDbAnime(data, e.path[0].firstElementChild.innerText);
    clearDivAnime(e.path[0]);
  });
}
