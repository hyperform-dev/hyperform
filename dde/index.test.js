const fs = require('fs')
const util = require('util');
const exec = util.promisify(require('child_process').exec);
/**
 * 
 * @param {string} deployJsonContents 
 * @param {string} indexJsContents 
 */
function setupMockJs(deployJsonContents, indexJsContents) {
  const p = `/tmp/${Math.ceil(Math.random() * 100000 + 10000)}` // TODO lol
  fs.mkdirSync(p)
  fs.writeFileSync(`${p}/deploy.json`, deployJsonContents)
  fs.mkdirSync(`${p}/functions`)
  fs.mkdirSync(`${p}/functions/testlambda1`)
  fs.writeFileSync(`${p}/functions/testlambda1/index.js`, indexJsContents)

  return p;
}

beforeAll(() => {
  jest.setTimeout(30000) // ms
});

describe('system tests of dde', () => {
  describe('js', () => {
    test('minimal deploy.json, 1 js lambda', async () => {
      // set up mock folder
      const deployJsonContents = JSON.stringify(
        [
          {
            forEachIn: 'functions',
            do: 'rm -f deploypackage.zip; zip -r deploypackage.zip .',
            upload: 'deploypackage.zip',
            config: {
              amazon: {
                role: 'arn:aws:iam::735406098573:role/lambdaexecute',
              },
            },
          },
        ],
      )

      const indexJsContents = JSON.stringify(
        exports.handler = (event, context) => {
          context.succeed(event)
        },
      )

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
