(function() {
  $(document).ready(function() {
    $('img[alt]').not('[title]').not('[alt*="CC-BY"]').each(function(_i, img) {
      img = $(img);
      return img.attr('title', img.attr('alt'));
    });
    return true;
  });

}).call(this);
