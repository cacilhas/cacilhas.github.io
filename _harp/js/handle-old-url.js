function handleOldURL() {
  var curPath = window.location.pathname;
  if (curPath.index("/?t=") == 0) {
    var url = decodeURIComponent(curPath.substr(4)) + ".html";
    window.location.pathname = url;
  }
}

handleOldURL();
