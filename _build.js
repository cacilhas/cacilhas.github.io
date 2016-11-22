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


const copyFile = co.wrap(function*({ from, to }) {
  spawnSync("cp", [ from, to ]) // TODO: perform it without system
})


const loadContext = co.wrap(function*({ dirname, context }) {
  let files = fs.readdirSync(dirname)
                .filter(e => !e.startsWith("."))
  let children = []

  for (let cname of files) {
    let file = `${dirname}/${cname}`
    let stats = fs.lstatSync(file)

    if (stats.isFile()) {
      if (cname.endsWith(".json"))
        _(context).assign(require(file))

      else if (cname.endsWith(".pug")) {
        cname = cname.slice(0, cname.indexOf("."))
        context[cname] = context[cname] === undefined
                       ? {} : context[cname]

        // Add current
        context[cname].current = {
          source: cname,
          path: `${dirname}/${cname}`.split("/")
        }
      }

    } else if (!stats.isSymbolicLink() && stats.isDirectory()) {
      let current = context[cname] = context[cname] || {}
      children.push(loadContext({ dirname: file, context: current })
                    .catch(console.error))
    }
  }

  yield children
})


const populateBlogs = co.wrap(function*(context) {
  yield [ populateBlog(context.kodumaro), populateBlog(context.montegasppa) ]
})


const populateBlog = co.wrap(function(context) {
  let months = []

  for (let [ yearSlug, yearDir ] of _.pairs(context))
    if (/^\d{4}$/.test(yearSlug))
      for (let [ monthSlug, monthDir ] of _.pairs(yearDir))
        if (/^\d\d$/.test(monthSlug)) {
          let index = parseInt(monthSlug) - 1
          months.push({
            slug: `${context.blog.url}${yearSlug}/${monthSlug}`,
            title: `${globalContext.monthSet[index]} de ${yearSlug}`,
            dir: monthDir,
            date: new Date(`${yearSlug}-${monthSlug}-01`)
          })
        }

  months.sort((a, b) => b.date - a.date)
  context.months = months
})


const processDirectory = co.wrap(function*({ dirname, context, layout }) {
  // Clean up
  let counterpart = getCounterpart(dirname)
  if (fs.existsSync(counterpart) && counterpart !== ".")
    spawnSync("rm", [ "-rf", counterpart ]) // TODO: perform it without system

  let check = _.last(counterpart.split("/"))
  if (/^[\._][^\._].*/.test(check))
    return

  if (counterpart !== ".")
    fs.mkdirSync(counterpart)
  let files = fs.readdirSync(dirname)
                .filter(e => !e.startsWith("."))

  // Update layout
  if (fs.existsSync(`${dirname}/_layout.pug`))
    layout = `${dirname}/_layout.pug`

  // Scan dirname
  for (let cname of files) {
    let file = `${dirname}/${cname}`
    let stats = fs.lstatSync(file)

    if (!(cname.startsWith("_") || stats.isSymbolicLink())) {
      if (stats.isFile()) {
        if (cname.indexOf(".") !== -1)
          cname = cname.slice(0, cname.indexOf("."))
        processFile({ file, context: context[cname], layout })
        .catch(console.error)

      } else {
        processDirectory({ dirname: file, context: context[cname], layout })
        .catch(console.error)
      }
    }
  }
})


const processFile = co.wrap(function*({ file, context, layout }) {
  // Clean up
  let counterpart = getCounterpart(file)

  if (fs.existsSync(counterpart) && counterpart !== ".")
    fs.unlinkSync(counterpart)

  if (file.endsWith(".pug")) {
    if (!context)
      throw Error(`no context for ${file}`)
    yield processPugFile({ file, counterpart, context, layout })

  } else if (file.endsWith(".styl"))
    yield processStylusFile({ file, counterpart })

  else
    yield copyFile({ from: file, to: counterpart })
})


const processPugFile = co.wrap(function*({ file, counterpart, context, layout }) {
  let useLayout = context.layout
  useLayout = useLayout === undefined ? true : !!useLayout
  let template = fs.readFileSync(file, "utf-8")

  if (useLayout) {
    let fileFile = file.split("/")
    let layoutFile = layout.split("/")

    while (_.first(fileFile) === _.first(layoutFile)) {
      fileFile = fileFile.slice(1)
      layoutFile = layoutFile.slice(1)
    }

    let layoutContent = fs.readFileSync(layout, "utf-8")
    let pardirs = fileFile.map(() => "..").slice(1).join("/")
    layout = path.normalize(`${pardirs}/${layoutFile.join("/")}`)
    layout = layout.startsWith("/") ? `.${layout}` : layout

    let blockName = layoutContent.indexOf(" block content") === -1
                  ? "main-container"
                  : "content"

    template = template.split("\n").map(e => `  ${e}`).join("\n")
    template = `extends ${layout}\n\nblock ${blockName}\n${template}`
  }

  context = _.clone(context)
  context.public = globalContext

  let renderer = pug.compile(template, { filename: file, pretty: true })
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


co(function*() {
  yield loadContext({ dirname: "./_source", context: globalContext })
  yield populateBlogs(globalContext)
  yield processDirectory({ dirname: "./_source", context: globalContext })
})
.then(() => require("./_app"))
.catch(console.error)
