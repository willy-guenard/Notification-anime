const { ipcRenderer } = require('electron');
const mariadb = require('mariadb'); // Data base
const pool = mariadb.createPool({host: 'localhost', user:'test', password: 'xxx', database: "notification_anime"}); // DB login

window.addEventListener('DOMContentLoaded', () => {

  ipcRenderer.on('Anime_Manuelle', (event, listAnimeManuelle, arrayAnimeAdkami, arrayAnimeAdkamiLastWeek) => {
      global(arrayAnimeAdkami, arrayAnimeAdkamiLastWeek);
      createFormAnimeManuelle(listAnimeManuelle);

      document.querySelectorAll("input[name='adkami_linked']").forEach((input) => {
          input.addEventListener('change', radioChecked);


      });
    });
})

function global(arrayAnimeAdkami, arrayAnimeAdkamiLastWeek)
{
  listAdkami = arrayAnimeAdkami;
  listAdkamiLastWeek = arrayAnimeAdkamiLastWeek;
}

function upperCaseFirst(title)
{
   let firstLetterCaps = title[0].toUpperCase();
   return title.replace(title[0], firstLetterCaps);
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
    let labelRadiosYes = document.createElement('label');
    let inputRadiosYes = document.createElement('input');
    let labelRadiosNo = document.createElement('label');
    let inputRadiosNo = document.createElement('input');
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

    let boite = upperCaseFirst(titleAnimeManuelle[i]);

    titleMyanimelistH3.innerHTML = boite;

    divRadios.id = "div_animeManuelle_" + animeClear;
    divRadios.className = "div_radio_adkami";

    piRadios.id = "pi_adkmi";
    piRadios.innerHTML = "Dans Adkami: ";

    labelRadiosYes.className = "label_radio_adkami_yes";
    labelRadiosYes. innerHTML = "Yes";

    inputRadiosYes.id = "adkami_yes";
    inputRadiosYes.name = "adkami_linked";
    inputRadiosYes.type = "radio";
    inputRadiosYes.value = "Yes";

    labelRadiosNo.className = "label_radio_adkami_no";
    labelRadiosNo.innerHTML = "No";

    inputRadiosNo.id = "adkami_no";
    inputRadiosNo.name = "adkami_linked";
    inputRadiosNo.type = "radio";
    inputRadiosNo.value = "No";

    divDataAnime.id = "div_Data_" + animeClear;
    divDataAnime.className = "div_data";

    body.appendChild(form);
    form.appendChild(titleMyanimelistH3);
    form.appendChild(divRadios);
    divRadios.appendChild(piRadios)
    labelRadiosYes.appendChild(inputRadiosYes)
    divRadios.appendChild(labelRadiosYes)
    labelRadiosNo.appendChild(inputRadiosNo)
    divRadios.appendChild(labelRadiosNo)
    form.appendChild(divDataAnime);

      form.addEventListener('submit', (event) => {
      let data = Object.fromEntries(new FormData(event.target).entries());
      let etatChamp = checkChampVide(data);
      // let test = document.querySelector('event.path[0].id');
      event.preventDefault();

      if ( etatChamp != "champVide" )
      {
        InsertDbAnime(data, event.path[0].firstElementChild.innerText);
        clearDivAnime(event.path[0]);
      }

        alert(etatChamp);

    });
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
  if ( formAnime.adkami_linked == "Yes" ) //Anime_in_adkami
  {
    pool.getConnection()
      .then(conn => {
          conn.query("INSERT INTO adkami (Unique_title, Title_Adkami, Last_episodes_release, Picture_adkami, Voice, Day, Hours, Type_episodes, Present_this_week) VALUES ('" + formAnime.Title + " " + formAnime.Type_episode + " " + formAnime.Voice + "','" + formAnime.Title + "'," + formAnime.Episode + ",'" + formAnime.Picture_url + "','" + formAnime.Voice + "','" + formAnime.Day + "','" + formAnime.Hours + "','" + formAnime.Type_episode + "', 'Yes' ) ON DUPLICATE KEY UPDATE Last_episodes_release = VALUES(Last_episodes_release), Day = VALUES(Day), Hours = VALUES(Hours)");

          selectAnime = conn.query("SELECT adkami.id_adkami from adkami where Title_Adkami = '" + formAnime.Title + "' AND Voice = 'Vostfr';"); // pour la version ou les vf son pris en compte changer apres AND
          selectAnime.then(function(result)
          {
            conn.query("UPDATE anime SET id_adkami = " + result[0].id_adkami + " WHERE Title_anime = '" + titleMyanimelist + "' AND id_adkami is NULL;");
          })
    })
    .catch(err => { console.log("erreur: " + err); });
  }
  else if ( formAnime.adkami_linked == "No" )  //Anime_other
  {
    pool.getConnection()
      .then(conn => {
          conn.query("INSERT INTO other_anime (Title_anime_other, Last_episodes_release, Picture_anime_other, Voice, Day, Hours, Type_episode, Number_week) VALUES ('" + formAnime.title + " " + formAnime.type_episode + " " + formAnime.voice + "','" + formAnime.title + "'," + formAnime.lastEpisodeRelease + ",'" + formAnime.url_Picture + "','" + formAnime.voice + "','" + formAnime.day + "','" + formAnime.hours + "','" + formAnime.type_episode + "',"+ getNumberOfWeek + ") ON DUPLICATE KEY UPDATE Last_episodes_release = VALUES(Last_episodes_release), Day = VALUES(Day), Hours = VALUES(Hours)");

          selectAnime = conn.query("SELECT adkami.id_adkami from adkami where Title_Adkami = '" + formAnime.title + "' AND Voice = 'Vostfr';"); // pour la version ou les vf son pris en compte changer apres AND
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
    let labelTitle = document.createElement('label');
    let inputTitle = document.createElement('input');
    let butonValide = document.createElement('input');

    labelTitle.id = "title_label";
    labelTitle.className = "label_data";
    labelTitle.innerHTML = "Anime Title:";

    inputTitle.id = "title";
    inputTitle.name = "title";
    inputTitle.type = "text";
    inputTitle.placeholder = "Steins;gate";

    butonValide.id = "form_button";
    butonValide.type = "submit";
    butonValide.value = "valider";

    divDataAnime.appendChild(labelTitle);
    divDataAnime.appendChild(inputTitle);
    divDataAnime.appendChild(butonValide);
  }
  else
  {
    let labelTitle = document.createElement('label');
    let inputTitle = document.createElement('input');

    let piTypeEpisode = document.createElement('pi');
    let divTypeEpisode = document.createElement('div');
    let labelTypeEpisodeEpisode = document.createElement('label');
    let inputTypeEpisodeEpisode = document.createElement('input');
    let labelTypeEpisodeOav = document.createElement('label');
    let inputTypeEpisodeOav = document.createElement('input');
    let labelTypeEpisodeMovie = document.createElement('label');
    let inputTypeEpisodeMovie = document.createElement('input');

    let labelDay = document.createElement('label');
    let inputDay = document.createElement('input');

    let labelHours = document.createElement('label');
    let inputHours = document.createElement('input');

    let piVoiceVostfr = document.createElement('pi');
    let divVoiceVostfr = document.createElement('div');
    let labelVoiceVostfr = document.createElement('label');
    let inputVoiceVostfr = document.createElement('input');
    let labelVoiceVf = document.createElement('label');
    let inputVoiceVf = document.createElement('input');

    let labelUrlPicture = document.createElement('label');
    let inputUrlPicture = document.createElement('input');

    let labelLastEpisodesRelease = document.createElement('label');
    let inputLastEpisodesRelease = document.createElement('input');

    let butonValide = document.createElement('input');

    labelTitle.className = "label_data";
    labelTitle.innerHTML = "Anime Title:";

    inputTitle.id = "title";
    inputTitle.name = "title";
    inputTitle.type = "text";
    inputTitle.placeholder = "Steins;gate";

    piTypeEpisode.className = "label_data";
    piTypeEpisode.innerHTML = "Episode Type:";

    divTypeEpisode.className = "div_type_epis";

    labelTypeEpisodeEpisode.className = "type_episode_episode";
    labelTypeEpisodeEpisode.innerHTML = "Episode";

    inputTypeEpisodeEpisode.id = "type_epis_episode";
    inputTypeEpisodeEpisode.name = "type_epis";
    inputTypeEpisodeEpisode.type = "radio";
    inputTypeEpisodeEpisode.value = "Episode";

    labelTypeEpisodeOav.className = "type_episode_oav";
    labelTypeEpisodeOav.innerHTML = "Oav";

    inputTypeEpisodeOav.id = "type_epis_oav";
    inputTypeEpisodeOav.name = "type_epis";
    inputTypeEpisodeOav.type = "radio";
    inputTypeEpisodeOav.value = "Oav";

    labelTypeEpisodeMovie.className = "type_episode_movie";
    labelTypeEpisodeMovie.innerHTML = "Movie";

    inputTypeEpisodeMovie.id = "type_epis_movie";
    inputTypeEpisodeMovie.name = "type_epis";
    inputTypeEpisodeMovie.type = "radio";
    inputTypeEpisodeMovie.value = "Movie";

    labelDay.className = "label_data";
    labelDay.innerHTML = "Release Day:";

    inputDay.id = "day";
    inputDay.name = "day";
    inputDay.list = "Days";
    inputDay.type = "text";

    labelHours.className = "label_data";
    labelHours.innerHTML = "Release Time:";

    inputHours.id = "hours";
    inputHours.name = "hours";
    inputHours.type = "time";

    piVoiceVostfr.className = "label_data";
    piVoiceVostfr.innerHTML = "Voice:";

    divVoiceVostfr.className = "div_Voice";

    labelVoiceVostfr.className = "voice_vostfr";
    labelVoiceVostfr.innerHTML = "Vostfr";

    inputVoiceVostfr.id = "voice_Vostfr";
    inputVoiceVostfr.name = "voice";
    inputVoiceVostfr.type = "radio";
    inputVoiceVostfr.value = "Vostfr";

    labelVoiceVf.className = "voice_vf";
    labelVoiceVf.innerHTML = "Vf";

    inputVoiceVf.id = "voice_Vf";
    inputVoiceVf.name = "voice";
    inputVoiceVf.type = "radio";
    inputVoiceVf.value = "Vf";

    labelUrlPicture.className = "label_data";
    labelUrlPicture.innerHTML = "Picture Url:";

    inputUrlPicture.id = "url_Picture";
    inputUrlPicture.name = "url_Picture";
    inputUrlPicture.type = "url";
    inputUrlPicture.placeholder = "https://www.google.com/imgres?imgurl=exemple";

    labelLastEpisodesRelease.className = "label_data";
    labelLastEpisodesRelease.innerHTML = "Last Episode Released";

    inputLastEpisodesRelease.id = "lastEpisodeRelease";
    inputLastEpisodesRelease.name = "lastEpisodeRelease";
    inputLastEpisodesRelease.type = "number";

    butonValide.id = "form_button";
    butonValide.type = "submit";
    butonValide.value = "valider";

    divDataAnime.appendChild(labelTitle);
    divDataAnime.appendChild(inputTitle);

    divDataAnime.appendChild(piTypeEpisode);
    divDataAnime.appendChild(divTypeEpisode);

    divTypeEpisode.appendChild(labelTypeEpisodeEpisode);
    labelTypeEpisodeEpisode.appendChild(inputTypeEpisodeEpisode);
    divTypeEpisode.appendChild(labelTypeEpisodeOav);
    labelTypeEpisodeOav.appendChild(inputTypeEpisodeOav);
    divTypeEpisode.appendChild(labelTypeEpisodeMovie);
    labelTypeEpisodeMovie.appendChild(inputTypeEpisodeMovie);

    divDataAnime.appendChild(labelDay);
    divDataAnime.appendChild(inputDay);

    divDataAnime.appendChild(labelHours);
    divDataAnime.appendChild(inputHours);

    divDataAnime.appendChild(piVoiceVostfr);
    divDataAnime.appendChild(divVoiceVostfr);

    divVoiceVostfr.appendChild(labelVoiceVostfr);
    labelVoiceVostfr.appendChild(inputVoiceVostfr);
    divVoiceVostfr.appendChild(labelVoiceVf);
    labelVoiceVf.appendChild(inputVoiceVf);

    divDataAnime.appendChild(labelUrlPicture);
    divDataAnime.appendChild(inputUrlPicture);

    divDataAnime.appendChild(labelLastEpisodesRelease);
    divDataAnime.appendChild(inputLastEpisodesRelease);

    divDataAnime.appendChild(butonValide);
  }

}

function checkChampVide(data)
{
  if ( data.adkami_linked == "Yes" )
  {
    if ( data.title == "" ) { return "champVide"; } else { return data.title; }
  }
  else if ( data.adkami_linked == "No" )
  {
    if (data.title != "" && data.adkami_linked != "" && data.day != "" && data.hours != "" && data.lastEpisodeRelease != "" && data.type_episode != "" && data.url_Picture != "" )
    {
      return data.title;
    }
    else
    {
      return "champVide";
    }
  }
}
