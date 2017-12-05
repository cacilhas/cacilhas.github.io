"use strict"

import * as _ from "underscore"
import * as fs from "fs"
import * as path from "path"
import { spawnSync } from "child_process"
import * as pug from "pug"
import * as stylus from "stylus"

interface Context {
  public?: Context
  yield?: string
  [attr: string]: any
}

interface FileData {
  slug: string
  title: string
  dir: string
  date: Date
}

type Render = (ctx: Context) => string

const globalContext: Context = {}


function getCounterpart(name: string): string {
  let counterpart = name.replace(/^.\/_source/, ".")

  if (counterpart.endsWith(".pug")) {
    counterpart = counterpart.replace(/\.pug$/, "")
    if (!/\.\w{3,4}/.test(counterpart))
      counterpart += ".html"
  } else if (counterpart.endsWith(".styl"))
    counterpart = counterpart.replace(/\.styl$/, ".css")

  return counterpart
}


function copyFile({ from, to }: { from: string, to: string }): void {
  spawnSync("cp", [ from, to ]) // TODO: perform it without system
}


interface loadContextParameter {
  dirname: string
  context: Context
}

async function loadContext({ dirname, context }: loadContextParameter):
Promise<void> {
  const files = fs.readdirSync(dirname)
                  .filter(e => !e.startsWith("."))
  const children: Promise<void>[] = []

  for (let cname of files) {
    const file = `${dirname}/${cname}`
    const stats = fs.lstatSync(file)

    if (stats.isFile()) {
      if (cname.endsWith(".json"))
        _(context).assign(require(file))

      else if (cname.endsWith(".pug")) {
        cname = cname.replace(/\.pug$/, "")
        context[cname] = context[cname] === undefined ? {} : context[cname]

        // Add current
        context[cname].current = {
          source: cname,
          path: `${dirname}/${cname}`.split("/"),
          url: `${cname}.html`,
        }
      }

    } else if (!stats.isSymbolicLink() && stats.isDirectory()) {
      const current = context[cname] = context[cname] || {}
      children.push(
        loadContext({ dirname: file, context: current }).catch(console.error)
      )
    }
  }

  await children
}


async function populateBlog(context: Context): Promise<void> {
  const months: FileData[] = []

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

  months.sort((a: FileData, b: FileData) => (+b.date) - (+a.date))
  context.months = months
}


async function populateBlogs(context: Context): Promise<void> {
  await [
    populateBlog(context.kodumaro), populateBlog(context.montegasppa)
  ]
}


interface processPugFileParameter {
  file: string
  counterpart: string
  context: Context
  layout?: string
}

function processPugFile(
  { file, counterpart, context, layout }: processPugFileParameter
): void {
  const _useLayout = context.layout
  const useLayout = _useLayout === undefined ? true : !!_useLayout

  let template = fs.readFileSync(file, "utf-8")
  let render: Render = pug.compile(template, { filename: file, pretty: false })

  context = _.clone(context)
  context.public = globalContext
  let content = render(context)

  if (useLayout && typeof layout === "string") {
    context.yield = content
    template = fs.readFileSync(layout, "utf-8")
    render = pug.compile(template, { filename: layout, pretty: false })
    content = render(context)
  }

  fs.writeFileSync(counterpart, content, "utf-8")
}


interface processStylusFileParameter {
  file: string
  counterpart: string
}

function processStylusFile({ file, counterpart }: processStylusFileParameter) {
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


interface processFileParameter {
  file: string
  context: Context
  layout?: string
}

async function processFile({ file, context, layout }: processFileParameter):
Promise<void> {
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
}


interface processDirectoryParameter {
  dirname: string
  context: Context
  layout?: string
}

async function processDirectory(
  { dirname, context, layout }: processDirectoryParameter
): Promise<void> {
  console.log("processing directory:", dirname)
  // Clean up
  const counterpart = getCounterpart(dirname)
  if (fs.existsSync(counterpart) && counterpart !== ".")
    spawnSync("rm", ["-rf", counterpart]) // TODO: perform it without system

  const check: string = _.last(counterpart.split("/"))
  if (/^[\._][^\._].*/.test(check))
    return

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
        processFile({ file, context: <Context>context[cname], layout })
          .catch(console.error)

      } else {
        processDirectory({ dirname: file, context: context[cname], layout })
          .catch(console.error)
      }
    }
  }
}

async function fixFeed(fname: string): Promise<void> {
  let text = fs.readFileSync(fname)
    .toString()
    .replace(/(GMT-0300) \(-03\)/g, "$1 (BRT)")
    .replace(/(GMT-0200) \(-02\)/g, "$1 (BRST)")
  text = text.endsWith("\n") ? text : `${text}\n`
  fs.writeFileSync(fname, text, "utf8")
}


;(async () => {
  console.log("loading context")
  await loadContext({ dirname: "./_source", context: globalContext })

  console.log("populating blogs")
  await populateBlogs(globalContext)

  await processDirectory({ dirname: "./_source", context: globalContext })

  console.log("fixing feeds’ time")
  await [
    fixFeed("./kodumaro/feed.xml"),
    fixFeed("./montegasppa/feed.xml"),
  ]
})()
  .then(() => console.log("built"))
  .catch(console.error)
