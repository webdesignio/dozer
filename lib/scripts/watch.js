#!/bin/bash

const { writeFile, readFile } = require('fs')
const { relative } = require('path')
const { spawn } = require('child_process')
const glob = require('glob')
const gaze = require('gaze')
const Bluebird = require('bluebird')
const co = require('co')
const chalk = require('chalk')

const { copyTemplate, compilePugTemplate } = require('../templates')
const createComponentIndex = require('../create_component_index')

const readFileAsync = Bluebird.promisify(readFile)
const writeFileAsync = Bluebird.promisify(writeFile)

let rc
try {
  rc = require(`${process.cwd()}/.webdesigniorc.json`)
} catch (e) {
  if (e.code === 'MODULE_NOT_FOUND') {
    console.log('    No rc found!')
    process.exit()
  } else {
    throw e
  }
}
const env = Object.assign({}, process.env, {
  NODE_ENV: 'development',
  WEBDESIGNIO_CLUSTER_URL: '',
  WEBDESIGNIO_WEBSITE: rc.id,
  FORCE_COLOR: 'true'
})

const buildComponentIndex = co.wrap(function * buildComponentIndex (p = 'package.json') {
  const pkgSrc = yield readFileAsync(p, 'utf-8')
  const pkg = JSON.parse(pkgSrc)
  const components = (pkg.webdesignio || {}).components || {}
  console.log(chalk.bold.blue('    – ') + 'build component index')
  yield writeFileAsync(
    'src/components/index.js',
    createComponentIndex({ components })
  )
})

function compileAllPugTemplates () {
  glob.sync('src/@(pages|objects)/*.pug').forEach(compilePugTemplate)
}

glob.sync('src/@(pages|objects)/*.html').forEach(copyTemplate)
compileAllPugTemplates()
gaze('src/@(pages|objects)/*.html', (err, watcher) => {
  if (err) throw err
  const onBuild = p => copyTemplate(relative(process.cwd(), p))
  watcher.on('changed', onBuild)
  watcher.on('added', onBuild)
})
gaze('src/**/*.pug', (err, watcher) => {
  if (err) throw err
  const onBuild = () => compileAllPugTemplates()
  watcher.on('changed', onBuild)
  watcher.on('added', onBuild)
})
gaze('package.json', (err, watcher) => {
  if (err) throw err
  const onBuild = buildComponentIndex
  watcher.on('changed', onBuild)
  watcher.on('added', onBuild)
})

buildComponentIndex()
  .then(() => {
    spawn('watchify', [
      '-s', 'CMS',
      '-t', '[', 'babelify', '--presets', '[', 'react', 'es2015', ']', ']',
      '-t', 'envify',
      '-o', 'static/client.js',
      'src/client.js',
      '-v'
    ], { env, stdio: 'inherit' })
  })
