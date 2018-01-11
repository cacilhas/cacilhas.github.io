function expandAll() {
  $('details').attr('open', 'open');
  return true;
}

function collapseAll() {
  $('details').removeAttr('open');
  return true;
}
