;(function() {
	"use strict";
	
	// 定義
	function WebAppBase() {
		this._initialize.apply(this, arguments);
	}
	
	var proto = WebAppBase.prototype = {
		_ver: "1.1.2",
		name: "",
		ACTION_URL:  "",
		_environment: "",
		_GET: {},
		
		// [constructor]
		_initialize: function(str, rootdir) {
			if(typeof str === "string") {
				if(str.slice(0, 4) === "http" ||
					 str.slice(0, 1) === "." ||
					 str.slice(0, 1) === "/") {
					this.ACTION_URL = str;
				} else {
					this.name = str;
				}
			} else
			if(typeof str === "object" && !rootdir) {
				rootdir = str;
			}
			
			this.URL = location.origin + location.pathname;
			this._GET = this.parseQueryString(window.location.search);
			this.browser = this.__getBrowser();
			this.device = this.__getDevice();
			this.config = {};
			
			// set rootpath
			rootdir || (rootdir = location.host);
			(function() {
				var arr, idx;
				arr = this.URL.split("/");
				
				if(typeof rootdir === "object") {
					rootdir.dev || (rootdir.dev = "dev");
					rootdir.test || (rootdir.test = "test");
					rootdir.prod || (rootdir.prod = location.host);
					
					idx = arr.lastIndexOf(rootdir.dev);
					this._environment = "dev";
					if(idx < 0) {
						idx = arr.lastIndexOf(rootdir.test);
						this._environment = "test";
						if(idx < 0) {
							idx = arr.lastIndexOf(rootdir.prod);
							this._environment = "prod";
						}
					}
					
				} else
				if(typeof rootdir === "string") {
					idx = arr.lastIndexOf(rootdir);
					this._environment = "prod";
				}
				
				this.config.rootpath = arr.slice(0, idx + 1).join("/") + "/";
			}).call(this);
			
			// set relativePath
			this.config.rootpath && (function() {
				var t = {}, i;
				t.pageDirLv = this.URL.replace(this.config.rootpath, "").split("/").length;
				if(t.pageDirLv === 1) {
					this._relativePath = ".";
					
				} else {
					t.arr = [];
					t.len = t.pageDirLv - 1;
					for(i = 0; i < t.len; i++) {
						t.arr.push("..");
					}
					this._relativePath = t.arr.join("/");
				}
			}).call(this);
		},
		
		// **** methods for log ****
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
		
		// **** base param & metohds ****
		enablePushState: (history && history.pushState) ? true : false,
		getVersion: function() {
			return this._ver;
		},
		__getBrowser: function() {
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
			} else
			if(ua.indexOf("trident") != -1) {
				name.push("ie");
				name.push("11");
				name.push("over");
				
			} else if (ua.indexOf("chrome") != -1) {
				name.push("chrome");
				
			} else if (ua.indexOf("safari") != -1) {
				name.push("safari");
				
			} else if (ua.indexOf("opera") != -1) {
				name.push("opera");
				
			} else if (ua.indexOf("firefox") != -1) {
				name.push("firefox");
			}
			return name;
		},
		__getDevice: function() {
			var
				ua = window.navigator.userAgent.toLowerCase(),
				device = ["pc"];
			
			if(	ua.indexOf('iphone') !== -1 ||
					ua.indexOf('ipad') !== -1 ||
					ua.indexOf('ipod') !== -1) {
				device[0] = "sp";
				device.push("ios");
			} else
			if(	 ua.indexOf('android ') !== -1) {
				device[0] = "sp";
				device.push("android");
			} else
			if(	 ua.indexOf('windows phone ') !== -1 ) {
				device[0] = "sp";
				device.push("windows");
			}
			
			return device;
		},
		ajaxErrorCallback: function(XMLHttpRequest, textStatus, errorThrown) {
			(this instanceof WebAppBase) && this.cnWarn(
				"通信失敗",
				XMLHttpRequest.responseText,
				XMLHttpRequest.status,
				textStatus,
				errorThrown.message
			);
			var msg = "サーバーとの通信に失敗しました" + XMLHttpRequest.responseText +
								"<br><b>Status</b>: " + XMLHttpRequest.status;
			(textStatus) && (msg += " (" + textStatus + ")");
			(errorThrown.message) && (msg += "<br><br><b>Error message</b>: " + errorThrown.message);
			return msg;
		},
		
		// **** utility ****
		zeroPadding: function(num, length) {
/* IE8で異なる動作をするため×
			return num.toLocaleString( "ja-JP", {
				useGrouping: false,
				minimumIntegerDigits: length
			});
*/
			return (new Array(length).join("0") + num).slice(-length);
		},
		isInteger: function(num) {
			return (typeof num === "number" && Math.round(num) === num);
		},
		isFunction: function(fn) {
			return (typeof fn === "function");
		},
		pathInfo: function(path) {
			if(typeof path !== "string") {
				this.cnWarn("pathInfo", "arguments[0] must be string.");
				return false;
			}
			
			var t = {
				_a: document.createElement("a")
			};
			
			t._a.href = path || "./";
			path = path.replace(t._a.search, "").replace(t._a.hash, "");
			
			t.delimiter = (new RegExp("/").exec(path)) ? "/" : "\\",
			t.pathParts = path.split(t.delimiter),
			t.basename = t.pathParts.slice(-1)[0],
			t.arr = t.basename.split(".");
			t.idx = t.arr.length - 1;
			
			return {
				dirname: t.pathParts.slice(0, -1).join("/"),
				basename: t.basename,
				extension: (t.arr.length > 1) ? t.arr[t.idx] : "",
				filename: t.arr.slice(0, t.idx).join("."),
				search: t._a.search,
				hash: t._a.hash
			};
		},
		/**
		* 第1引数の文字列内の{dirname}, {basename}, {extension}, {filename}を置換
		* @param [String] str: 置換対象の文字列
		* @param [String] path: ファイルのパス
		* @return [String]
		*/
		replacePathinfo: function(str, path) {
			if(typeof str !== "string" || typeof path !== "string") {
				return str;
			}
			var pathInfo = this.pathInfo(path);
			str = str.replace(/\{dirname\}/g, pathInfo.dirname);
			str = str.replace(/\{basename\}/g, pathInfo.basename);
			str = str.replace(/\{extension\}/g, pathInfo.extension);
			str = str.replace(/\{filename\}/g, pathInfo.filename);
			return str;
		},
		parseQueryString: function(search) {
			if(typeof search !== "string") {
				this.cnWarn("parseQueryString", "arguments[0] must be string.");
				return false;
			}
			
			var
				obj = {},
				query, i, j, tmp;
			
			// searchがURL形式じゃない場合の対処
			(search.indexOf("?") < 0) && (search = "?" + search);
			
			// urlのsearch部分を取得
			query = this.pathInfo(search).search;
			
			// 最初に出現する?は取り除く
			query = query.replace(/^\?/, "");
			
			if(query) {
				query = query.split("&");
				for(i = 0; i < query.length; i++) {
					tmp = query[i].split("=");
					for(j = 0; j < tmp.length; j++) {
						tmp[j] = decodeURIComponent(tmp[j]);
					}
					
					obj[tmp[0]] = tmp.slice(1).join("=");
				}
			}
			
			return obj;
		},
		createQueryString: function(obj) {
			if(typeof obj !== "object") {
				this.cnWarn("createQueryString", "arguments[0] must be object.");
				return false;
			}
			
			var
				query = "",
				arr = [],
				k;
			
			for(k in obj) {
				arr.push(k + "=" + encodeURIComponent(obj[k]));
			}
			
			if(arr.length) {
				query = "?" + arr.join("&");
			}
			
			return query;
		},
		textareaParse: function(str, isBlock) {
			if(typeof str !== "string") {
				this.cnWarn("textareaParse", "arguments[0] must be string.");
				return false;
			}
			(typeof isBlock === "boolean") || (isBlock = false);
			
			var
				arr = str.split(/\r\n|\r|\n/),	// 改行コードで分割
				len = arr.length,
				txts = [],
				elm = document.createElement( isBlock ? "p" : "span"),
				i;
			
			for(i = 0; i < len; i++) {
				(arr[i]) || (arr[i] = "&nbsp;");
				elm.innerHTML = arr[i];
				txts.push( elm.outerHTML );
			}
			
			return txts.join( isBlock ? "" : "<br/>");
		},
		// 画像のプリロード
		preloadedImgs: {},
		imgPreload: function(src, cb) {
			var
				_self = this,
				loadedImgs = this.preloadedImgs,
				img = new Image();
			
			img.src = src;
			img.onerror = function(e) {
				_self.cnWarn("preload error: " + src);
				cb(false, src, img, e);
			};
			img.onload = function(e) {
				loadedImgs[src] = img;
				if(typeof cb === "function") {
					cb(true, src, img, e);
				}
			};
		},
		// インスタンス生成
		newCall: function(Func) {
			return new (Function.prototype.bind.apply(Func, arguments))();
		},
		// プロトタイプ継承
		inherits: function(ctor, superCtor) {
			if (ctor === undefined || ctor === null) {
				throw new TypeError("The constructor to `inherits` must not be null or undefined.");
			}
			if (superCtor === undefined || superCtor === null) {
				throw new TypeError("The super constructor to `inherits` must not be null or undefined.");
			}
			if (superCtor.prototype === undefined) {
				throw new TypeError("The super constructor to `inherits` must have a prototype.");
			}
			ctor.super_ = superCtor;
			Object.setPrototypeOf(ctor.prototype, superCtor.prototype);
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
	
	window.WebAppBase = WebAppBase;
	
	// [for IE]
	(function(browser) {
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
		
		if(!Object.setPrototypeOf) {
			if(Object.defineProperty && (browser[0] !== "ie" || parseInt(browser[1]) > 8)) {
				Object.defineProperty(Object, "setPrototypeOf", {
					value: function setPrototypeOf(obj, parentProto) {
						obj.__proto__ = parentProto;
					},
					writable: true,
					configurable: true
				});
			} else {
				Object.setPrototypeOf = function(obj, parentProto) {
					obj.__proto__ = parentProto;
				};
			}
		}
		
		if (!Object.getPrototypeOf) {
			if(Object.defineProperty && (browser[0] !== "ie" || parseInt(browser[1]) > 8)) {
				Object.defineProperty(Object, "getPrototypeOf", {
					value: function getPrototypeOf(obj) {
						return obj.__proto__;
					},
					writable: true,
					configurable: true
				});
			} else {
				Object.getPrototypeOf = function(obj) {
					return obj.__proto__;
				};
			}
		}
		
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
		if(!window.console) {
			window.console = {};
		}
		if (typeof window.console.log !== "function") {
			window.console.log = function() {};
		}
	})( proto.__getBrowser() );
})();