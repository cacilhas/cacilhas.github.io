"use strict"

import * as _ from "underscore"
import * as fs from "fs"
import * as path from "path"
import * as URL from "url"
import * as moment from "moment"
import * as yaml from "js-yaml"
import * as pug from "pug"
import * as CoffeeScript from "coffeescript"
import * as rimraf from "rimraf"
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

interface Page {
  title: string
  release: Date
  tags: string[]
  path: string
  current: { path: string[] }
}

type TagContent = { [slug: string]: Page }
type Render = (ctx: Context) => string

const globalContext: Context = {}
const tags: { [name: string]: TagContent } = {}

const refContext = {
  cacilhas: yaml.safeLoad(fs.readFileSync("./_source/_data.yaml", "utf8")),
  montegasppa: yaml.safeLoad(fs.readFileSync("./_source/montegasppa/_data.yaml", "utf8")),
  kodumaro: yaml.safeLoad(fs.readFileSync("./_source/kodumaro/_data.yaml", "utf8")),
}

const mixins: string[] = fs.readdirSync(`./_source/_mixins`)
                           .filter(e => !e.startsWith("."))
                           .map(e => `_mixins/${e}`)


_.mixin({
  capitalize: (s: string) => s.charAt(0).toUpperCase() + s.slice(1),
  uncapitalize: (s: string) => s.charAt(0).toLowerCase() + s.slice(1),
})


function findDirPath(filename: string): string {
  const steps = path.dirname(filename).split("/")
  const index = steps.indexOf("_source") + 1
  if (index === 0)
    return "."
  else
    return path.join(... _(steps.length - index).times(() => ".."))
}


function mkSlug(name: string): string {
  return name
      .replace(/ /g, "-")
      .toLowerCase()
      .replace(/[^0-9a-z_-]/g, "")
}


function isContext(ctx?: any): ctx is Context {
  if (!ctx
    || Array.isArray(ctx)
    || _.isNumber(ctx)
    || _.isString(ctx)
    || _.isDate(ctx)
    || _.isFunction(ctx)
    || _.isRegExp(ctx)
    || _.isSymbol(ctx)
    || (ctx.yield && !_.isString(ctx.yield))
  )
    return false

  return _.isObject(ctx)
}


function processURL(url: string): string {
  const resource: URL.Url = URL.parse(url)
  resource.protocol = "https" // force HTTPS
  resource.path = resource.path || "/"

  if (resource.pathname!.startsWith("/montegasppa")) {
    resource.pathname = resource.pathname!.slice(12)
    resource.host = URL.parse(refContext.montegasppa.blog.url).host

  } else if (resource.pathname!.startsWith("/kodumaro")) {
    resource.pathname = resource.pathname!.slice(9)
    resource.host = URL.parse(refContext.kodumaro.blog.url).host

  } else if (!resource.host)
    resource.host = URL.parse(refContext.cacilhas.main.host).host

  resource.path = `${resource.pathname}${resource.search || ""}`
  resource.href = `${resource.path}${resource.hash || ""}`
  return URL.format(resource)
}


function isStringSet(ar?: any[]): ar is string[] {
  if (!ar)
    return false

  for (const e of ar)
    if (!_.isString(e))
      return false
  return true
}


function isPage(page?: { [k: string]: any }): page is Page {
  if (_.isNull(page) || _.isUndefined(page) || !_.isObject(page))
    return false

  page = page!

  if (_.isString(page.title)
    && _.isDate(page.release)
    && isStringSet(page.current && page.current.path)
  ) {
    if (!page.tags)
      page.tags = [] as string[]
    else if (!isStringSet(page.tags))
      return false

    return true
  }
  return false
}


async function findTags(context?: Context): Promise<void> {
  if (!isContext(context))
    return

  if (isPage(context))
    for (const tag of context.tags) {
      context.path = `/${context.current.path.slice(2).join("/")}`
      tags[tag] = tags[tag] || {}
      tags[tag][context.path] = context
    }

  else {
    const promises: Promise<void>[] = []
    for (const [key, values] of _.pairs(context))
      if (key !== "public" && isContext(context))
        promises.push(findTags(values))
    await Promise.all(promises)
  }
}


async function buildTags(): Promise<void> {
  rimraf.sync("./tags")
  fs.mkdirSync("./tags")
  console.log("building tag pages")
  for (const [tag, content] of _.pairs(tags)) {
    console.log("build tag page:", tag)
    const slug = mkSlug(tag)
    processPugFile({
      file: "./_source/_includes/tagpage.pug",
      counterpart: `./tags/${slug}.html`,
      context: _.chain(globalContext).clone().extend({
        _, moment, mkSlug,
        public: globalContext,
        title: tag,
        pages: _.values(content),
      }).value(),
      layout: "./_source/_layout.pug",
    })
  }
}


function getCounterpart(name: string): string {
  let counterpart = name.replace(/^.\/_source/, ".")

  if (counterpart.endsWith(".pug")) {
    counterpart = counterpart.replace(/\.pug$/, "")
    if (!/\.\w{3,4}/.test(counterpart))
      counterpart += ".html"
  } else if (counterpart.endsWith(".styl"))
    counterpart = counterpart.replace(/\.styl$/, ".css")
  else if (counterpart.endsWith(".coffee"))
    counterpart = counterpart.replace(/\.coffee$/, ".js")

  return counterpart
}


function copyFile({ from, to }: { from: string, to: string }): void {
  fs.writeFileSync(to, fs.readFileSync(from, "utf-8"), "utf-8")
}


interface loadContextParameter {
  dirname: string
  context: Context
}

async function loadContext({ dirname, context }: loadContextParameter)
    : Promise<void> {

  const files = fs.readdirSync(dirname)
                  .filter(e => !e.startsWith("."))
  const children: Promise<void>[] = []

  for (let cname of files) {
    const file = `${dirname}/${cname}`
    const stats = fs.lstatSync(file)

    if (stats.isFile()) {
      if (cname.endsWith(".json"))
        _(context).assign(require(file))

      else if (cname.endsWith(".yaml") || cname.endsWith(".yml"))
        _(context).assign(yaml.safeLoad(fs.readFileSync(file, "utf-8")))

      else if (cname.endsWith(".pug")) {
        cname = cname.replace(/\.pug$/, "")
        context[cname] = _.isUndefined(context[cname]) ? {} : context[cname]
        const base = dirname.replace(/^.\/_source/, '')

        // Add current
        context[cname].current = {
          source: cname,
          path: `${dirname}/${cname}`.split("/"),
          url: processURL(`${base}/${cname}.html`),
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
          const date = new Date(`${yearSlug}-${monthSlug}-01T12:00:00.000Z`)
          months.push({
            slug: `${context.blog.url}${yearSlug}/${monthSlug}`,
            title: moment(date).format("MMMM YYYY"),
            dir: monthDir,
            date,
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

function processPugFile({ file, counterpart, context, layout }: processPugFileParameter)
    : void {

  const _useLayout = context.layout
  const useLayout = _useLayout === undefined ? true : !!_useLayout

  let template = fs.readFileSync(file, "utf-8")
  let render  = compilePug(template, file)

  context = _(_.clone(context)).extend({ public: globalContext, moment, mkSlug, _ })
  let content = render(context)

  if (useLayout && typeof layout === "string") {
    context.yield = content
    template = fs.readFileSync(layout, "utf-8")
    render = compilePug(template, layout)
    content = render(context)
  }

  fs.writeFileSync(counterpart, content, "utf-8")
}


function compilePug(template: string, filename: string): Render {
  const dir = findDirPath(filename)
  const mixinsInclude = mixins.map(cur => `include ${dir}/${cur}\n`)
                              .reduce((acc, cur) => acc + cur)
  const content = template.startsWith("extends ")
    ? template
    : mixinsInclude + template
  return pug.compile(content, { filename, pretty: false })
}


interface processCodeFileParameter {
  file: string
  counterpart: string
}

function processStylusFile({ file, counterpart }: processCodeFileParameter) {
  const template = fs.readFileSync(file, "utf-8")
  stylus(template)
  .set("filename", counterpart)
  .set("paths", [ path.dirname(file) ])
  .render((err: Error, css: string) => {
    if (err)
      console.error(err)
    else
      fs.writeFileSync(counterpart, css, "utf-8")
  })
}

function processCoffeeFile({ file, counterpart }: processCodeFileParameter) {
  const template = fs.readFileSync(file, "utf-8")
  const output = CoffeeScript.compile(template)
  fs.writeFileSync(counterpart, output, "utf-8")
}


interface processFileParameter {
  file: string
  context: Context
  layout?: string
}

async function processFile({ file, context, layout }: processFileParameter)
    :Promise<void> {

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

  else if (file.endsWith(".coffee"))
    processCoffeeFile({ file, counterpart })

  else
    copyFile({ from: file, to: counterpart })
}


interface processDirectoryParameter {
  dirname: string
  context: Context
  layout?: string
}

async function processDirectory({ dirname, context, layout }: processDirectoryParameter)
    : Promise<void> {

  console.log("processing directory:", dirname)
  // Clean up
  const counterpart = getCounterpart(dirname)
  if (fs.existsSync(counterpart) && counterpart !== ".")
    rimraf.sync(counterpart)

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
    findTags(globalContext),
    fixFeed("./kodumaro/feed.xml"),
    fixFeed("./montegasppa/feed.xml"),
  ]
  await buildTags()

})()
  .then(() => console.log("built"))
  .catch(console.error)
