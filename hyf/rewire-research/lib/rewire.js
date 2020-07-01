var Module = require("module"),
    fs = require("fs"),
    path = require('path'),
    getImportGlobalsSrc = require("./getImportGlobalsSrc.js"),
    getDefinePropertySrc = require("./getDefinePropertySrc.js"),
    detectStrictMode = require("./detectStrictMode.js"),
    moduleEnv = require("./moduleEnv.js");

function requireFromString(src, filename) {
    var Module = module.constructor;
    var m = new Module();
    m._compile(src, filename);
    return m;
}

function a() {
    console.log("a")
}

// module.exports = {
//     a
// }


/**
 * Does actual rewiring the module. For further documentation @see index.js
 */
function internalRewire(parentModulePath, targetPath) {
    // NICE
    // Scheinbar brauchts keinen parentpath (wenn im gleichen dir)
    parentModulePath = null
    //  console.log("PATHS", targetPath, parentModulePath, "PATHS")
    var targetModule,
        prelude,
        appendix,
        src;

    // Checking params
    if (typeof targetPath !== "string") {
        throw new TypeError("Filename must be a string");
    }

    // Resolve full filename relative to the parent module
    targetPath = Module._resolveFilename(targetPath, parentModulePath);

    console.log(targetPath)
    // Create testModule as it would be created by require()

   // targetModule = requireFromString(fs.readFileSync(targetPath, 'utf-8'), targetPath)
     targetModule = new Module(targetPath, parentModulePath);
    console.log("XXXX", targetModule, "XXXX")
    
    // TODO ja whatever 
    // zieml kleiner payoff (mehr als 1 level transitive envoy wenn im gleichen file)

    //TODO do that weiter oben als parentmodulepath, incorporate somehow
    // const nodemodulepaths = Module._nodeModulePaths(path.dirname(targetPath));
    // console.log(nodemodulepaths)
  //  process.exit()
    // We prepend a list of all globals declared with var so they can be overridden (without changing original globals)
    prelude = getImportGlobalsSrc();
    // Wrap module src inside IIFE so that function declarations do not clash with global variables
    // @see https://github.com/jhnns/rewire/issues/56
    prelude += "(function () { ";

    // We append our special setter and getter.
    appendix = "\n" + getDefinePropertySrc();

    // End of IIFE
    // SHEESH
    appendix += "})();";


    // Check if the module uses the strict mode.
    // If so we must ensure that "use strict"; stays at the beginning of the module.
    // HAHHAHAHAH HERE IT IS


    src = fs.readFileSync(targetPath, "utf8");
    
    src = src.split("#" + "#")[0] // HAHAHAHAHA
    
    if (detectStrictMode(src) === true) {
        prelude = ' "use strict"; ' + prelude;
    }
   
    console.log(targetModule.id)
    moduleEnv.inject(prelude, appendix);
    moduleEnv.load(targetModule);

    return targetModule.exports;
}

module.exports = {
    a
}

// Splitter:     ## 

// LOOPS
internalRewire(null, './rewire')




// TODO
//module.exports = internalRewire;


