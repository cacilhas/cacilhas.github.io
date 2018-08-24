$(document).ready ->
  $('h3[id]').each (i, e) ->
    e = $(e)
    id = e.attr 'id'
    $('<a>')
      .attr('href', "##{id}")
      .attr('class', 'mg-hidden-link')
      .text(' ¶')
      .appendTo e
