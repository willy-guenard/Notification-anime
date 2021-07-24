"col-12 episode"

  let boite = document.getElementsByClassName('col-12 episode');

  boite = Array.prototype.slice.call(boite, 0);

  // recupe name des episode
  boite.map(function (elem) { return elem.textContent; });

  //separer 1 anime
  let boite2 = boite[1];

  let boite3 = boite2.firstElementChild.currentSrc;


  let elem = 15;
  boite.map(function (elem)
      {
        let boite1 = elem.textContent;
        let boite2 = boite1[elem];
        boite2.firstElementChild.currentSrc;
      });


chercher a recuperais l'img par rapport au name

Titre 			class title
episode			class epis
type_episode		class epis
Voice			class epis
picture_url 		<img
heure			class date_hour
day			je les deja


let boite = document.getElementsByClassName('colone');
let lundi = boite[0]
let detectiveconan = lundi.children[1]


innerText

detectiveconan.childNodes

que le premier de lundi a script

detectiveconan.childNodes[1].children[1].currentSrc
detectiveconan.childNodes[1].children[2].innerText
detectiveconan.childNodes[1].children[3].children[0].innerText
detectiveconan.childNodes[1].children[3].children[1].innerText



document.getElementsByClassName('colone')[0].children[1].children[0].children


///////////////////////////////////////////////////////////////////////////////
document.getElementsById("yt-comments-paginator").click();

setInterval(function ()
{
  let elem = document.getElementsById("yt-comments-paginator");
  if (elem.classList.contains("activated") || elem.classList.contains("hid"))
  {
    return;
  }
  elem.click();
},100);



let showMoreArray = document.getElementsByClassName('show-more');

showMoreArray = Array.prototype.slice.call(showMoreArray, 0);


showMoreArray.forEach(function (elem) { elem.click();});


let allcoment = document.getElementsByClassName('comment-text-content');

allcoment = Array.prototype.slice.call(allcoment, 0);

function getClass(className)
{
  return Array.prototype.slice.call(document.getElementsByClassName(className);, 0);
}



let commentText = getClass('comment-text-content');

commentText.map(function (elem) { return elem.textContent; });

Json.stringify(commentText, null, 2);

let testComment = commentText[0];

testComment.parentNode

testComment.parentNode.parentNode.firstElementChild

testComment.parentNode.parentNode.firstElementChild.firstElementChild

testComment.parentNode.parentNode.firstElementChild.firstElementChild.textContent

commentText = commentText.map(function (elem) { return { elem.textContent, user: testComment.parentNode.parentNode.firstElementChild.firstElementChild.textContent};});

Json.stringify(commentText, null, ' ');
