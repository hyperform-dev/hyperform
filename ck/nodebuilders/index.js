/* eslint-disable arrow-body-style */
const joi = require('joi')

const { secondschemas } = require('../schemas')
const { envoy } = require('../envoys/index')
const { sharedStash } = require('../stashes')
// takes an object such as 
// { run: "function1", in: "function0" }
// and creates a asyncronius function that when run, will run that fn in the cloud and return its result or a promise thereof. Calls envoy.

const nodebuilders = {
  // Name of the AFCL construct
  'atomic': {
    canBuild: (obj) => {
      const schema = secondschemas.atomic 
      const { error, value } = schema.validate(obj)
      if (error) {
        return false 
      } else {
        return true
      }
    },
    build: (obj) => {
      return function (input) {
        console.log(obj, input)
        return envoy(obj.run, input)
      }
    },
  },

  // 'sequence': {
  //   /** 
  //    * Whether to claim responsibility for building passed obj
  //    * @param {*} obj 
  //    * @returns {boolean}
  //    */
  //   canBuild: (obj) => {
  //     const schema = secondschemas.sequence 
  //     const { error, value } = schema.validate(obj)
  //     if (error) {
  //       return false 
  //     } else {
  //       return true
  //     }
  //   },

  //   /** Builds a function that if run given input, runs that obj in the cloud
  //    * Returns promise of final output
  //    * @param {*} obj The AFCL of the subconstruct
  //    * @returns {(input) => Promise<{ fn1id: *, fn2id: * ...}>}
  //    */
  //   build: (obj) => { 
  //     return function (input) {
  //       if (!obj.length) {
  //         return Promise.resolve()
  //       }

  //       // We're defining now how the members should be run
  //       // Because it's a sequence, they should be run one after the other

  //       // array of unstarted functions that if start with input, run the corresponding cloud fn
  //       const fnRunners = obj.map((n) => {
  //         return (_input) => envoy(n.run, _input)
  //       })

  //       return new Promise((resolve, reject) => {

  //       })
  //     }
  //   },
  // },
}

sharedStash.put('innn', { num: 2 })

const obje = {
  'run': 'arn:aws:lambda:us-east-2:735406098573:function:myinc',
  'id': 'arn:aws:lambda:us-east-2:735406098573:function:myinc',
  'in': 'innn',
}

const inp = { num: 99 }

if (nodebuilders.atomic.canBuild(obje)) {
  const fnRunner = nodebuilders.atomic.build(obje)

  fnRunner(inp)
    .then((res) => console.log(res))
} else {
  console.log('cannot build')
}
