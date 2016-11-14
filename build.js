"use strict"

const _ = require("underscore")
const fs = require("fs")
const path = require("path")
const { spawnSync } = require("child_process")
const co = require("co")
const moment = require("moment")
const pug = require("pug")
const stylus = require("stylus")

let globalContext = {}


function getCounterpart(name) {
  let counterpart = name.replace(/^.\/_source/, ".")

  if (counterpart.endsWith(".pug")) {
    counterpart = counterpart.replace(/\.pug$/, "")
    if (!/\.\w{3,4}/.test(counterpart))
      counterpart += ".html"
  } else if (counterpart.endsWith(".styl"))
    counterpart = counterpart.replace(/\.styl$/, ".css")

  return counterpart
}


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
  let useLayout = context[layout]
  useLayout = useLayout === undefined ? true : !!useLayout
  let template

  if (useLayout)
    template = fs.readFileSync(layout, "utf-8")
                 .replace(/^\s*!=\s*yield\s*$/, `include "${file}"`)

  else
    tempate = fs.readFileSync(file, "utf-8")

  context = _.clone(context)
  context.public = globalContext

  let renderer = pug.compile(template, { filename: file, globals: globalContext })

  fs.writeFileSync(counterpart, renderer(context), "utf-8")
})


const processStylusFile = co.wrap(function*({ file, counterpart }) {
  let template = fs.readFileSync(file, "utf-8")
  stylus(template)
  .set("filename", counterpart)
  .set("paths", [ path.dirname(file) ])
  .render((err, css) => {
    if (err)
      console.error(err)
    else
      fs.writeFileSync(counterpart, css, "utf-8")
  })
})


const copyFile = co.wrap(function*({ from, to }) {
  spawnSync("cp", [ from, to ]) // TODO: perform it without system
})


processDirectory({ directory: "./_source", context: globalContext })
.catch(console.error)
