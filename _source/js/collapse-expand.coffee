window.expandAll = ->
  $('details').attr 'open', 'open'
  true

window.collapseAll = ->
  $('details').removeAttr 'open'
  true
