const fs = require('fs')
const path = require('path')
/**
 * Writes deploy.json and flow.json to current directory, if not already present
 */

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

const deployJsonStr = JSON.stringify(deployJson, null, 2)

function initProject(root) {
  if (fs.existsSync(path.join(root, 'deploy.json')) === false) {
    fs.writeFileSync(path.join(root, 'deploy.json'), deployJsonStr)
    console.log('`deploy.json` initialized')
  }

  if (fs.existsSync(path.join(root, 'functions')) === false) {
    fs.mkdirSync(path.join(root, 'functions'))
    console.log('`functions` initialized')
  }
}

module.exports = {
  initProject,
}
