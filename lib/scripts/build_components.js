'use strict'

const { writeFile } = require('fs')
const Bluebird = require('bluebird')
const parser = require('shift-parser')
const codegen = require('shift-codegen').default
const browserify = require('browserify')
const chalk = require('chalk')

const createComponentProxy = require('../create_component_proxy')
const pkg = require(`${process.cwd()}/package.json`)

const writeFileAsync = Bluebird.promisify(writeFile)

const components = () => (pkg.webdesignio || {}).components || {}
Promise.all(
  Object.keys(components())
    .map(name => {
      return writeFileAsync(
        `components/browserify/${name}.js`,
        createComponentProxy({ components: components(), name })
      )
      .then(() => {
        return bundleComponent({
          name,
          input: `components/browserify/${name}.js`,
          output: `components/${name}.js`
        })
      })
    })
)
.then(() =>
  console.log(chalk.green.bold('    ✓ ') + 'All components compiled')
)
.catch(err => { console.error(err) })

function bundleComponent ({ name, input, output }) {
  return new Promise((resolve, reject) => {
    browserify(input, {
      standalone: name,
      transform: [
        ['babelify', {
          presets: ['react'],
          plugins: ['transform-es2015-modules-commonjs']
        }],
        'envify'
      ]
    })
    .bundle((err, buf) => {
      if (err) return reject(err)
      const ast = parser.parseScript(buf.toString())
      resolve(codegen(ast))
    })
  })
  .then(source => writeFileAsync(output, source))
}
