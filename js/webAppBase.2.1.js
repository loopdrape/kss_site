;(function() {
	"use strict";
	var ver = "2.1";
	
	//////////////////
	// define Klass // Class処理用関数
	//////////////////
	window.Klass = (function() {
		var Core, Klass, k;
		
		// **** define core class ****
		Core = function() {};
		
		// [core prototype]
		Core.prototype = {
			isObject: function(obj) {
				return ( typeof obj === "object" && !Array.isArray(obj) );
			},
			isArray: function(arr) {
				return Array.isArray(arr);
			},
			isString: function(str) {
				return (typeof str === "string");
			},
			isNumber: function(num) {
				return (typeof num === "number");
			},
			isInteger: function(num) {
				return (this.isNumber(num) && Math.round(num) === num);
			},
			isFunction: function(fn) {
				return (typeof fn === "function");
			},
			isElement: function(obj) {
				try {
					//Using W3 DOM2 (works for FF, Opera and Chrom)
					return obj instanceof HTMLElement;
				} catch(e) {
					//Browsers not supporting W3 DOM2 don't have HTMLElement and
					//an exception is thrown and we end up here. Testing some
					//properties that all elements have. (works on IE7)
					return (typeof obj === "object") &&
						(obj.nodeType === 1) &&
						(typeof obj.style === "object") &&
						(typeof obj.ownerDocument === "object");
				}
			}
		};
		
		// **** define Klass function ****
		Klass = function(klassName) {
			if(klassName === undefined) {
				return Object.assign({}, window.Klass._klassMap);
			} else
			if( !window.Klass.isString(klassName) ) {
				throw new TypeError("arguments[0] must be string.");
			}
			
			return window.Klass._klassMap[klassName];
		};
		
		// ** static functions **
		for(k in Core.prototype) {
			Klass[k] = Core.prototype[k];
		}
		
		// [prototype継承用関数] (via. http://qiita.com/LightSpeedC/items/d307d809ecf2710bd957)
		Klass.inherits = function(ctor, superCtor) {
			if(ctor === undefined || ctor === null) {
				throw new TypeError("The constructor to `inherits` must not be null or undefined.");
			}
			if(superCtor === undefined || superCtor === null) {
				throw new TypeError("The super constructor to `inherits` must not be null or undefined.");
			}
			if(superCtor.prototype === undefined) {
				throw new TypeError("The super constructor to `inherits` must have a prototype.");
			}
			ctor.super_ = superCtor;
			if(typeof Object.__proto__ === "function") {
				Object.setPrototypeOf(ctor.prototype, superCtor.prototype);
			} else {
				this.goog.inherits(ctor, superCtor);
			}
			return this;
		};
		
		if( !Klass.isFunction(Object.__proto__) ) {	// ** for legacy browser **
			Klass.goog = {	// via. Google Closure
				inherits: function(childCtor, parentCtor) {
					/** @constructor */
					function tempCtor() {}
					tempCtor.prototype = parentCtor.prototype;
					childCtor.superClass_ = parentCtor.prototype;
					childCtor.prototype = new tempCtor();
					/** @override */
					childCtor.prototype.constructor = childCtor;
				}
			};
		}
		
		// [作成したClassのリスト領域]
		Klass._klassMap = {
			"Klass": Core
		};
		Core.prototype.klass = "Klass";
		
		// [Class継承関数]
		Klass.extends_ = function(Ctor, parentName, prop) {	// 'extends'はIEで予約語になっているため使用不可
			var Parent;
			if( !this.isString(parentName) ) {
				throw new TypeError("arguments[1] must be string.");
			}
			
			Parent = this._klassMap[parentName];
			if(!Parent) {
				throw new Error("'" + parentName + "' is undefined.");
			}
			
			// prototype継承
			this.inherits(Ctor, Parent);
			Ctor.parent = Parent.prototype;
			
			// propで渡された属性値の反映
			this.isObject(prop) && Object.keys(prop).forEach(function(k) {
				Ctor.prototype[k] = this[k];
			}, prop);
			
			return Ctor;
		};
		
		// [Class生成関数]
		Klass.create = function(klassName, prop) {
			var Ctor;
			if( !this.isString(klassName) ) {
				throw new TypeError("arguments[0] must be string.");
			}
			if(this._klassMap[klassName]) {
				throw new Error("'" + klassName + "' is already defined.");
			}
			
			this.isObject(prop) || (prop = {});
			
			Ctor = function() {
				this._initialize.apply(this, arguments);
			};
			// コンストラクタへextends_関数を登録
			Ctor.extends_ = function(parentName, prop) {
				return window.Klass.extends_(this, parentName, prop);
			};
			this._klassMap[klassName] = Ctor;
			if( Object.keys(prop).length ) {
				!prop._initialize && (prop._initialize = function() {});
				// コアClassから継承
				this.extends_(Ctor, "Klass", prop);
			}
			Ctor.prototype.klass = klassName;
			return Ctor;
		};
		
		// [インスタンス生成関数]
		Klass.new_ = function(klassName) {	// 'new'はIEで予約語になっているため使用不可
			var args = Array.prototype.slice.call(arguments, 0);
			if( !this.isString(klassName) ) {
				throw new TypeError("arguments[0] must be string.");
			}
			args[0] = this(klassName);
			return new ( Function.prototype.bind.apply(args[0], args) )();
		};
		
		return Klass;
	})();
	
	////////////////
	// Klass Console //
	////////////////
	window.Klass.create("Console", {
		// [constructor]
		_initialize: function() {
			// default methods [log, warn]
			return this.off("log").off("warn");
		},
		colors: {
			blue: "#0862b1",
			green: "#0c861a",
			orange: "#de6d0b",
			red: "#e2291e",
			purple: "#920ea5",
			gray: "#aaa",
			grey: "#aaa"
		},
		_attachColors: function(method, isOn) {
			var
				func = this[method],
				isIE = window.Klass("Console").browser[0] === "ie";
			
			Object.keys(this.colors).forEach(function(k) {
				if(isOn) {
					if(isIE) {
						func[k] = console[method].bind(console);
					} else {
						func[k] = console[method].bind(console, "%c%s", "color:" + this[k] + ";");
					}
				} else {
					func[k] = function() {};
				}
			}, this.colors);
			return this;
		},
		on: function(method) {
			if( !this.isString(method) ) {
				throw new TypeError("arguments[0] must be string.");
			}
			if( this.isFunction(console[method]) ) {
				this[method] = console[method].bind(console);
				if(["log", "warn"].indexOf(method) >= 0) {
					this._attachColors(method, true);
				}
			} else {
				this.off(method);
			}
			return this;
		},
		off: function(method) {
			if( !this.isString(method) ) {
				throw new TypeError("arguments[0] must be string.");
			}
			this[method] = function() {};
			if(["log", "warn"].indexOf(method) >= 0) {
				this._attachColors(method, false);
			}
			return this;
		}
	});
	
	// [add static var]
	(function(Console) {
		// [browser info]
		Console.browser = (function() {
			var
				ua = window.navigator.userAgent.toLowerCase(),
				ver = window.navigator.appVersion.toLowerCase(),
				arr = [];
			
			if(ua.indexOf("msie") != -1) {
				arr.push("ie");
				
				if(ver.indexOf("msie 10.") != -1) {
					arr.push(10);
				} else
				if(ver.indexOf("msie 9.") != -1) {
					arr.push(9);
				} else {
					arr.push(8);
					arr.push("under");
				}
			} else
			if(ua.indexOf("trident") != -1) {
				arr.push("ie");
				arr.push(11);
				arr.push("over");
				
			} else if (ua.indexOf("chrome") != -1) {
				arr.push("chrome");
				
			} else if (ua.indexOf("safari") != -1) {
				arr.push("safari");
				
			} else if (ua.indexOf("opera") != -1) {
				arr.push("opera");
				
			} else if (ua.indexOf("firefox") != -1) {
				arr.push("firefox");
			}
			return arr;
		})();
		
		// [device info]
		Console.device = (function() {
			var
				ua = window.navigator.userAgent.toLowerCase(),
				arr = ["pc"];
			
			if(	ua.indexOf('iphone') !== -1 ||
					ua.indexOf('ipad') !== -1 ||
					ua.indexOf('ipod') !== -1) {
				arr[0] = "sp";
				arr.push("ios");
			} else
			if(	 ua.indexOf('android ') !== -1) {
				arr[0] = "sp";
				arr.push("android");
			} else
			if(	 ua.indexOf('windows phone ') !== -1 ) {
				arr[0] = "sp";
				arr.push("windows");
			}
			
			return arr;
		})();
	})( window.Klass("Console") );
	
	// **** define csl ****
	window.csl = window.Klass.new_("Console");
	
	
	//////////////////////
	// Klass WebAppBase //
	//////////////////////
	window.WebAppBase = window.Klass.create("WebAppBase", {
		_ver: ver,
		name: "",
		ACTION_URL:  "",
		_environment: "",
		_GET: {},
		browser: window.Klass("Console").browser,
		device: window.Klass("Console").device,
		
		// [constructor]
		_initialize: function(str, rootdir) {
			if( this.isString(str) ) {
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
				if( this.isString(rootdir) ) {
					idx = arr.lastIndexOf(rootdir);
					this._environment = "prod";
				}
				
				this.config.rootpath = arr.slice(0, idx + 1).join("/") + "/";
				this.config.rootdir = arr[idx];
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
		cnLog: function() {	// for legacy (LT version 2.0)
			return window.csl.log.apply(this, arguments);
		},
		cnWarn: function() {	// for legacy (LT version 2.0)
			return window.csl.warn.apply(this, arguments);
		},
		
		// **** base param & metohds ****
		enablePushState: (history && history.pushState && history.state !== undefined) ? true : false,
		pushState: function(dataObj, url) {
			if(this.enablePushState) {
				try {
					history.pushState(dataObj, this.name, url);
				} catch(e) {
					csl.warn("history.pushState", e);
					return false;
				}
				
				return this;
			}
			return false;
		},
		replaceState: function(dataObj, url) {
			if(this.enablePushState) {
				try {
					history.replaceState(dataObj, this.name, url);
				} catch(e) {
					csl.warn("history.replaceState", e);
					return false;
				}
					
				return this;
			}
			return false;
		},
		getVersion: function() {
			return this._ver;
		},
		ajaxErrorCallback: function(XMLHttpRequest, textStatus, errorThrown) {
			(this instanceof window.WebAppBase && this._environment !== "prod") && csl.warn(
				"通信失敗",
				XMLHttpRequest.responseText,
				XMLHttpRequest.status,
				textStatus,
				errorThrown.message
			);
			var msg = "サーバーとの通信に失敗しました";
			msg += "<br><b>Status</b>: " + XMLHttpRequest.status;
			(textStatus) && (msg += " (" + textStatus + ")");
			if(this._environment !== "prod") {
				(XMLHttpRequest.responseText) && (msg += "<br>" + XMLHttpRequest.responseText);
				(errorThrown.message) && (msg += "<br><br><b>Error message</b>: " + errorThrown.message);
			}
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
		hasHalfKana: function(str) {
			if( !this.isString(str) ) {
				csl.warn("hasHalfKana", "arguments[0] must be string.");
				return false;
			}
			
			return (/[ｦｧ-ｯｰｱ-ﾝﾞﾟ]/).test(str);
		},
		hasHalfChar: function(str, denyHalfKana) {
			if( !this.isString(str) ) {
				csl.warn("hasHalfChar", "arguments[0] must be string.");
				return false;
			}
			
			this.isNumber(denyHalfKana) || (denyHalfKana = 0);
			if( !denyHalfKana && this.hasHalfKana(str) ) {
				return true;
			}
			
			var c, i, len = str.length, re = /[｡｢｣､･]/;
			for(i = 0; i < len; i++) {
				c = str.charAt(i);
				// 1文字ずつ文字コードをエスケープし、その長さが4文字+2文字(%u)未満なら半角
				if( window.escape(c).length < 6 || re.test(c) ) {
					return true;
				}
			}
			return false;
		},
		hasFullChar: function(str) {
			if( !this.isString(str) ) {
				csl.warn("hasFullChar", "arguments[0] must be string.");
				return false;
			}
			
			var c, i, len = str.length, re = /[｡｢｣､･]/, flg = 0;
			for(i = 0; i < len; i++) {
				c = str.charAt(i);
				// 1文字ずつ文字コードをエスケープし、その長さが4文字+2文字(%u)以上なら全角
				if( window.escape(c).length >= 6 && !re.test(c) && !this.hasHalfKana(c) ) {
					return true;
				}
			}
			return false;
		},
		fileSizeToString: function(fsize) {
			if( !this.isNumber(fsize) ) {
				csl.warn("pathInfo", "arguments[0] must be number.");
				return false;
			}
			
			var fstr = fsize / 1024;
			if(fstr >= 1024) {
				fstr = fstr / 1024;
				if(fstr >= 1024) {
					fstr = String( Math.ceil(fstr / 1024) ) + "GB";
				} else {
					fstr = String( Math.ceil(fstr) ) + "MB";
				}
			} else {
				fstr = String( Math.ceil(fstr) ) + "KB";
			}
			return fstr;
		},
		pathInfo: function(path) {
			if( !this.isString(path) ) {
				csl.warn("pathInfo", "arguments[0] must be string.");
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
			if( !this.isString(str) || !this.isString(path) ) {
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
			if( !this.isString(search) ) {
				csl.warn("parseQueryString", "arguments[0] must be string.");
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
				csl.warn("createQueryString", "arguments[0] must be object.");
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
			if( !this.isString(str) ) {
				csl.warn("textareaParse", "arguments[0] must be string.");
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
		// 画像のプリロード関数
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
		
		// [scroll position]
		_scrollTop: 0,
		saveScroll: function(param) {
			this.isNumber(param) || (param = window.pageYOffset);
			this._scrollTop = param;
			return this;
		},
		loadScroll: function() {
			window.scrollTo(window.pageXOffset, this._scrollTop);
			return this;
		},
		setScroll: function(param) {
			if( this.isNumber(param) ) {
				window.scrollTo(window.pageXOffset, param);
			} else {
				csl.warn(String(param) + "isn't Number.");
			}
			return this;
		},
		
		// [RFC encode / decode]
		encodeRFC: function(str) {
			return encodeURIComponent(str).replace(/%20/g, "+");
		},
		decodeRFC: function(str) {
			return decodeURIComponent( str.replace(/\+/g, "%20") );
		},
		
		// [create Instance metod]
		newCall: function(Func) {
			return new ( Function.prototype.bind.apply(Func, arguments) )();
		}
	});
	
})();