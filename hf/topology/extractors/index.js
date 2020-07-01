const { regionsToIdx } = require('../index')

// arn:aws:lambda:us-east-2:735406098573:function:myinc
// ==> amazon/us-east-2

const extractors = [
  { // Amazon
    canExtractRegion: (name) => {
      const isarn = (/^arn:(aws|aws-cn|aws-us-gov):lambda:/.test(name) === true)
      const isregion = (/amazon\/\w+/.test(name) === true)
      return isarn || isregion
    },
    extractRegion: (name) => {
      if ((/amazon\/\w+/.test(name) === true)) {
        return name // it's already in desired form
      }

      if (name == null) throw new Error(`extractRegion: cannot extract region of string ${name}`)
      const matches = name.match(/^arn:(aws|aws-cn|aws-us-gov):lambda:([^:]+)/)
      if (!matches) throw new Error(`extractRegion: could not extract region out of name ${name}`)

      let region = matches.slice(-1)[0]
      region = `amazon/${matches.slice(-1)[0]}` // eg. amazon/us-east-2
      return region
    },
  },
]

function extractRegion(name) {
  for (let i = 0; i < extractors.length; i += 1) {
    if (extractors[i].canExtractRegion(name) === true) {
      const regionstr = extractors[i].extractRegion(name)
      return regionstr
    }
  }
  throw new Error(`No region extractor claimed responsibility for ${name}`)
}

module.exports = {
  extractRegion,
}
