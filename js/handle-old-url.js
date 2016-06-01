"use strict"

function handleOldURL() {
  var oldPath = window.location.search
  if (oldPath.indexOf("?t=/") == 0) {
    var url = decodeURIComponent(oldPath.substr(3)) + ".html"
    window.location = url
  }
}

handleOldURL()
