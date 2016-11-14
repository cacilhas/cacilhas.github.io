"use strict"

const _ = require("underscore")
const fs = require("fs")
const { spawnSync } = require("child_process")
const co = require("co")
const moment = require("moment")
const pug = require("pug")
const stylus = require("stylus")

let globalContext = {}


const getCounterpart = name =>
  name.replace(/^.\/_source/, ".")
      .replace(/.pug$/, ".html")
      .replace(/.styl$/, ".css")


const processDirectory = co.wrap(function*({ directory, context, layout }) {
  // Clean up
  let counterpart = getCounterpart(directory)
  if (fs.existsSync(counterpart) && counterpart !== ".")
    spawnSync("rm", [ "-rf", counterpart ]) // TODO: perform it without system

  let check = _.last(counterpart.split("/"))
  if (!(check.startsWith(".") || check.startsWith("_")))
    fs.mkdirSync(counterpart)

  let files = fs.readdirSync(directory)

  if (fs.existsSync(`${directory}/_layout.pug`))
    layout = `${directory}/_layout.pug`

  // Scan directory
  for (let contextname of files.filter(e => !e.startsWith("."))) {
    let file = `${directory}/${contextname}`
    let stats = fs.lstatSync(file)

    if (stats.isSymbolicLink()) {
      // Do nothing to symlinks

    } else if (stats.isFile()) { // Deal with file
      if (contextname.startsWith("_")) {
        if (file.endsWith(".json"))
          _(context).assign(require(file))

      } else {
        if (contextname.indexOf(".") !== -1)
          contextname = contextname.slice(0, contextname.lastIndexOf("."))

        let current = context[contextname] = context[contextname] || {}
        processFile({ file, context: current, layout })
        .catch(console.error)
      }

    } else if (!contextname.startsWith("_")) { // Deal with directory
      let current = context[contextname] = context[contextname] || {}
      processDirectory({ directory: file, context: current, layout })
      .catch(console.error)
    }
  }
})


const processFile = co.wrap(function*({ file, context, layout }) {
  // Clean up
  let counterpart = getCounterpart(file)
  if (fs.existsSync(counterpart) && counterpart !== ".")
    fs.unlinkSync(counterpart)

  // TODO: pug / stylus
  if (file.endsWith(".pug"))
    processPugFile({ file, counterpart, context, layout })
    .catch(console.error)

  else if (file.endsWith(".styl"))
    processStylusFile({ file, counterpart })
    .catch(console.error)

  else
    copyFile({ from: file, to: counterpart })
    .catch(console.error)
})


const processPugFile = co.wrap(function*({ file, counterpart, context, layout }) {
  // TODO
  console.log(`${file} and ${layout} to ${counterpart}`)
})


const processStylusFile = co.wrap(function*({ file, counterpart }) {
  // TODO
  console.log(`${file} to ${counterpart}`)
})


const copyFile = co.wrap(function*({ from, to }) {
  spawnSync("cp", [ from, to ]) // TODO: perform it without system
})


processDirectory({ directory: "./_source", context: globalContext })
.catch(console.error)
