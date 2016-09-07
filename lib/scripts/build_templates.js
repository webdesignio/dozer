'use strict'

const glob = require('glob')
const chalk = require('chalk')

const { compilePugTemplate, copyTemplate } = require('../templates')

Promise.all(
  glob.sync('src/@(pages|objects)/*.html').map(copyTemplate)
    .concat(glob.sync('src/@(pages|objects)/*.pug').map(compilePugTemplate))
)
.then(() => {
  console.log(chalk.green.bold('    ✓ ') + 'All templates built')
})
