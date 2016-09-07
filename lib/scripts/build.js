'use strict'

const { fork } = require('child_process')

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
  NODE_ENV: 'production',
  WEBDESIGNIO_CLUSTER_URL: (rc.url || '').replace(/\/+$/, ''),
  WEBDESIGNIO_WEBSITE: rc.id,
  FORCE_COLOR: 'true'
})
fork(`${__dirname}/build_components`, { env })
fork(`${__dirname}/build_templates`, { env })
fork(`${__dirname}/build_bundles`, { env })
