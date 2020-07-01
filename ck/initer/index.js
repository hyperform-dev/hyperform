const fs = require('fs')
const path = require('path')
/**
 * Writes deploy.json and flow.json to current directory, if not already present
 */

const flowJson = [
  { run: '' },
]

const deployJson = [
  {
    forEachIn: '',
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

function initProject(root) {
  if (fs.existsSync(path.join(root, 'flow.json'))) {
    console.log('flow.json already exists')
  } else {
    fs.writeFileSync(path.join(root, 'flow.json'), flowJsonStr) // TODO replace with async, do in parallel
    console.log('flow.json initialized')
  }

  if (fs.existsSync(path.join(root, 'deploy.json'))) {
    console.log('deploy.json already exists')
  } else {
    fs.writeFileSync(path.join(root, 'deploy.json'), deployJsonStr)
    console.log('deploy.json initialized')
  }
}

module.exports = {
  initProject,
}
