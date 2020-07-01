const { regionsToIdx } = require('../index')

// arn:aws:lambda:us-east-2:735406098573:function:myinc
// ==> amazon/us-east-2

const extractors = [
  { // Amazon
    canExtractRegion: (name) => (/^arn:(aws|aws-cn|aws-us-gov):lambda:/.test(name) === true),
    extractRegion: (arn) => {
      if (arn == null) throw new Error(`extractRegion: cannot extract region of string ${arn}`)
      const matches = arn.match(/^arn:(aws|aws-cn|aws-us-gov):lambda:([^:]+)/)
      if (!matches) throw new Error(`extractRegion: could not extract region out of arn ${arn}`)
      const region = matches.slice(-1)[0]
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
