// const { unenrichedschemas } = require('../schemas/unenriched/index')

// const deployJsonEnrichers = {
//   task: {
//     canEnrich: (obj) => {
//       const schema = unenrichedschemas.task
//       const { error } = schema.validate(obj)
//       return !error
//     },
//     enrich: (obj, args) => {
//       const newobj = { ...obj }
//       newobj.keepUploadable = args.keepUploadable 

//       return newobj
//     },
//   },
// }

// function detectnodetype(obj) {
//   for (const [nodetype, v] of Object.entries(deployJsonEnrichers)) {
//     if (v.canEnrich(obj) === true) {
//       return nodetype
//     }
//   }
//   throw new Error(`DD: No enricher claimed responsibility (canEnrich) for ${obj}`)
// }

// function enrich(obj, args) {
//   const nodetype = detectnodetype(obj)
//   return deployJsonEnrichers[nodetype].enrich(obj, args)
// }

// module.exports = {
//   enrich,
// }
