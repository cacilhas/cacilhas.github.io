(function() {
  window.expandAll = function() {
    $('details').attr('open', 'open');
    return true;
  };

  window.collapseAll = function() {
    $('details').removeAttr('open');
    return true;
  };

}).call(this);
