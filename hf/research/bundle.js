/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is not neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(function(e, a) { for(var i in a) e[i] = a[i]; if(a.__esModule) Object.defineProperty(e, "__esModule", { value: true }); }(exports,
/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./research/a.js":
/*!***********************!*\
  !*** ./research/a.js ***!
  \***********************/
/*! unknown exports (runtime-defined) */
/*! runtime requirements: module */
/*! CommonJS bailout: module.exports is used directly at 5:0-14 */
/***/ ((module) => {

eval("function a() {\n  console.log('a')\n}\n\nmodule.exports = {\n  a,\n}\n\n\n//# sourceURL=webpack://hyperform/./research/a.js?");

/***/ }),

/***/ "./research/requireintercept.js":
/*!**************************************!*\
  !*** ./research/requireintercept.js ***!
  \**************************************/
/*! unknown exports (runtime-defined) */
/*! runtime requirements: module, __webpack_require__ */
/*! CommonJS bailout: module.exports is used directly at 22:0-14 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

eval("var require;/* eslint-disable */\n\n\nconst stdrequire = undefined \n//const myrequire = (...args) => { console.log(\"ayyy myrequire\"); return stdrequire(...args);}\nconst myrequire = () => ({ a: () => console.log(\"booh\") })\nrequire = myrequire\n\n/////\n/////\n/////\n/////\n\n\nfunction ab() {\n  const { a } = __webpack_require__(/*! ./a */ \"./research/a.js\")\n  a()\n}\n\n\n\nmodule.exports = {\n  ab\n}\n\n//# sourceURL=webpack://hyperform/./research/requireintercept.js?");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		if(__webpack_module_cache__[moduleId]) {
/******/ 			return __webpack_module_cache__[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	// module exports must be returned from runtime so entry inlining is disabled
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__("./research/requireintercept.js");
/******/ })()

));