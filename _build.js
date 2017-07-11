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


function copyFile({ from, to }) {
  spawnSync("cp", [ from, to ]) // TODO: perform it without system
}


const loadContext = co.wrap(function*({ dirname, context }) {
  const files = fs.readdirSync(dirname)
                  .filter(e => !e.startsWith("."))
  const children = []

  for (let cname of files) {
    const file = `${dirname}/${cname}`
    const stats = fs.lstatSync(file)

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
      const current = context[cname] = context[cname] || {}
      children.push(loadContext({ dirname: file, context: current })
                    .catch(console.error))
    }
  }

  yield children
})


const populateBlogs = co.wrap(function*(context) {
  yield [ populateBlog(context.kodumaro), populateBlog(context.montegasppa) ]
})


const populateBlog = context => new Promise((resolve, reject) => {
  try {
    const months = []

    for (const [ yearSlug, yearDir ] of _.pairs(context))
      if (/^\d{4}$/.test(yearSlug))
        for (const [ monthSlug, monthDir ] of _.pairs(yearDir))
          if (/^\d\d$/.test(monthSlug)) {
            const index = parseInt(monthSlug) - 1
            months.push({
              slug: `${context.blog.url}${yearSlug}/${monthSlug}`,
              title: `${globalContext.monthSet[index]} de ${yearSlug}`,
              dir: monthDir,
              date: new Date(`${yearSlug}-${monthSlug}-01`)
            })
          }

    months.sort((a, b) => b.date - a.date)
    context.months = months
    resolve()

  } catch(err) {
    reject(err)
  }
})


const processDirectory = ({ dirname, context, layout }) => new Promise((resolve, reject) => {
  try {
    // Clean up
    const counterpart = getCounterpart(dirname)
    if (fs.existsSync(counterpart) && counterpart !== ".")
      spawnSync("rm", [ "-rf", counterpart ]) // TODO: perform it without system

    const check = _.last(counterpart.split("/"))
    if (/^[\._][^\._].*/.test(check))
      return resolve()

    if (counterpart !== ".")
      fs.mkdirSync(counterpart)
    const files = fs.readdirSync(dirname)
                    .filter(e => !e.startsWith("."))

    // Update layout
    if (fs.existsSync(`${dirname}/_layout.pug`))
      layout = `${dirname}/_layout.pug`

    // Scan dirname
    for (let cname of files) {
      const file = `${dirname}/${cname}`
      const stats = fs.lstatSync(file)

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

    resolve()

  } catch(err) {
    reject(err)
  }
})


const processFile = ({ file, context, layout }) => new Promise((resolve, reject) => {
  try {
    // Clean up
    const counterpart = getCounterpart(file)

    if (fs.existsSync(counterpart) && counterpart !== ".")
      fs.unlinkSync(counterpart)

    if (file.endsWith(".pug")) {
      if (!context)
        throw Error(`no context for ${file}`)
      processPugFile({ file, counterpart, context, layout })

    } else if (file.endsWith(".styl"))
      processStylusFile({ file, counterpart })

    else
      copyFile({ from: file, to: counterpart })

    resolve()

  } catch(err) {
    reject(err)
  }
})


function processPugFile({ file, counterpart, context, layout }) {
  let useLayout = context.layout
  useLayout = useLayout === undefined ? true : !!useLayout

  let template = fs.readFileSync(file, "utf-8")
  let render = pug.compile(template, { filename: file, pretty: false })

  context = _.clone(context)
  context.public = globalContext
  let content = render(context)

  if (useLayout) {
    context.yield = content
    template = fs.readFileSync(layout, "utf-8")
    render = pug.compile(template, { filename: layout, pretty: false })
    content = render(context)
  }

  fs.writeFileSync(counterpart, content, "utf-8")
}


function processStylusFile({ file, counterpart }) {
  const template = fs.readFileSync(file, "utf-8")
  stylus(template)
  .set("filename", counterpart)
  .set("paths", [ path.dirname(file) ])
  .render((err, css) => {
    if (err)
      console.error(err)
    else
      fs.writeFileSync(counterpart, css, "utf-8")
  })
}


co(function*() {
  yield loadContext({ dirname: "./_source", context: globalContext })
  yield populateBlogs(globalContext)
  yield processDirectory({ dirname: "./_source", context: globalContext })
})
.then(() => console.log("built"))
.catch(console.error)
