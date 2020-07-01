const fs = require('fs')
const path = require('path')
const { log } = require('../utils/index')
/**
 * Writes deploy.json and flow.json to current directory, if not already present
 */

const flowJson = [
  { run: '' },
]

const deployJson = [
  {
    forEachIn: './functions',
    do: '',
    upload: '',
    config: {
      amazon: {
        role: '',
      },
    },
  },
]

const flowJsonStr = JSON.stringify(flowJson, null, 2)
const deployJsonStr = JSON.stringify(deployJson, null, 2)

/**
 * 
 * @param {*} root 
 */
function initProject(root) {
  if (fs.existsSync(path.join(root, 'flow.json'))) {
    log('flow.json already exists')
  } else {
    fs.writeFileSync(path.join(root, 'flow.json'), flowJsonStr) // TODO replace with async, do in parallel
    log('flow.json initialized')
  }

  if (fs.existsSync(path.join(root, 'deploy.json'))) {
    log('deploy.json already exists')
  } else {
    fs.writeFileSync(path.join(root, 'deploy.json'), deployJsonStr)
    log('deploy.json initialized')
  }

  if (fs.existsSync(path.join(root, 'functions')) === false) {
    fs.mkdirSync(path.join(root, 'functions'))
  }
}

module.exports = {
  initProject,
}
