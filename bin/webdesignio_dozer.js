#!/usr/bin/env node

'use strict'

const chalk = require('chalk')

const scripts = require('../lib/scripts')

const [, , cmd] = process.argv

const fn = scripts[cmd]
if (fn == null) error('Unknown command!')
fn()

function error (err) {
  if (typeof err === 'string') {
    console.log(
      '  ' +
      chalk.red(
        chalk.bold('⚠  [Error]  ') +
        (typeof err === 'string' ? err : err.message)
      )
    )
  } else {
    console.error(err.stack)
  }
  process.exit(0)
}
