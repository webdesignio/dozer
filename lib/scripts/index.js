'use strict'

module.exports = {
  build,
  watch
}

function build () {
  require('./build')
}

function watch () {
  require('./watch')
}
