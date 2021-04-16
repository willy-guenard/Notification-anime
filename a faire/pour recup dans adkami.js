"col-12 episode"

let boite = document.getElementsByClassName('col-12 episode');

boite = Array.prototype.slice.call(boite, 0);

// recupe name des episode
boite.map(function (elem) { return elem.textContent; });

//lien image a cette id
innerHTML

//separer 1 anime
let boite2 = boite[1];

boite2.map(function (elem) { return elem.textContent; });

let boite3 = boite2.firstElementChild;














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
