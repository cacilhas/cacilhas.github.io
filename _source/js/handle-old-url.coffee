oldPath = window.location.search
if (oldPath.indexOf '?t=/') == 0
  window.location = "#{decodeURIComponent oldPath.substr 3}.html"
