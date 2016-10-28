'use strict'

const { writeFile, readFile } = require('fs')
const pug = require('pug')
const cheerio = require('cheerio')
const Bluebird = require('bluebird')
const chalk = require('chalk')
const { render } = require('mustache')

const readFileAsync = Bluebird.promisify(readFile)
const writeFileAsync = Bluebird.promisify(writeFile)

module.exports = {
  copyTemplate,
  writeTemplate,
  compilePugTemplate
}

function copyTemplate (file) {
  return readFileAsync(file, { encoding: 'utf-8' })
    .then(writeTemplate.bind(null, file))
}

function writeTemplate (file, content) {
  let api = { view: {}, partials: {} }
  try {
    api = require(`${process.cwd()}/config/mustache.js`)
  } catch (e) {
    if (e.code !== 'MODULE_NOT_FOUND') throw e
  }
  const output = file.replace(/^src\//, '')
  console.log(chalk.bold.blue('    – ') + 'write template', output)
  const $ = cheerio.load(render(content, api.view, api.partials))
  $('[data-component]').each(function () {
    const innerHTML = $(this).html()
    let props
    try {
      props = JSON.parse($(this).attr('data-props') || '{}')
    } catch (err) {
      console.log(err.stack)
      return
    }
    Object.assign(props, { innerHTML: props.innerHTML || innerHTML })
    $(this).attr('data-props', JSON.stringify(props))
    $(this).html('')
  })
  return writeFileAsync(output, $.html())
}

function compilePugTemplate (file) {
  const api = require(`${process.cwd()}/pug_api`)
  let fn
  try {
    fn = pug.compileFile(file)
  } catch (e) {
    console.log()
    console.log(e.message)
    console.log()
    return Promise.resolve()
  }
  return writeTemplate(file.replace(/pug$/, 'html'), fn(api))
}
