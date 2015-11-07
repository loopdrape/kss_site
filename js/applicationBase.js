;(function() {
	"use strict";
	
	// 定義
	function ApplicationBase() {
		this._initialize.apply(this, arguments);
	}
	
	var proto = ApplicationBase.prototype = {
		_ver: "1.0.1",
		name: "",
		LOG: true,
		cnLog: function() {
			// app.LOGがtrueの時だけconsole.logを出力する
			if(this.LOG && !(this.browser[0] === "ie" && this.browser[1] === "8")) {
				var args = Array.prototype.slice.call(arguments, 0);
				console.log.apply(console, args);
			}
		},
		WARN: true,
		cnWarn: function() {
			// app.WARNがtrueの時だけconsole.warnを出力する
			if(this.WARN && !(this.browser[0] === "ie" && this.browser[1] === "8")) {
				var args = Array.prototype.slice.call(arguments, 0);
				console.warn.apply(console, args);
			}
		},
		URL: "",
		_GET: {},
		ACTION_URL:  "",
		browser: getBrowser(),
		ajaxErrorCallback: function(XMLHttpRequest, textStatus, errorThrown) {
			proto.cnWarn(
				"通信失敗",
				XMLHttpRequest.responseText,
				XMLHttpRequest.status,
				textStatus,
				errorThrown.message
			);
		},
		
		/**** utility ****/
		pathInfo: function(path) {
			if(typeof path !== "string") {
				return false;
			}
			var
				delimiter = (new RegExp("/").exec(path)) ? "/" : "\\",
				pathParts = path.split(delimiter),
				basename = pathParts.slice(-1)[0],
				arr = basename.split(".");
			
			return {
				dirname: pathParts.slice(0, -1).join("/"),
				basename: basename,
				extension: (arr.length > 1) ? arr[1] : "",
				filename: arr[0]
			};
		},
		parseQueryString: function(search) {
			if(typeof search !== "string") {
				return false;
			}
			
			var
				query = decodeURIComponent(search),
				obj = {},
				i, tmp;
			
			// 先頭が"?"であれば取り除く
			if(query.slice(0, 1) === "?") {
				query = query.slice(1);
			}
			
			if(query) {
				query = query.split("&");
				for(i = 0; i < query.length; i++) {
					tmp = query[i].split("=");
					obj[tmp[0]] = tmp[1];
				}
			}
			
			return obj;
		},
		createQueryString: function(obj) {
			if(typeof obj !== "object") {
				return false;
			}
			
			var
				query = "",
				arr = [],
				k;
			
			for(k in obj) {
				arr.push(k + "=" + encodeURIComponent(obj[k]));
			}
			
			if(arr.length > 0) {
				query = "?" + arr.join("&");
			}
			
			return query;
		},
		textareaParse: function(str) {
			var
				arr = str.split(/\r\n|\r|\n/),	// 改行コードで分割
				len = arr.length,
				txts = [],
				span = document.createElement("span"),
				i;
			
			for(i = 0; i < len; i++) {
				span.innerHTML = arr[i];
				txts.push( span.outerHTML );
			}
			
			return txts.join("<br/>");
		},
		// 画像のプリロード
		_loadedImgs: {},
		imgPreload: function(src, cb) {
			var
				loadedImgs = this._loadedImgs,
				img = new Image();
			img.src = src;
			img.onerror = function() {
				proto.cnWarn("preload error: " + src);
			};
			img.onload = function(e) {
				loadedImgs[src] = img;
				if(typeof cb === "function") {
					cb(src, img, e);
				}
			};
		},
	
		// [constructor]
		_initialize: function(arg) {
			if(typeof arg === "string") {
				if(arg.slice(0, 4) === "http" ||
					 arg.slice(0, 1) === "." ||
					 arg.slice(0, 1) === "/") {
					this.ACTION_URL = arg;
				} else {
					this.name = arg;
				}
			}
			
			this.URL = location.origin + location.pathname;
			this._GET = this.parseQueryString(window.location.search);
		}
	};
	
	// [scroll position]
	(function() {
		proto._scrollTop = 0;
		proto.saveScroll = function(param) {
			if(typeof param !== "number") {
				param = window.pageYOffset;
			}
			this._scrollTop = param;
			return this;
		};
		proto.loadScroll = function() {
			window.scrollTo(window.pageXOffset, this._scrollTop);
			return this;
		};
		proto.setScroll = function(param) {
			if(typeof param === "number") {
				window.scrollTo(window.pageXOffset, param);
			} else {
				this.cnWarn(String(param) + "isn't Number.");
			}
			return this;
		};
	})();
	
	window.ApplicationBase = ApplicationBase;
	
	function getBrowser() {
		var
			ua = window.navigator.userAgent.toLowerCase(),
			ver = window.navigator.appVersion.toLowerCase(),
			name = [];
		
		if(ua.indexOf("msie") != -1) {
			name.push("ie");
			if(ver.indexOf("msie 10.") != -1) {
				name.push("10");
			} else
			if(ver.indexOf("msie 9.") != -1) {
				name.push("9");
			} else {
				name.push("8");
				name.push("under");
			}
		}else if(ua.indexOf("trident") != -1){
			name.push("ie");
			name.push("11");
			name.push("over");
		}else if (ua.indexOf("chrome") != -1){
				name.push("chrome");
		}else if (ua.indexOf("safari") != -1){
				name.push("safari");
		}else if (ua.indexOf("opera") != -1){
				name.push("opera");
		}else if (ua.indexOf("firefox") != -1){
				name.push("firefox");
		}
		return name;
	}
	
	Number.zeroPadding = function(num, length){
//		return (new Array(length).join("0") + num).slice(-length);
		return num.toLocaleString( "ja-JP", {
			useGrouping: false,
			minimumIntegerDigits: length
		});
	};
	
	// for IE
	(function() {
		if(!location.origin) {	// LTE IE10
			location.origin = location.protocol + "\/\/" + location.hostname;
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
		
		if(!Object.keys) {	// LTE IE8
			Object.keys = function(obj) {
				return $.map(obj, function(val, key) {
						return key;
				});
			};
		}
		if(!Date.now) {
			Date.now = function () {
				return new Date().getTime();
			};
		}
		if(!window.console) {
			window.console = {};
		}
		if (typeof window.console.log !== "function") {
			window.console.log = function() {};
		}
	})();
})();