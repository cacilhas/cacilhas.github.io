$(document).ready ->
  $('img[alt]')
    .not('[title]')
    .not('[alt*="CC-BY"]')
    .each (_i, img) ->
      img = $(img)
      img.attr 'title', img.attr 'alt'
  true
