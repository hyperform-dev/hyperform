const mock = require('mock-fs')
const util = require('util');
const exec = util.promisify(require('child_process').exec);
/**
 * 
 * @param {string} deployJsonContents 
 * @param {string} indexJsContents 
 */
function setupMockJs(deployJsonContents, indexJsContents) {
  const p = `/tmp/${Math.ceil(Math.random() * 10000)}`
  mock({
    p: {
      'deploy.json': deployJsonContents,
      lambdas: {
        jestlambda1: {
          'index.js': indexJsContents,
        },
      },
    },
  })

  return p;
}

beforeEach(() => {
  jest.setTimeout(30000) // ms
});

afterEach(() => mock.restore())

describe('system tests of dde', () => {
  describe('js', () => {
    test('minimal deploy.json, 1 js lambda', async () => {
      // set up mock folder
      const folderName = 'functions'
      const deployJsonContents = `
        [
          {
            "forEachIn": ${folderName},
            "do": "rm -f deploypackage.zip; zip -r deploypackage.zip .",
            "upload": "deploypackage.zip",
            "config": {
              "amazon": {
                "role": "arn:aws:iam::735406098573:role/lambdaexecute",
              }
            }
          }
        ] 
     `

      const indexJsContents = `
        exports.handler = (event, context) => {
          context.succeed(event)
        }
     `

      const p = setupMockJs(deployJsonContents, indexJsContents)
      const toBeTested = () => exec(`cd ${p}; dde`)
      let err
      try {
        await toBeTested()
      } catch (e) {
        err = e
      }

      expect(err).not.toBeDefined()
    })
  })
})
