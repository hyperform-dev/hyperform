// arn:aws:lambda:us-east-2:735406098573:function:myinc
// ==> amazon/us-east-2

function isArn(name) {
  return (/^arn:(aws|aws-cn|aws-us-gov):lambda:/.test(name) === true)
}

function isRegion(name) {
  return /^[0-9a-zA-Z-]+$/.test(name) === true
}

function extractRegion(name) {
  if (isRegion(name)) {
    return name
  }
  if (isArn(name)) {
    const matches = name.match(/^arn:(aws|aws-cn|aws-us-gov):lambda:([^:]+)/)
    if (!matches) throw new Error(`extractRegion: could not extract region out of arn ${name}`)
    const region = matches.slice(-1)[0]
    return region
  }
  throw new Error(`extratRegion: name is neither region nor arn, cant extract region: ${name}`)
}

module.exports = {
  extractRegion,
}
