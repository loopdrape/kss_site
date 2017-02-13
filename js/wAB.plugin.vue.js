/*----
* wAB.plugin.vue.js
* DOM操作コンポーネント用プラグイン
* version: 1.0.0
*
* [history]
* 1.0.0: 新規作成
*/

;(function(WAB, $) {
	"use strict";
	
	// [include check]
	if(!WAB) {
		console.warn("'WebAppBase' isn't included.");
		return false;
	} else
	if(!$) {
		console.warn("'$' isn't included.");
		return false;
	}
	
	/*************
	* define Vue *
	*************/
	WAB.Vue = function Vue() {
		this._initialize.apply(this, arguments);
	};
	
	WAB.Vue.prototype = {
		// メンバ変数
		_ver: "1.0.0",
		$self: false,
		$template: false,
		
		/**
		* [コンストラクタ]
		* @param wAB [instanceof WebAppBase]
		* @param opt [object] オプション値
		*/
		_initialize: function(wAB, opt) {
			var conf = {	// 設定項目
				/**
				* インスタンス名
				*/
				name: "",
				
				/**
				* selector [string or function]
				* ここで指定したセレクタが、getReady()時に$オブジェクトとして$selfプロパティに格納される
				* （functionを指定する場合は、$オブジェクトを返す様にする）
				* ただし、指定された要素にdata-vue-template属性が指定されている場合は$templateプロパティ
				* に格納され、body直下のテンプレート配置領域に移動される
				* 元の場所には<var data-vue="{name}"></var>が配置される
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
			
			conf = wAB.isObject(opt) ? opt : {};
			
			// nameが未指定の場合は現在時間から生成
			!conf.name && ( conf.name = String( ( new Date() ).valueOf() ) );
			
			this._wAB = wAB;
			this.isReady = false;
			this.state = {};		// 状態オブジェクト
			
			this._onReadyCallbacks = [];
			if(conf.onReady) {
				this.onReady(conf.onReady);
				delete conf.onReady;
			}
			
			this._onChangeStateCallbacks = [];
			if(conf.onChangeState) {
				this.onChangeState(conf.onChangeState);
				delete conf.onChangeState;
			}
			
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
				if( this._wAB.isString(k) ) {
					this._setProp(k, v, !!isOverride);
				} else
				if( this._wAB.isObject(k) ) {
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
				this._wAB.cnWarn((this.name || "Vue") + ".setProp() ... arguments[0] is required.");
			}
			return this;
		},
		
		_setProp: function(k, v, isOverride) {
			if( this.hasOwnProperty(k) && !isOverride ) {
				this._wAB.cnWarn((this.name || "Vue") + ".setProp() ... '" + k + "' is already defined.");
			} else {
				this[k] = v;
			}
			return this;
		},
		
		/**
		* テンプレート退避領域の登録先
		*/
		_templateAreaPropTo: "_wAB",
		
		/**
		* テンプレート退避領域の取得
		* @param (optional) as$ [boolean] falseの場合にHTMLElementとして返す
		* @return $ instance || HTMLElement
		*/
		getTemplateArea: function(as$) {
			var $templateArea;
			if(!this[this._templateAreaPropTo]._$templateArea) {
				// [create _$templateArea]
				// 上記_templateAreaPropToで指定されているオブジェクトに_$templateAreaプロパティとして格納される
				this[this._templateAreaPropTo]._$templateArea =
					$("<div/>").addClass("vue-template-area").hide()
					.appendTo(document.body);
			}
			$templateArea = this[this._templateAreaPropTo]._$templateArea;
			return (as$ === false) ? $templateArea.get(0) : $templateArea;
		},
		
		/**
		* DOM操作準備関数
		* （documentの読み込み後に実行すること）
		* @return $.Deferred().promise()
		*/
		getReady: function() {
			var
				df = $.Deferred(),
				methods;
			
			if(this.isReady) {
				this._wAB.cnLog("** " + this.name +  ".getReady() is already executed.");
				df.resolve();
			} else
			if(this.isGettingReady) {
				this._wAB.cnLog("** " + this.name +  " is getting ready now...");
				df.resolve();
			} else {
				
				this.isGettingReady = true;
				
				// selectorから$selfないし$templateを生成
				!!this.selector && (function() {
					var $elm;
					if( this._wAB.isString(this.selector) ) {
						$elm = $(this.selector);
					} else
					if( this._wAB.isFunction(this.selector) ) {
						$elm = this.selector.call(this);
					}
					
					if($elm && $elm instanceof $ && $elm.length) {
						if( $elm.attr("data-vue-template") !== undefined ) {
							// data-vue-template属性がある場合はテンプレートとみなし、$templateプロパティに格納
							this.$template = $elm;
							// 代替要素を配置し、$selfプロパティに格納
							$elm = $("<var/>").attr("data-vue", this.name).insertBefore(this.$template);
							this.$self = $elm;
						} else {
							// $selfプロパティに格納
							this.$self = $elm;
							// イベントのコールバック等で使用できる様に$.dataに自身を登録
							$.data(this.$self.get(0), "vue", this);
						}
					}
				}).call(this);
				
				// createTemplateが指定されてされている場合、実行して$templateを生成
				this._wAB.isFunction(this.createTemplate) && (function() {
					var $elm;
					$elm = this.createTemplate.call(this);
					if($elm && $elm instanceof $ && $elm.length) {
						this.$template = $elm;
					}
				}).call(this);
				
				// $templateが生成されている場合、body直下の専用領域に退避する
				!!this.$template && this.$template.appendTo( this.getTemplateArea() );
				
				// コールバックの実行
				methods = this._onReadyCallbacks.map(function(fn) {
					return fn.call(this, this.$self, this.$template);
				}, this);
				
				$.when.apply($, methods).then( (function() {
					this.isReady = true;
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
			if( this._wAB.isFunction(fn) ) {
				if(this.isReady) {
					this._wAB.cnLog(this.name, "isReady to execute.");
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
				this._wAB.cnWarn(this.name + ".getState() ... getReady() didn't execute yet.");
				return false;
			} else
			if( k && this._wAB.isString(k) ) {
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
				flg = false;
			
			if(!this.isReady) {
				this._wAB.cnWarn(this.name + ".setState() ... getReady() didn't execute yet.");
				df.reject();
			} else
			if(this.isChangingState) {
				this._wAB.cnLog(this.name + " is changing state...", [k, v]);
				df.reject();
			} else
			if(k) {
				if( this._wAB.isString(k) ) {
					this.state[k] = v;
					flg = true;
				} else
				if( this._wAB.isObject(k) ) {
					this.state = k;
					flg = true;
				} else {
					this._wAB.cnWarn(this.name + ".setState() ... arguments error.");
					df.reject();
				}
			} else {
				this._wAB.cnWarn(this.name + ".setState() ... arguments[0] is required.");
				df.reject();
			}
			
			if(flg) {
				this.changeState().then( (function() {
					!!this.$self && this.$self.trigger("changeState");
					df.resolve.apply(df, Array.prototype.slice.call(arguments, 0) );
				}).bind(this), df.reject.bind(df) );
			}
			return df.promise();
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
			this._wAB.isFunction(fn) && this._onChangeStateCallbacks.push(fn);
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
					"data-vue-template": null
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
			args.unshift( this.getCloneFromTemplate() );
			renderedElm = this.render.apply(this, args);
			
			if(this.$self && renderedElm) {
				// render()の戻り値でDOM要素を更新
				if( !(renderedElm instanceof $) &&
						( this._wAB.isElement(renderedElm) || this._wAB.isString(renderedElm) ) ) {
					renderedElm = $(renderedElm);
				}
				
				if(renderedElm instanceof $ && renderedElm.length) {
					this.$self.replaceWith(renderedElm);
					this.$self = renderedElm;
					$.data(this.$self.get(0), "vue", this);
					
					// 完了コールバックの実行
					this._wAB.isFunction(this.renderComplete) && this.renderComplete(renderedElm);
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
		render: function($templateClone) {},
		
		/**
		* renderの完了コールバック
		* @param renderedElm [$instance || HTMLElement] render関数で返されたデータ
		*/
		renderComplete: function(renderedElm) {}
	};
	
	// function for create instance
	WAB.initVue = function() {
		var args = Array.prototype.slice.call(arguments, 0);
		args.unshift(this.Vue, this);
		return this.newCall.apply(this, args);
	};
	
	
	//////////////////////////////////////
	//////// vuer (Vue container) ////////
	//////////////////////////////////////
	/**
	* 使用宣言関数
	* （実行するとVueの格納用Vueインスタンスとして vuer が生成される）
	*/
	WAB.useVuer = function() {
		this.vuer = this.initVue({
			name: "vuer",
			selector: function() {
				return $(window);
			},
			
			_vueMap: {},
			_childKlass: "VuerComponent",
			
			_getComponentsReady: function() {
				var
					df = $.Deferred(),
					methods;
				
				// add()で追加されたVueのgetReady()を実行する
				methods = Object.keys(this._vueMap).map(function(name) {
					if(this._vueMap[name] instanceof this._KlassMap[this._childKlass]) {
						return this._vueMap[name].getReady();
					}
				}, this);
				
				$.when.apply($, methods).then( (function() {
					var
						names = Object.keys(this._vueMap),
						obj = {};
					
					// 各getReady()内でresolveによって渡された値をobjに格納
					Array.prototype.slice.call(arguments, 0).forEach(function(res, i) {
						if( Array.isArray(res) ) {
							res = res.filter(function(arg) {
								return !!arg;
							});
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
			
			onChangeState: function(state) {
				this._wAB._GET = state;
			},
			
			/**
			* Vueの追加関数
			* @param name [string || Vue instance] Vueの名称 || _childKlassで指定したFunctionのインスタンス
			* @param (optional) opt [object] Vueコンストラクタのオプション
			* @param (optional) isOverride [boolean] true: 既に存在していた場合に上書きを行う
			* @return this
			*/
			add: function(name, opt, isOverride) {
				var vue;
				
				if(this._wAB.isFunction(name) && name instanceof this._KlassMap[this._childKlass]) {
					vue = name;
					
				} else {
					if( !this._wAB.isString(name) ) {
						this._wAB.cnWarn("vuer.add() ... arguments[0] is must be string.", typeof name);
						return this;
					}
					if(name in this._vueMap && !isOverride) {
						this._wAB.cnWarn("vuer.add() ... '" + name + "' is already defined.");
						return this;
					}
					
					this._wAB.isObject(opt) || (opt = {});
					
					Object.assign(opt, {
						name: name
					});
					
					if( opt.vueType && this._wAB.isString(opt.vueType) ) {
						name = "Vue" + opt.vueType.slice(0, 1).toUpperCase() + opt.vueType.slice(1);
						if( !this._wAB.isFunction(this._KlassMap[name]) ) {
							name = this._childKlass;
							opt.vueType = "component";
						}
					} else {
						name = this._childKlass;
						opt.vueType = "component";
					}
					
					vue = new this._KlassMap[name](this._wAB, opt);
				}
				
				this._vueMap[vue.name] = vue;
				return this;
			},
			
			/**
			* Vueの取得関数
			* @param name [string] Vueの名称
			* @return Vue instance
			*/
			get: function(name) {
				if( !this._wAB.isString(name) ) {
					this._wAB.cnWarn("vuer.get() ... arguments[0] is must be string.", typeof name);
					return false;
				}
				return this._vueMap[name] || false;
			},
			
			/**
			* Vueの削除関数
			* @param name [string] Vueの名称
			* @return Vue instance
			*/
			remove: function(name) {
				var vue;
				if( !this._wAB.isString(name) ) {
					this._wAB.cnWarn("vuer.remove() ... arguments[0] is must be string.", typeof name);
					return this;
				}
				
				vue = this.get(name);
				if(!vue) {
					return this;
				}
				
				(vue.$self && vue.$self.length) && vue.$self.remove();
				(vue.$template && vue.$template.length) && vue.$template.remove();
				delete this._vueMap[name];
				return this;
			},
			
			// Vueを継承したClassの格納領域
			_KlassMap: {},
			
			/**
			* Class 継承用関数
			* @param name [string] 継承先の登録名称
			* @param (optional) prop [object] 継承先のプロパティ
			* @param (optional) parent [string || function] 継承元の名称 || 継承元Class
			* @return this
			*/
			appendKlass: function(name, prop, parent) {
				var Super;
				if( !this._wAB.isString(name) ) {
					this._wAB.cnWarn("vuer.appendKlass() ... arguments[0] is must be string.", typeof name);
					return this;
				} else
				if(this._KlassMap[name]) {
					this._wAB.cnWarn("vuer.appendKlass() ... '" + name + "' is already defined.");
					return this;
				}
				
				function Klass() {
					this._initialize.apply(this, arguments);
				}
				
				if( this._wAB.isString(parent) ) {
					if( !this._wAB.isFunction(this._KlassMap[parent]) ) {
						this._wAB.cnWarn("vuer.appendKlass() ... '" + parent + "' is undefined.");
						return this;
					}
					Super = this._KlassMap[parent];
				} else
				if( this._wAB.isFunction(parent) ) {
					Super = parent;
				} else {
					// default
					if( !this._wAB.isFunction(this._KlassMap[this._childKlass]) ) {
						this._wAB.cnWarn("vuer.appendKlass() ... '" + this._childKlass + "' is undefined.");
						return this;
					}
					Super = this._KlassMap[this._childKlass];
				}
				
				this._wAB.inherits(Klass, Super);
				
				this._wAB.isObject(prop) && Object.assign(Klass.prototype, prop);
				
				this._KlassMap[name] = Klass;
				return this;
			},
			
			/**
			* Class 取得用関数
			* @param name [string] 登録名称
			* @return Class [function]
			*/
			getKlass: function(name) {
				return this._KlassMap[name];
			}
		});
		
		/*************************************
		* define VuerComponent (extends Vue) *
		*************************************/
		// prototype継承して登録
		this.vuer.appendKlass("VuerComponent", {
			_vuer: this.vuer,
			_templateAreaPropTo: "_vuer",
			
			/**
			* vuerの取得
			* （下記useVuer()を実行していない場合はfalseが返される
			* @return vuer object
			*/
			getVuer: function() {
				return this._vuer;
			},
			
			/**
			* vuerに登録されている他のvueを取得
			* @return Vue instance
			*/
			getOther: function(vueName) {
				return this.getVuer().get(vueName);
			},
			
			/**
			* $templateからcloneを生成して返す
			* （$templat内部に[data-vue]プロパティを持つ要素が存在した場合に
			* 対象のVueのstateの書き換えを行う）
			* @return $clone
			*/
			getCloneFromTemplate: function() {
				var
					_self = this,
					$clone = this._wAB.Vue.prototype.getCloneFromTemplate.call(this);
				
				if($clone) {
					$clone.find("[data-vue]").each(function() {
						var
							$this = $(this),
							vueName = $this.data("vue"),
							vue = _self.getOther(vueName),
							stateData;
						
						if(vue) {
							vue.setProp("$self", $this, true);
							stateData = _self.getState(vueName);
							if( _self._wAB.isObject(stateData) ) {
								vue.setState(stateData);
							}
						}
					});
				}
				return $clone;
			}
		}, this.Vue);
		
		/**********************************************
		* define VueContainer (extends VuerComponent) *
		**********************************************/
		// prototype継承して登録
		this.vuer.appendKlass("VueContainer", {
			_initialize: function(wAB, opt) {
				if( this.callSuper("_initialize", wAB, opt) ) {
					this.onReady( this.getVuer()._getComponentsReady.bind(this) );
					return this;
				} else {
					return false;
				}
			},
			_vueMap: {},
			_childKlass: "",
			add: function(name, opt, isOverride) {
				var args = Array.prototype.slice.call(arguments, 0);
				this.getVuer().add.apply(this, args);
				return this;
			},
			get: function(name) {
				return this.getVuer().get.call(this, name);
			},
			_KlassMap: this.vuer._KlassMap
		}, "VuerComponent");
		
		return this;
	};
}(window.WebAppBase.prototype, window.jQuery || window.$));