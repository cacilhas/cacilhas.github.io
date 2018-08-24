$(document).ready(function () {
  $('img[alt]')
    .not('[title]')
    .not('[alt*="CC-BY"]')
    .each(function (_, img) {
      img = $(img);
      img.attr('title', img.attr('alt'));
    });
});
