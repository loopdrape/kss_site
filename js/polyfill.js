// [polyfill for legacy browser]
;(function() {
	"use strict";
	
	if (!Function.prototype.bind) {
		Function.prototype.bind = function (oThis) {
			if(typeof this !== "function") {
				// closest thing possible to the ECMAScript 5 internal IsCallable function
				throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
			}
			
			var aArgs = Array.prototype.slice.call(arguments, 1),
					fToBind = this,
					FNOP = function () {},
					fBound = function () {
						return fToBind.apply(
							this instanceof FNOP && oThis ? this : oThis,
							aArgs.concat(Array.prototype.slice.call(arguments))
						);
					};
			
			FNOP.prototype = this.prototype;
			fBound.prototype = new FNOP();
			
			return fBound;
		};
	}
	
	if(!Object.assign) {
		Object.assign = function (target) {
			if (target === undefined || target === null) {
				throw new TypeError('Cannot convert undefined or null to object');
			}
			
			var output = Object(target);
			for (var index = 1; index < arguments.length; index++) {
				var source = arguments[index];
				if (source !== undefined && source !== null) {
					for (var nextKey in source) {
						if (Object.prototype.hasOwnProperty.call(source, nextKey)) {
							output[nextKey] = source[nextKey];
						}
					}
				}
			}
			return output;
		};
	}
	
	if(!Object.keys) {	// LTE IE8
		Object.keys = (function () {
			var hasOwnProperty = Object.prototype.hasOwnProperty,
					hasDontEnumBug = !({toString: null}).propertyIsEnumerable('toString'),
					dontEnums = [
						'toString',
						'toLocaleString',
						'valueOf',
						'hasOwnProperty',
						'isPrototypeOf',
						'propertyIsEnumerable',
						'constructor'
					],
					dontEnumsLength = dontEnums.length;
			
			return function (obj) {
				if (typeof obj !== 'object' && typeof obj !== 'function' || obj === null) throw new TypeError('Object.keys called on non-object');
				
				var result = [];
				
				for (var prop in obj) {
					if (hasOwnProperty.call(obj, prop)) result.push(prop);
				}
				
				if (hasDontEnumBug) {
					for (var i=0; i < dontEnumsLength; i++) {
						if (hasOwnProperty.call(obj, dontEnums[i])) result.push(dontEnums[i]);
					}
				}
				return result;
			};
		})();
	}
	
	if(!Object.create) {
		Object.create = (function(undefined) {
			var Temp = function() {};
			return function (prototype, propertiesObject) {
				if(prototype !== Object(prototype) && prototype !== null) {
					throw TypeError('Argument must be an object, or null');
				}
				Temp.prototype = prototype || {};
				var result = new Temp();
				Temp.prototype = null;
				if (propertiesObject !== undefined) {
					Object.defineProperties(result, propertiesObject);
				}
				
				// to imitate the case of Object.create(null)
				if(prototype === null) {
					 result.__proto__ = null;
				}
				return result;
			};
		})();
	}
	
	if(!Object.setPrototypeOf) {
		if(Object.defineProperty && typeof Object.__proto__ === "function") {
			Object.defineProperty(Object, "setPrototypeOf", {
				value: function setPrototypeOf(obj, parentProto) {
					obj.__proto__ = parentProto;
				},
				writable: true,
				configurable: true
			});
		} else
		if(typeof Object.__proto__ === "function") {
			Object.setPrototypeOf = function(obj, parentProto) {
				obj.__proto__ = parentProto;
			};
		} else {
			Object.setPrototypeOf = function(obj, parentProto) {
				for (var prop in parentProto) {
					if( Array.isArray(parentProto[prop]) ) {
						obj[prop] = [].concat( parentProto[prop] );
					} else
					if(typeof parentProto[prop] === "object") {
						obj[prop] = Object.assign({}, parentProto[prop]);
					} else {
						obj[prop] = parentProto[prop];
					}
				}
				return obj;
			};
		}
	}
	
	if(!Object.getPrototypeOf) {
		if(Object.defineProperty && typeof Object.__proto__ === "function") {
			Object.defineProperty(Object, "getPrototypeOf", {
				value: function getPrototypeOf(obj) {
					return obj.__proto__;
				},
				writable: true,
				configurable: true
			});
		} else
		if(typeof Object.__proto__ === "function") {
			Object.getPrototypeOf = function(obj) {
				return obj.__proto__;
			};
		} else {
			Object.getPrototypeOf = function(obj) {
				return false;
			};
		}
	}
	
	if (!Array.prototype.indexOf) {	// LTE IE8
		Array.prototype.indexOf = function (searchElement /*, fromIndex */ ) {
			if (this === null) {
				throw new TypeError();
			}
			
			var t = Object(this);
			var len = t.length >>> 0;
			
			if (len === 0) {
				return -1;
			}
			
			var n = 0;
			
			if (arguments.length > 0) {
				n = Number(arguments[1]);
				
				if (n != n) { // shortcut for verifying if it's NaN
					n = 0;
				} else if (n !== 0 && n != Infinity && n != -Infinity) {
					 n = (n > 0 || -1) * Math.floor(Math.abs(n));
				}
			}
			
			if (n >= len) {
				return -1;
			}
			
			var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);
			
			for (; k < len; k++) {
				if (k in t && t[k] === searchElement) {
					return k;
				}
			}
			return -1;
		};
	}
	
	if (!Array.prototype.lastIndexOf) {	// LTE IE8
		Array.prototype.lastIndexOf = function(searchElement /*, fromIndex*/) {
			if (this === null)
				throw new TypeError();
			
			var t = Object(this),
					len = t.length >>> 0;
			if (len === 0) return -1;
			
			var n = len;
			if (arguments.length > 1) {
				n = Number(arguments[1]);
				if(n != n) {
					n = 0;
				} else if(n !== 0 && n !== (1 / 0) && n !== -(1 / 0)) {
					n = (n > 0 || -1) * Math.floor(Math.abs(n));
				}
			}
			
			var k = (n >= 0) ? Math.min(n, len - 1) : len - Math.abs(n);
			
			for (; k >= 0; k--) {
				if (k in t && t[k] === searchElement)
					return k;
			}
			return -1;
		};
	}
	
	if (!Array.prototype.forEach) {
		Array.prototype.forEach = function forEach( callback, thisArg ) {
			
			var T, k;
			
			if ( this === null ) {
				throw new TypeError( "this is null or not defined" );
			}
			
			// 1. Let O be the result of calling ToObject passing the |this| value as the argument.
			var O = Object(this);
			
			// 2. Let lenValue be the result of calling the Get internal method of O with the argument "length".
			// 3. Let len be ToUint32(lenValue).
			var len = O.length >>> 0; // Hack to convert O.length to a UInt32
			
			// 4. If IsCallable(callback) is false, throw a TypeError exception.
			// See: http://es5.github.com/#x9.11
			if ( {}.toString.call(callback) !== "[object Function]" ) {
				throw new TypeError( callback + " is not a function" );
			}
			
			// 5. If thisArg was supplied, let T be thisArg; else let T be undefined.
			if ( thisArg ) {
				T = thisArg;
			}
			
			// 6. Let k be 0
			k = 0;
			
			// 7. Repeat, while k < len
			while( k < len ) {
				
				var kValue;
				
				// a. Let Pk be ToString(k).
				//	 This is implicit for LHS operands of the in operator
				// b. Let kPresent be the result of calling the HasProperty internal method of O with argument Pk.
				//	 This step can be combined with c
				// c. If kPresent is true, then
				if ( Object.prototype.hasOwnProperty.call(O, k) ) {
					
					// i. Let kValue be the result of calling the Get internal method of O with argument Pk.
					kValue = O[ k ];
					
					// ii. Call the Call internal method of callback with T as the this value and
					// argument list containing kValue, k, and O.
					callback.call( T, kValue, k, O );
				}
				// d. Increase k by 1.
				k++;
			}
			// 8. return undefined
		};
	}
	
	if (!Array.prototype.map) {
		Array.prototype.map = function(callback, thisArg) {
			
			var T, A, k;
			
			if (this === null) {
				throw new TypeError(" this is null or not defined");
			}
			
			// 1. Let O be the result of calling ToObject passing the |this| value as the argument.
			var O = Object(this);
			
			// 2. Let lenValue be the result of calling the Get internal method of O with the argument "length".
			// 3. Let len be ToUint32(lenValue).
			var len = O.length >>> 0;
			
			// 4. If IsCallable(callback) is false, throw a TypeError exception.
			// See: http://es5.github.com/#x9.11
			if ({}.toString.call(callback) != "[object Function]") {
				throw new TypeError(callback + " is not a function");
			}
			
			// 5. If thisArg was supplied, let T be thisArg; else let T be undefined.
			if (thisArg) {
				T = thisArg;
			}
			
			// 6. Let A be a new array created as if by the expression new Array(len) where Array is
			// the standard built-in constructor with that name and len is the value of len.
			A = new Array(len);
			
			// 7. Let k be 0
			k = 0;
			
			// 8. Repeat, while k < len
			while(k < len) {
				
				var kValue, mappedValue;
				
				// a. Let Pk be ToString(k).
				//	 This is implicit for LHS operands of the in operator
				// b. Let kPresent be the result of calling the HasProperty internal method of O with argument Pk.
				//	 This step can be combined with c
				// c. If kPresent is true, then
				if (k in O) {
					
					// i. Let kValue be the result of calling the Get internal method of O with argument Pk.
					kValue = O[ k ];
					
					// ii. Let mappedValue be the result of calling the Call internal method of callback
					// with T as the this value and argument list containing kValue, k, and O.
					mappedValue = callback.call(T, kValue, k, O);
					
					// iii. Call the DefineOwnProperty internal method of A with arguments
					// Pk, Property Descriptor {Value: mappedValue, Writable: true, Enumerable: true, Configurable: true},
					// and false.
					
					// In browsers that support Object.defineProperty, use the following:
					// Object.defineProperty(A, Pk, { value: mappedValue, writable: true, enumerable: true, configurable: true });
					
					// For best browser support, use the following:
					A[ k ] = mappedValue;
				}
				// d. Increase k by 1.
				k++;
			}
			
			// 9. return A
			return A;
		};
	}
	
	if (!Array.prototype.filter) {
		Array.prototype.filter = function(fun /*, thisp */) {
			if (this === null) throw new TypeError();
			var t = Object(this),
					len = t.length >>> 0;
			
			if (typeof fun != "function") throw new TypeError();
			var res = [],
					thisp = arguments[1];
			
			for (var i = 0; i < len; i++) {
				if (i in t) {
					var val = t[i]; // fun が this を変化させた場合に備えて
					if (fun.call(thisp, val, i, t)) res.push(val);
				}
			}
			
			return res;
		};
	}
	
	if(!Array.isArray) {	// LTE IE8
		Array.isArray = function (obj) {
			return Object.prototype.toString.call(obj) === "[object Array]";
		};
	}
	
	if(!String.prototype.trim) {
		String.prototype.trim = function () {
			return this.replace(/^\s+|\s+$/g, "");
		};
	}
	
	if(!Date.now) {
		Date.now = function () {
			return new Date().getTime();
		};
	}
	
	if(!location.origin) {	// LTE IE10
		location.origin = location.protocol + "\/\/" + location.hostname;
	}
	
	if(!window.console) {
		window.console = {};
	}
})();