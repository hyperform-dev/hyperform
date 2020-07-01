const workflowSchema = require('./index').unenrichedschemas.workflow

describe('unenriched schema validators', () => {
  describe('accepts correct ones', () => {
    test('sequence->atomic', () => {
      const input = [
        { run: 'xxx' },
      ]

      const toBeTested = () => workflowSchema.validate(input)

      const { error } = toBeTested()
      expect(error).not.toBeDefined()
    })

    test('sequence->2atomic', () => {
      const input = [
        { run: 'xxx' },
        { run: 'xxx' },
      ]

      const toBeTested = () => workflowSchema.validate(input)

      const { error } = toBeTested()
      expect(error).not.toBeDefined()
    })

    test('sequence->atomic|sequence->atomic', () => {
      const input = [
        { run: 'xxx' },
        [
          { run: 'xxx' },
        ],
      ]

      const toBeTested = () => workflowSchema.validate(input)

      const { error } = toBeTested()
      expect(error).not.toBeDefined()
    })

    test('sequence->doparallel->atomic', () => {
      const input = [
        { run: 'xxx ' },
        {
          doParallel: [
            { run: 'xxx ' },
          ],
        },
      ]

      const toBeTested = () => workflowSchema.validate(input)

      const { error } = toBeTested()
      expect(error).not.toBeDefined()
    })
  })
})
