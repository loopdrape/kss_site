/*----
* klass.Vuw.js
* DOM操作用ライブラリ
* version: 1.0.0
*
* [history]
* 1.0.0: 新規作成
* 1.0.1: vuwer.add() で子Vuwにcontainerが付与されるタイミングを変更
*/

;(function(Klass, $) {
	"use strict";
	
	// [include check]
	if(!Klass) {
		throw new Error("'Klass' isn't included.");
	}
	if(!$) {
		throw new Error("'jQuery' isn't included.");
	}
	
	///////////////
	// klass Vuw //
	///////////////
	Klass.create("Vuw", {
		// メンバ変数
		_ver: "1.0.1",
		$self: false,
		$template: false,
		
		/**
		* [コンストラクタ]
		* @param opt [object] オプション値
		*/
		_initialize: function(opt) {
			var conf = {	// 設定項目
				/**
				* インスタンス名
				*/
				name: "",
				
				/**
				* selector [string or function]
				* ここで指定したセレクタが、getReady()時に$オブジェクトとして$selfプロパティに格納される
				* （functionを指定する場合は、$オブジェクトを返す様にする）
				* ただし、指定された要素にdata-vuw-template属性が指定されている場合は$templateプロパティ
				* に格納され、body直下のテンプレート配置領域に移動される
				* 元の場所には<var data-vuw="{name}"></var>が配置される
				*/
				selector: "",
				
				/**
				* template生成関数
				* $オブジェクトを返す様にすると、getReady実行後に$templateプロパティに格納される
				*/
				createTemplate: function() {},
				
				/**
				* DOM操作準備関数のコールバック
				* ※非同期対応可
				*/
				onReady: function($self) {},
				
				// DOM操作準備関数のコールバック（必ず最初に実行される） ※非同期対応可
				onReadyFirst: function($self) {},
				// DOM操作準備関数のコールバック（必ず最後に実行される） ※非同期対応可
				onReadyLast: function($self) {},
				
				/**
				* 状態が変化した際のコールバック
				* ※非同期対応可
				*/
				onChangeState: function($self) {},
				
				/**
				* DOM更新用関数
				* $instanceかHTMLElementをreturnすると、selectorで指定した要素（$self）が置き換わる
				* 状態が変化した際（上記onChangeState後）に実行される
				* ※非同期対応不可
				* @param $templateClone [$ instance] $templateから生成したクローン
				*/
				render: function($templateClone) {},
				
				/**
				* renderの完了コールバック
				* @param renderedElm [$instance || HTMLElement] render関数で返されたデータ
				*/
				renderComplete: function(renderedElm) {}
			};
			
			conf = this.isObject(opt) ? opt : {};
			
			// nameが未指定の場合は現在時間から生成
			!conf.name && ( conf.name = String( ( new Date() ).valueOf() ) );
			
			this.isReady = false;
			this.state = {};		// 状態オブジェクト
			this._onReadyCallbacks = [];		// onReady用
			this._onChangeStateCallbacks = [];		// onChangeState用
			this._stateBooked = {};		// _bookState用
			this._stateBookedCBs = [];		// _bookState用
			
			return this.setProp(conf);
		},
		
		/**
		* 自要素のゲッター
		* @param k [string] プロパティ名
		*/
		getProp: function(k) {
			return this.hasOwnProperty(k) ? this[k] : undefined;
		},
		
		/**
		* 自要素のセッター
		* @param k [string || object] objectの場合は自身にマージされる
		* @param v [everything] kがstringの場合、値として登録される
		* @param (optional) isOverride [boolean] true: 既に存在していた場合に上書きを行う
		* ※第１引数：kがobjectの場合、第２引数をisOverrideとみなします
		* @return this
		*/
		setProp: function(k, v, isOverride) {
			if(k) {
				if( this.isString(k) ) {
					this._setProp(k, v, !!isOverride);
				} else
				if( this.isObject(k) ) {
					isOverride = (v === true);
					
					// 第１引数にobjectが指定された場合、onReadyとonChangeStateは上書きではなく追加とする
					if(k.onReady) {
						this.onReady(k.onReady);
						delete k.onReady;
					}
					if(k.onChangeState) {
						this.onChangeState(k.onChangeState);
						delete k.onChangeState;
					}
					
					Object.keys(k).forEach(function(prop) {
						this._setProp(prop, k[prop], isOverride);
					}, this);
				}
			} else {
				csl.warn((this.name || "Vuw") + ".setProp() ... arguments[0] is required.");
			}
			return this;
		},
		
		_setProp: function(k, v, isOverride) {
			if( this.hasOwnProperty(k) && !isOverride ) {
				csl.warn((this.name || "Vuw") + ".setProp() ... '" + k + "' is already defined.");
			} else {
				this[k] = v;
			}
			return this;
		},
		
		/**
		* テンプレート退避領域の登録先
		*/
		_templateAreaPropTo: "_tmp",
		
		/**
		* テンプレート退避領域の取得
		* @param (optional) as$ [boolean] falseの場合にHTMLElementとして返す
		* @return $ instance || HTMLElement
		*/
		getTemplateArea: function(as$) {
			if(!Klass("Vuw")._$templateArea) {
				// [create _$templateArea]
				Klass("Vuw")._$templateArea = $("<div/>").addClass("vuw-template-area").hide()
				.appendTo(document.body);
			}
			return (as$ === false) ? Klass("Vuw")._$templateArea.get(0) : Klass("Vuw")._$templateArea;
		},
		
		/**
		* DOM操作準備関数
		* （documentの読み込み後に実行すること）
		* @return $.Deferred().promise()
		*/
		getReady: function() {
			var df = $.Deferred();
			
			if(this.isReady) {
				csl.log("** " + this.name +  ".getReady() is already executed.");
				df.resolve();
			} else
			if(this.isGettingReady) {
				csl.log("** " + this.name +  " is getting ready now...");
				df.resolve();
			} else {
				
				this.isGettingReady = true;
				
				// selectorから$selfないし$templateを生成
				!!this.selector && (function() {
					var $elm;
					if( this.isString(this.selector) ) {
						$elm = $(this.selector);
					} else
					if( this.isFunction(this.selector) ) {
						$elm = this.selector.call(this);
					}
					
					if($elm && $elm instanceof $ && $elm.length) {
						if( $elm.attr("data-vuw-template") !== undefined ) {
							// data-vuw-template属性がある場合はテンプレートとみなし、$templateプロパティに格納
							this.$template = $elm;
							// 代替要素を配置し、$selfプロパティに格納
							$elm = $("<var/>").attr("data-vuw", this.name).insertBefore(this.$template);
							this.$self = $elm;
						} else {
							// $selfプロパティに格納
							this.$self = $elm;
							// イベントのコールバック等で使用できる様に$.dataに自身を登録
							$.data(this.$self.get(0), "vuw", this);
						}
					}
				}).call(this);
				
				// createTemplateが指定されてされている場合、実行して$templateを生成
				this.isFunction(this.createTemplate) && (function() {
					var $elm;
					$elm = this.createTemplate.call(this);
					if($elm && $elm instanceof $ && $elm.length) {
						this.$template = $elm;
					}
				}).call(this);
				
				// $templateが生成されている場合、body直下の専用領域に退避する
				!!this.$template && this.$template.appendTo( this.getTemplateArea() );
				
				// isReady -> ON
				this.isReady = true;
				
				$.when(
					// execute onReadyFirst
					this.isFunction(this.onReadyFirst) && this.onReadyFirst(this.$self, this.$template)
				).then( (function() {
					// コールバックの実行
					var methods = this._onReadyCallbacks.map(function(fn) {
						return fn.call(this, this.$self, this.$template);
					}, this);
					return $.when.apply($, methods);
				}).bind(this) )
				.then( (function() {
					var
						args = Array.prototype.slice.call(arguments, 0),
						d = $.Deferred();
					
					$.when(
						// execute onReadyLast
						this.isFunction(this.onReadyLast) ? this.onReadyLast(this.$self, this.$template) : undefined
					).then( (function() {
						if(arguments.length && arguments[0] !== undefined) {
							args = args.concat( Array.prototype.slice.call(arguments, 0) );
						}
						d.resolve.apply(d, args);
					}).bind(this), d.reject.bind(d) );
					return d.promise();
				}).bind(this) )
				.then( (function() {
					delete this.isGettingReady;
					df.resolve.apply( df, Array.prototype.slice.call(arguments, 0) );
				}).bind(this), df.reject.bind(df) );
			}
			
			return df.promise();
		},
		
		/**
		* DOM操作準備関数のコールバック登録関数
		* @return this
		*/
		onReady: function(fn) {
			if( this.isFunction(fn) ) {
				if(this.isReady) {
					csl.log.gray(this.name + "... isReady to execute.");
					fn.call(this, this.$self, this.$template);
				} else {
					this._onReadyCallbacks.push(fn);
				}
			}
			return this;
		},
		
		/**
		* 状態オブジェクトのゲッター
		* @param (optional) k [string] キー
		* @return キーに紐付いた値
		*/
		getState: function(k) {
			if(!this.isReady) {
				csl.warn(this.name + ".getState() ... getReady() didn't execute yet.");
				return false;
			} else
			if( k && this.isString(k) ) {
				return this.state[k];
			} else {
				return this.state;
			}
		},
		
		/**
		* 状態オブジェクトのセッター
		* （changeStateが実行された後、$selfにchangeイベントがトリガーされます）
		* @param k [string || object] objectの場合は元のデータに置換される
		* @param v [everything] kがstringの場合、値として登録される
		* @return $.Deferred().promise()
		*/
		setState: function(k, v) {
			var
				df = $.Deferred(),
				flg = false,
				isBook = false;
			
			if(!this.isReady) {
				csl.warn(this.name + ".setState() ... getReady() didn't execute yet.");
			} else
			if(k) {
				if( this.isString(k) ) {
					if(this.isChangingState) {
						// [book]
						this._bookState( (function(obj) {
							obj[k] = v;
							return obj;
						})({}), df.resolve.bind(df) );
						isBook = true;
					} else {
						// [state change]
						this.state[k] = v;
						flg = true;
					}
				} else
				if( this.isObject(k) ) {
					if(this.isChangingState) {
						// [book]
						this._bookState( k, df.resolve.bind(df) );
						isBook = true;
					} else {
						// [state change]
						this.state = k;
						flg = true;
					}
				} else {
					csl.warn(this.name + ".setState() ... arguments error.");
				}
			} else {
				csl.warn(this.name + ".setState() ... arguments[0] is required.");
			}
			
			if(flg) {
				// call changeState
				this.changeState()
				.then( (function() {
					df.resolve.apply(df, Array.prototype.slice.call(arguments, 0) );
					!!this.$self && this.$self.trigger("changeState");
					// apply booked (if it has.)
					this._setStateBooked();
				}).bind(this), df.reject.bind(df) );
			} else
			if(!isBook) {
				df.reject();
			}
			return df.promise();
		},
		
		/**
		* 状態が変化の予約関数（setState()でisChangingState: trueの場合に実行される）
		* @return this
		*/
		_bookState: function(state, cb) {
			Object.assign(this._stateBooked, state);
			this._stateBookedCBs.push(cb);
			return this;
		},
		
		/**
		* 状態が変化の予約用コールバックの実行関数
		* @return $.Deferred().promise()
		*/
		_setStateBooked: function() {
			var stateBooked;
			if( !Object.keys(this._stateBooked).length ) {
				return false;
			}
			stateBooked = Object.assign({}, this._stateBooked);
			this._stateBooked = {};
			return this.setState(stateBooked).then( (function() {
				csl.log.gray(this.name + " ... set booked state", Object.assign({
					CB_count: this._stateBookedCBs.length
				}, stateBooked));
				var i, len = this._stateBookedCBs.length;
				if(len) {
					for(i = 0; i < len; i++) {
						this._stateBookedCBs[i]();
					}
					this._stateBookedCBs = [];
				}
			}).bind(this) );
		},
		
		/**
		* 状態が変化した際に呼び出される関数
		* @return $.Deferred().promise()
		*/
		changeState: function() {
			var
				df = $.Deferred(),
				methods;
			
			this.isChangingState = true;
			
			// コールバックの実行
			methods = this._onChangeStateCallbacks.map(function(fn) {
				return fn.call( this, this.state );
			}, this);
			
			$.when.apply($, methods)
			.then( (function() {
				var renderedElm = this._execRender( Array.prototype.slice.call(arguments, 0) );
				this.isChangingState = false;
				df.resolve(renderedElm);
			}).bind(this), function() {
				this.isChangingState = false;
				df.reject.apply(df, Array.prototype.slice(arguments, 0));
			});
			return df.promise();
		},
		
		/**
		* 状態が変化した際のコールバック登録関数
		* @return this
		*/
		onChangeState: function(fn) {
			this.isFunction(fn) && this._onChangeStateCallbacks.push(fn);
			return this;
		},
		
		/**
		* $templateからcloneを生成して返す
		* @return $clone
		*/
		getCloneFromTemplate: function() {
			var $clone = false;
			if(this.$template) {
				$clone = this.$template.clone().attr({
					"id": null,
					"data-vuw-template": null
				}).removeClass("template");
			}
			return $clone;
		},
		
		/**
		* renderの実行関数
		* @return $.Deferred().promise()
		*/
		_execRender: function() {
			var
				args = Array.prototype.slice.call(arguments, 0),
				renderedElm;
			
			args.unshift( this.state );
			args.unshift( this.getCloneFromTemplate() );
			renderedElm = this.render.apply(this, args);
			
			if(this.$self && renderedElm) {
				// render()の戻り値でDOM要素を更新
				if( !(renderedElm instanceof $) &&
						( this.isElement(renderedElm) || this.isString(renderedElm) ) ) {
					renderedElm = $(renderedElm);
				}
				
				if(renderedElm instanceof $ && renderedElm.length) {
					this.$self.replaceWith(renderedElm);
					this.$self = renderedElm;
					$.data(this.$self.get(0), "vuw", this);
					
					// 完了コールバックの実行
					this.isFunction(this.renderComplete) && this.renderComplete(renderedElm);
				}
			}
			
			return renderedElm;
		},
		
		/**
		* DOM更新用関数
		* 状態が変化した際（上記setState後）に実行される
		* returnで$elementを返すと$selfと置き換わる
		* @param $templateClone [$instance] $templateから生成したクローン
		*/
		render: function($templateClone, state) {},
		
		/**
		* renderの完了コールバック
		* @param renderedElm [$instance || HTMLElement] render関数で返されたデータ
		*/
		renderComplete: function(renderedElm) {}
	});
	
	Klass("Vuw").getVersion = function() {
		return this.prototype._ver;
	};
	
	/************************
	* vuwer (Vuw container) *
	************************/
	/**
	* 使用宣言関数
	* （実行するとVuwの格納用Vuwインスタンスとして vuwer がwindow直下に生成される）
	*/
	Klass("Vuw").useVuwer = function() {
		csl.log.gray("** use vuwer (Vuw version:" + this.getVersion() + ") **");
		window.vuwer = Klass.new_("Vuw", {
			name: "vuwer",
			selector: function() {
				return $(window);
			},
			
			_vuwMap: {},
			childKlass: "VuwerComponent",
			
			_getComponentsReady: function() {
				var
					df = $.Deferred(),
					methods;
				
				// add()で追加されたVuwのgetReady()を実行する
				methods = Object.keys(this._vuwMap).map(function(name) {
					var vuw = this._vuwMap[name];
					if(vuw instanceof Klass(this.childKlass) && !vuw.isReady) {
						return vuw.getReady();
					}
				}, this);
				
				$.when.apply($, methods).then( (function() {
					var
						names = Object.keys(this._vuwMap),
						obj = {};
					
					// 各getReady()内でresolveによって渡された値をobjに格納
					Array.prototype.slice.call(arguments, 0).forEach(function(res, i) {
						if( Array.isArray(res) ) {
							res = res.filter(function(arg) {
								return !!arg &&
									(!this.isObject(arg) || Object.keys(arg).length) &&
									(!this.isArray(arg) || arg.length);
							}, this);
							!res.length && (res = undefined);
						}
						
						(res === undefined) || (obj[ names[i] ] = res);
					}, this);
					
					this.isReady = true;
					df.resolve(obj);
				}).bind(this), df.reject.bind(df) );
				
				return df.promise();
			},
			
			onReady: function($self) {
				this.$window = $self;
				return this._getComponentsReady();
			},
			
			/**
			* 子Vuwの追加関数
			* @param name [string] Vuwの名称 （optがVuwインスタンスの場合はvuwerへの登録名)
			* @param (optional) opt [object || Vuw instance] Vuwコンストラクタのオプション || childKlassで指定したKlassのインスタンス
			* @param (optional) callback [function] 追加したVuwに対する処理（this = 追加したVuw）※非同期非対応
			* @param (optional) isOverride [boolean] true: 既に存在していた場合に上書きを行う
			* @return this
			*/
			add: function(name, opt, callback, isOverride) {
				var vuw, klass;
				
				// 第3引数がbooleanの場合の処理
				(typeof callback === "boolean") && (isOverride = callback);
				
				if( !this.isString(name) ) {
					csl.warn.red(this.name + ".add() ... arguments[0] is must be string.", typeof name);
					return this;
				}
				if(name in this._vuwMap && !isOverride) {
					csl.warn(this.name + ".add() ... '" + name + "' is already defined.");
					return this;
				}
				
				if( this.isObject(opt) ) {
					if( opt instanceof Klass(this.childKlass) ) {
						vuw = opt;
					}
				} else {
					opt = {};
				}
					
				if(vuw) {
					vuw.container = this;
				} else {
					Object.assign(opt, {
						name: name,
						container: this
					});
					
					if( opt.vuwType && this.isString(opt.vuwType) ) {
						klass = "Vuw" + opt.vuwType.slice(0, 1).toUpperCase() + opt.vuwType.slice(1);
						if( !this.isFunction( Klass(klass) ) ) {
							klass = this.childKlass;
							opt.vuwType = "component";
						}
					} else {
						klass = this.childKlass;
						opt.vuwType = "component";
					}
					
					vuw = Klass.new_(klass, opt);
				}
				
				this._vuwMap[name] = vuw;
				
				this.isFunction(callback) && callback.call(vuw);
				
				return this;
			},
			
			/**
			* 子Vuwの取得関数
			* @param name [string] Vuwの名称 || アドレス
			* @return Vuw instance || false
			*/
			get: function(name) {
				var i, arr, rtn = false;
				if( !this.isString(name) ) {
					csl.warn(this.name + ".get() ... arguments[0] is must be string.", typeof name);
					return rtn;
				}
				
				rtn = this._vuwMap[name] || false;
				
				if( !rtn && (/\./).test(name) ) {
					// 引数にアドレスを指定した場合
					arr = name.split(".");
					rtn = this._vuwMap[ arr.pop() ] || false;
					for(i = arr.length - 1; i >= 0; i--) {
						if(rtn) {
							if(rtn._vuwMap) {
								rtn = rtn._vuwMap[ arr[i] ] || false;
							} else {
								rtn = false;
								break;
							}
						} else {
							break;
						}
					}
				}
				
				return rtn;
			},
			
			/**
			* 子Vuwリストの取得関数
			* @return array
			*/
			getChildren: function() {
				var list = Object.keys(this._vuwMap).map(function(k) {
					return this[k];
				}, this._vuwMap);
				list.get = function(idx) {
					if( Klass.isNumber(idx) ) {
						return this[idx] || false;
					} else {
						return this;
					}
				};
				return list;
			},
			
			/**
			* 末端階層まで対象にしたVuwリストの取得関数
			* @return array
			*/
			find: function(name) {
				var list = [];
				this.getChildren().forEach(function(vuw) {
					if(vuw.name === name) {
						list.push(vuw);
					}
					list = list.concat( window.vuwer.find.call(vuw, name) );
				}, this);
				list.get = function(idx) {
					if( Klass.isNumber(idx) ) {
						return this[idx] || false;
					} else {
						return this;
					}
				};
				return list;
			},
			
			/**
			* Vuwの削除関数
			* @param name [string] Vuwの名称
			* @return Vuw instance
			*/
			remove: function(name) {
				var vuw;
				if( !this.isString(name) ) {
					csl.warn(this.name + ".remove() ... arguments[0] is must be string.", typeof name);
					return this;
				}
				
				vuw = this.get(name);
				if(!vuw) {
					return this;
				}
				
				(vuw.$self && vuw.$self.length) && vuw.$self.remove();
				(vuw.$template && vuw.$template.length) && vuw.$template.remove();
				delete this._vuwMap[name];
				return this;
			},
			
			/**
			* Class 継承用関数
			* @param name [string] 継承先の登録名称
			* @param (optional) prop [object] 継承先のプロパティ
			* @param (optional) parent [string || function] 継承元の名称 || 継承元Class
			* @return this
			*/
			appendKlass: function(name, prop, parent) {
				if( !this.isString(name) ) {
					csl.warn.red(this.name + ".appendKlass() ... arguments[0] is must be string.", typeof name);
					return this;
				} else
				if( Klass(name) ) {
					csl.warn.red(this.name + ".appendKlass() ... '" + name + "' is already defined.");
					return this;
				}
				
				if( this.isString(parent) ) {
					if( !this.isFunction( Klass(parent) ) ) {
						csl.warn(this.name + ".appendKlass() ... '" + parent + "' is undefined.");
						return this;
					}
				} else {
					// default
					if( !this.isFunction( Klass(this.childKlass) ) ) {
						csl.warn(this.name + ".appendKlass() ... '" + this.childKlass + "' is undefined.");
						return this;
					}
					parent = this.childKlass;
				}
				
				Klass.create(name).extends_(parent, prop);
				return this;
			}
		});
		
		window.vuwer
		/*************************************
		* define VuwerComponent (extends Vuw) *
		*************************************/
		// prototype継承して登録
		.appendKlass("VuwerComponent", {
			childKlass: "VuwerComponent",
			_initialize: function(opt) {
				if( Klass("VuwerComponent").parent._initialize.call(this, opt) ) {
					if(!this.childKlass) {
						csl.warn("VuwerComponent._initialize() ... 'childKlass' is required prop.");
						return false;
					}
					
					if( !this.isString(this.childKlass) || !Klass(this.childKlass) ) {
						csl.warn("VuwerComponent._initialize() ... 'childKlass' is must be Klass.");
						return false;
					}
					
					this._vuwMap = {};
					
					// [push onReady callback]
					this.onReady( window.vuwer._getComponentsReady.bind(this) );
					return this;
					
				} else {
					return false;
				}
			},
			add: function(name) {
				window.vuwer.add.apply( this, Array.prototype.slice.call(arguments, 0) );
				return this;
			},
			get: function(name) {
				return window.vuwer.get.call(this, name);
			},
			getChildren: function() {
				return window.vuwer.getChildren.call(this);
			},
			find: function(name) {
				return window.vuwer.find.call(this, name);
			},
			remove: function(name) {
				var targetVuw = this.get(name);
				if(targetVuw) {
					targetVuw.getChildren().forEach(function(vuw) {
						this.remove(vuw.name);
					}, targetVuw);
					window.vuwer.remove.call(this, name);
				}
				return this;
			},
			
			/**
			* vuwerに登録されている他のvuwを取得
			* @return Vuw instance
			*/
			getOther: function(vuwName) {
				return this.container.get(vuwName);
			},
			
			/**
			* vuwerからのアドレスを取得
			* @return string
			*/
			getAddress: function() {
				var addr = !arguments.length ? [] : arguments[0];
				addr.push(this.name);
				if(this.container && this.container.getAddress) {	// getAddressを持たないcontainer　=== vuwer
					return this.container.getAddress(addr);
				} else {
					return addr.join(".");
				}
			},
			
			/**
			* $templateからcloneを生成して返す
			* （$templat内部に[data-vuw]プロパティを持つ要素が存在した場合に
			* 対象のVuwのstateの書き換えを行う）
			* @return $clone
			*/
			getCloneFromTemplate: function() {
				var
					_self = this,
					$clone = Klass("Vuw").prototype.getCloneFromTemplate.call(this);
				
				if($clone) {
					$clone.find("[data-vuw]").each(function() {
						var
							$this = $(this),
							vuwName = $this.data("vuw"),
							vuw = _self.get(vuwName),
							stateData;
						
						if(vuw) {
							vuw.setProp("$self", $this, true);
							stateData = _self.getState(vuwName);
							if( _self.isObject(stateData) ) {
								vuw.setState(stateData);
							}
						}
					});
				}
				return $clone;
			}
		}, "Vuw")
		
		/******************************************
		* define VuwFade (extends VuwerComponent) *
		******************************************/
		// prototype継承して登録
		.appendKlass("VuwFade", {
			_initialize: function(opt) {
				if( Klass("VuwFade").parent._initialize.call(this, opt) ) {
					// [push onReady callback]
					this.onReady(function($self) {
						var delay;
						if($self) {
							if(["absolute", "fixed"].indexOf( $self.css("position") ) >= 0) {
								this.orgHeight = $self.height();
							}
							$self.addClass("vuw-fade").attr("data-visible", $self.attr("data-visible") || "0");
							delay = parseFloat( $self.css("transition-duration") );
							if( isNaN(delay) ) {
								 $self.css("transition-duration", String(this.delay / 1000) + "s");
							} else {
								this.delay += delay * 1000;
							}
						}
					});
					
					// [push onChangeState callback]
					this.onChangeState(function(state) {
						var current, toVisible = !state.visible ? false : true;
						if(!this.$self) {
							csl.log.red("  " + this.name + ".onChangeState", "$self is false.");
							return false;
						}
						
						current = (this.$self.attr("data-visible") === "1") ? true : false;
						if(current === toVisible) {
							// 引数で渡されたstate.visibleと現状が同じであれば処理終了
							return false;
						}
						
						return $.Deferred( (function(df) {
							// CSSアニメーション様に処理をずらす
							!!this.orgHeight && this.$self.css("height", this.orgHeight);
							// [show or clear]
							this.$self.attr("data-visible", toVisible ? "1" : "");
							setTimeout( (function() {
								// [hide]
								toVisible || this.$self.attr("data-visible", "0");
								!!this.orgHeight && this.$self.css("height", "");
								df.resolve();
							}).bind(this), this.delay );
							return df.promise();
						}).bind(this) );
					});
					
					return this;
				} else {
					return false;
				}
			},
			delay: 0
		}, "VuwerComponent");
		
		
		// [execute after callbacks]
		this._useVuwerAfter.forEach(function(fn) {
			fn.call(this);
		}, this);
		
		return this;
	};
	
	//[useVuwer's after callbacks]
	Klass("Vuw")._useVuwerAfter = [];
	Klass("Vuw").onUseVuwer = function(fn) {
		Klass.isFunction(fn) && this._useVuwerAfter.push(fn);
		return this;
	};
	
}(window.Klass, window.jQuery || window.$));