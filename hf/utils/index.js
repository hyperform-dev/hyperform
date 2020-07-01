const arg = require('arg')

function isObject(val) {
  if (val == null) { return false; }
  // don't recurse into arrays like we do for objects
  if (val.constructor === Array) { return false; } 
  // it should have some keys, so when we recursively call evl on it there's something to do
  return typeof val === 'object' && Object.keys(val) && Object.keys(val).length > 0
}

/**
 * Flatten a multidimensional object
 *
 * For example:
 *   flattenObject({ a: 1, b: { c: 2 } })
 * Returns:
 *   { a: 1, c: 2}
 */
function flattenObject(obj) {
  const flattened = {}

  Object.keys(obj).forEach((key) => {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      Object.assign(flattened, flattenObject(obj[key]))
    } else {
      flattened[key] = obj[key]
    }
  })

  return flattened
}

function isFunction(val) {
  return typeof val === 'function'
}

// Set terminal logging level

const args = arg({
  '--verbose': Boolean,
  '-v': '--verbose',
})

const { log } = console
let logdev 

if (args['--verbose'] === true) {
  logdev = console.log
} else {
  // don't show dev-level logging
  logdev = () => { }
  // don't show timings
  console.time = () => { }
  console.timeEnd = () => { }
}

module.exports = {
  isObject,
  flattenObject,
  isFunction,
  log, 
  logdev,
}
