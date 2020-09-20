(function() {
  $(document).ready(function() {
    return $('h3[id]').each(function(i, e) {
      var id;
      e = $(e);
      id = e.attr('id');
      return $('<a>').attr('href', `#${id}`).attr('class', 'mg-hidden-link').text(' ¶').appendTo(e);
    });
  });

}).call(this);
