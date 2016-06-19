$(document).ready(function() {
  $('h3[id]').each(function(i, e) {
    e = $(e)
    var id = e.attr('id')
    $('<a>')
    .attr('href', '#' + id)
    .attr('class', 'mg-hidden-link')
    .text(' ¶')
    .appendTo(e)
  })
})
