var elements = document.getElementsByTagName("details");

function expandAll() {
  Array.from(elements).forEach(function(e, idx) {
    e.open = true;
  })
  return true;
}

function collapseAll() {
  Array.from(elements).forEach(function(e, idx) {
    e.open = false;
  })
  return true;
}
