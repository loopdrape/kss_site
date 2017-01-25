/*----
* wAB.plugin.component.js
* DOM操作部品用プラグイン
* version: 1.0.0
*
* [history]
* 1.0.0: 新規作成
*/

;(function(WAB, $) {
	"use strict";
	
	// [include check]
	if(!WAB) {
		console.warn("'WAB' isn't included.");
		return false;
	} else
	if(!$) {
		console.warn("'$' isn't included.");
		return false;
	}
	
	/*******************
	* define Component *
	*******************/
	WAB.Component = function Component() {
		this._initialize.apply(this, arguments);
	};
	
	WAB.Component.prototype = {
		// メンバ変数
		_ver: "1.0.0",
		$elm: false,
		
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
				* ここで指定したセレクタが、getReady()時に$elmに$オブジェクトとして格納される
				* （functionを指定する場合は、$オブジェクトを返す様にする）
				*/
				selector: "",
				
				/**
				* DOM操作準備関数のコールバック
				*/
				onReady: function($elm) {},
				
				/**
				* 状態が変化した際のコールバック
				*/
				onChangeState: function($elm) {},
				
				/**
				* DOM更新用関数
				* 状態が変化した際（上記onChangeState後）に実行される
				*/
				render: function() {}
			};
			
			delete conf.onReady;
			delete conf.onChangeState;
			delete conf.render;
			
			// 引数で渡されたオプション値を設定項目にマージ
			(typeof opt === "object") && Object.assign(conf, opt);
			
			// nameが未指定の場合は現在時間から生成
			!conf.name && ( conf.name = String( ( new Date() ).valueOf() ) );
			
			this._wAB = wAB;
			this.isReady = false;
			this.state = {};		// 状態オブジェクト
			this.renderItem = false;
			
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
				if(typeof k === "object") {
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
				this._wAB.cnWarn((this.name || "Component") + ".setProp() ... arguments[0] is required.");
			}
			return this;
		},
		
		_setProp: function(k, v, isOverride) {
			if( this.hasOwnProperty(k) && !isOverride ) {
				this._wAB.cnWarn((this.name || "Component") + ".setProp() ... '" + k + "' is already defined.");
			} else {
				this[k] = v;
			}
			return this;
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
				return df.resolve().promise();
			} else
			if(this.isGettingReady) {
				this._wAB.cnLog("** " + this.name +  " is getting ready now...");
				return df.resolve().promise();
			}
			
			this.isGettingReady = true;
			
			!!this.selector && (function() {
				var $elm;
				if( this._wAB.isString(this.selector) ) {
					$elm = $(this.selector);
				} else
				if( this._wAB.isFunction(this.selector) ) {
					$elm = this.selector.call(this);
				}
				
				if($elm && $elm instanceof $ && $elm.length) {
					this.$elm = $elm;
				}
			}).call(this);
			
			// コールバックの実行
			methods = this._onReadyCallbacks.map(function(fn) {
				return fn.call(this, this.$elm);
			}, this);
			
			$.when.apply($, methods).then( (function() {
				this.isReady = true;
				delete this.isGettingReady;
				df.resolve.apply( df, Array.prototype.slice.call(arguments, 0) );
			}).bind(this), df.reject.bind(df) );
			
			return df.promise();
		},
		
		/**
		* DOM操作準備関数のコールバック登録関数
		* @return this
		*/
		onReady: function(fn) {
			if( this._wAB.isFunction(fn) ) {
				if(this.isReady) {
					fn.call(this, this.$elm);
				} else {
					this._onReadyCallbacks.push(fn);
				}
			}
			return this;
		},
		
		/**
		* 状態が変化した際に呼び出される関数
		* @return $.Deferred().promise()
		*/
		changeState: function() {
			var
				df = $.Deferred(),
				methods;
			
			// コールバックの実行
			methods = this._onChangeStateCallbacks.map(function(fn) {
				return fn.call( this, this.state );
			}, this);
			
			$.when.apply($, methods).then( (function() {
				this.renderItem = this.render();
				df.resolve();
			}).bind(this) );
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
		* 状態オブジェクトのセッター
		* （changeStateが実行された後、$elmにchangeイベントがトリガーされます）
		* @param k [string || object] objectの場合は元のデータにマージされる
		* @param v [everything] kがstringの場合、値として登録される
		* @return this
		*/
		setState: function(k, v) {
			var flg = false;
			if(!this.isReady) {
				this._wAB.cnWarn(this.name + ".setState() ... getReady() didn't execute yet.");
			} else
			if(k) {
				if( this._wAB.isString(k) ) {
					this.state[k] = v;
					flg = true;
				} else
				if(typeof k === "object") {
					Object.assign(this.state, k);
					flg = true;
				}
			} else {
				this._wAB.cnWarn(this.name + ".setState() ... arguments[0] is required.");
			}
			
			if(flg) {
				this.changeState();
				!!this.$elm && this.$elm.trigger("changeState");
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
		* DOM更新用関数
		* 状態が変化した際（上記setState後）に実行される
		*/
		render: function() {}
	};
	
	WAB.initComponent = function() {
		var args = Array.prototype.slice.call(arguments, 0);
		args.unshift(this.Component, this);
		return this.newCall.apply(this, args);
	};
	
	
	/********************
	* Components Object *
	********************/
	/**
	* 使用宣言関数
	* （実行するとComponentの格納用オブジェクト[components]が生成される）
	*/
	WAB.useComponents = function() {
		this.components = {
			_wAB: this,
			_map: {},
			isReady: false,
			
			/**
			* 準備関数
			* （documentの準備完了後に実行すること）
			* @return $.Deferred().promise()
			*/
			getReady: function() {
				var
					df = $.Deferred(),
					methods;
				
				if(this.isReady) {
					this._wAB.cnLog("** components.getReady() is already executed.");
					return this;
				}
				
				methods = Object.keys(this._map).map(function(name) {
					if(this._map[name] instanceof this._wAB.Component) {
						return this._map[name].getReady();
					}
				}, this);
				
				$.when.apply($, methods).then( (function() {
					var
						names = Object.keys(this._map),
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
					});
					
					this.isReady = true;
					df.resolve(obj);
				}).bind(this), df.reject.bind(df) );
				
				return df.promise();
			},
			
			/**
			* Componentの追加関数
			* @param name [string] Componentの名称
			* @param (optional) opt [object] Componentコンストラクタのオプション
			* @param (optional) isOverride [boolean] true: 既に存在していた場合に上書きを行う
			* @return this
			*/
			add: function(name, opt, isOverride) {
				var component;
				if( !this._wAB.isString(name) ) {
					this._wAB.cnWarn("components.add() ... arguments[0] is must be string.", typeof name);
					return this;
				}
				if(name in this._map && !isOverride) {
					this._wAB.cnWarn("components.add() ... '" + name + "' is already defined.");
					return this;
				}
				
				(typeof opt === "object") || (opt = {});
				
				Object.assign(opt, {
					name: name,
					_components: this,
					getComponents: function() {
						return this._components;
					},
					getOther: function(name) {
						return this.getComponents().get(name);
					}
				});
				component = this._wAB.initComponent(opt);
				
				this._map[component.name] = component;
				return this;
			},
			
			/**
			* Componentの取得関数
			* @param name [string] Componentの名称
			* @return Componentインスタンス
			*/
			get: function(name) {
				return this._map[name];
			},
			
			/**
			* DOM描画関数（変数名予約）
			*/
			render: function() {}
		};
		
		return this;
	};
	
}(window.WebAppBase.prototype, window.jQuery || window.$));