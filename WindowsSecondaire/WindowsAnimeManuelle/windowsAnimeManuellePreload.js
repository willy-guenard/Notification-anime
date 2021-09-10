
const { ipcRenderer } = require("electron");

window.addEventListener('DOMContentLoaded', () => {

  ipcRenderer.on('Anime_Manuelle', (event, listAnimeManuelle) => {
    console.log(listAnimeManuelle);
    createFormAnimeManuelle(listAnimeManuelle);

    document.querySelectorAll("input[name='adkami_linked']").forEach((input) => {
        input.addEventListener('change', radioChecked);
    });

    document.querySelector('form').addEventListener('submit', (e) => {
      let data = Object.fromEntries(new FormData(e.target).entries());
      console.log(data)
      clearDivAnime("anime");
    });
  });

})

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

    form.onsubmit = "return false";
    form.id = "form_" +  animeClear;
    form.className = "formAnimeManuelle";

    titleMyanimelistH3.innerHTML = titleAnimeManuelle[i];

    divRadios.id = "div_animeManuelle_" + animeClear;
    divRadios.className = "divRadios";

    piRadios.innerHTML = "Dans Adkami:";

    inputRadiosYes.id = "adkami_yes";
    inputRadiosYes.name = "adkami_linked";
    inputRadiosYes.type = "radio";
    inputRadiosYes.value = "Yes";

    labelRadiosYes.for = "adkami_yes";
    labelRadiosYes.innerHTML = "Yes";

    inputRadiosNo.id = "adkami_no";
    inputRadiosNo.name = "adkami_linked";
    inputRadiosNo.type = "radio";
    inputRadiosNo.value = "No";

    labelRadiosNo.for = "adkami_no";
    labelRadiosNo.innerHTML = "No";

    divDataAnime.id="div_Data_" + animeClear;

    body.appendChild(form);
    form.appendChild(titleMyanimelistH3);
    form.appendChild(divRadios);
    divRadios.appendChild(piRadios)
    divRadios.appendChild(inputRadiosYes)
    divRadios.appendChild(labelRadiosYes)
    divRadios.appendChild(inputRadiosNo)
    divRadios.appendChild(labelRadiosNo)
    form.appendChild(divDataAnime);
  }

}

function clearDivAnime(tileAnime)
{
  let divDataAnime = document.querySelector("#animeManuelle");
  divDataAnime.remove();
}

function radioChecked(event)
{
    let animeSelect = event.path[1].id;
    animeSelect = animeSelect.split("_");
    animeSelect = animeSelect[2]
    let divDataAnime = document.querySelector("#div_Data_" + animeSelect);

    if ( event.target.id == "adkami_yes" )
    {
      let br = document.createElement('br');
      let butonValide = document.createElement('input');
      let labelTitle = document.createElement('label');
      let inputTitle = document.createElement('input');

      labelTitle.id = "title_" + animeSelect + "_label";
      labelTitle.for = "title_" + animeSelect + "_input";
      labelTitle.innerHTML = "Title Anime:";

      inputTitle.id = "title_" + animeSelect + "_input";
      inputTitle.name = "title_" + animeSelect + "_input";
      inputTitle.type = "text";
      inputTitle.placeholder = "Steins;gate";

      butonValide.id = animeSelect + "_name_button";
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


      labelTitle.for = "title_" + animeSelect + "_input";
      labelTitle.innerHTML = "Title Anime:";

      inputTitle.id = "title_" + animeSelect + "_input";
      inputTitle.name = "title_" + animeSelect + "_input";
      inputTitle.type = "text";
      inputTitle.placeholder = "Steins;gate";

      labelDay.for = "day_" + animeSelect + "_input";
      labelDay.innerHTML = "Days:";

      inputDay.id = "day_" + animeSelect + "_input";
      inputDay.name = "day_" + animeSelect + "_input";
      inputDay.type = "text";

      labelHours.for = "hours_" + animeSelect + "_input";
      labelHours.innerHTML = "Hours:";

      inputHours.id = "hours_" + animeSelect + "_input";
      inputHours.name = "hours_" + animeSelect + "_input";
      inputHours.type = "time";

      labelVoiceVostfr.for = "voice_" + animeSelect + "_input_vostfr";
      labelVoiceVostfr.innerHTML = "Vostfr";

      inputVoiceVostfr.id = "voice_" + animeSelect + "_input_vostfr";
      inputVoiceVostfr.name = "voice_" + animeSelect + "_input_vostfr";
      inputVoiceVostfr.type = "radio";
      inputVoiceVostfr.value = "Vostfr";

      labelVoiceVf.for = "voice_" + animeSelect + "_input_Vf";
      labelVoiceVf.innerHTML = "Vf";

      inputVoiceVf.id = "voice_" + animeSelect + "_input_Vf";
      inputVoiceVf.name = "voice_" + animeSelect + "_input_Vf";
      inputVoiceVf.type = "radio";
      inputVoiceVf.value = "Vf";

      labelUrlPicture.for = "url_" + animeSelect + "_input";
      labelUrlPicture.innerHTML = "Picture Url:";

      inputUrlPicture.id = "url_" + animeSelect + "_input";
      inputUrlPicture.name = "url_" + animeSelect + "_input";
      inputUrlPicture.type = "url";
      inputUrlPicture.placeholder = "https://www.google.com/imgres?imgurl=exemple";

      labelLastEpisodesRelease.for = "lastEpisodeRelease_" + animeSelect + "_input";
      labelLastEpisodesRelease.innerHTML = "Last Episode Sortie";

      inputLastEpisodesRelease.id = "lastEpisodeRelease_" + animeSelect + "_input";
      inputLastEpisodesRelease.name = "lastEpisodeRelease_" + animeSelect + "_input";
      inputLastEpisodesRelease.type = "number";

      butonValide.id = animeSelect + "_name_button";
      butonValide.type = "submit";
      butonValide.value = "valider";

      divDataAnime.appendChild(labelTitle);
      divDataAnime.appendChild(inputTitle);

      divDataAnime.appendChild(labelDay);
      divDataAnime.appendChild(inputDay);

      divDataAnime.appendChild(labelHours);
      divDataAnime.appendChild(inputHours);

      divDataAnime.appendChild(labelVoiceVostfr);
      divDataAnime.appendChild(inputVoiceVostfr);
      divDataAnime.appendChild(labelVoiceVf);
      divDataAnime.appendChild(inputVoiceVf);

      divDataAnime.appendChild(labelUrlPicture);
      divDataAnime.appendChild(inputUrlPicture);

      divDataAnime.appendChild(labelLastEpisodesRelease);
      divDataAnime.appendChild(inputLastEpisodesRelease);

      divDataAnime.appendChild(br);
      divDataAnime.appendChild(butonValide);

    }
}
