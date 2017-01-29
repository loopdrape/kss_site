;(function($) {
	"use strict";
	
	if(!window.app || !app.Vue) {
		return false;
	}
	
	app.LOG = true;
	
	/******************
	*    app start    *
	******************/
	$.Deferred(function(df) {
		$(function() {
			// コンポーネントの準備
			app.vuer.getReady().then(df.resolve);
		});
		return df.promise();
	}).then(function() {
		var args = Array.prototype.slice.call(arguments, 0);
		app.cnLog("vuer ready.", args);
		// app.onReadyで登録されたコールバックの実行
		return $.when.apply($, app._execCallbacks.map(function(fn) {
			return fn.apply(this, args);
		}, app));
	}).then(function() {
		var df = $.Deferred();
		app.vuer.$window.trigger("resize", [true]);
		setTimeout(df.resolve, 100);
		return df.promise();
	}).then(function() {
		app.vuer.$window.trigger("scroll", [true]);
		app.vuer.get("body").$self.addClass("is-ready");
		
//		setTimeout(function() {
//			app.vuer.get("siteFooter").fixBottom();
			app.cnLog("app ready.");
//		}, 0);
	});
	
	
	// attach execute callbacks
	app._execCallbacks = [];
	app.onReady = function(fn) {
		this.isFunction(fn) && this._execCallbacks.push(fn);
	};
	
	/*********************
	* set util functions *
	*********************/
	/*----------------
	* ローディング表示 ON
	* @return $.Deferred().promise()
	*/
	app.showLoading = function(str) {
		var
			df = $.Deferred(),
			pageLoader = app.vuer.get("pageLoader");
		
		if( pageLoader && app.isString(str) ) {
			$.when( pageLoader.isReady ? false : pageLoader.getReady() )
			.then( (function() {
				if(pageLoader._loadingBy) {
					app.cnLog("  (kick showLoading " + str + ")");
					df.resolve();
					
				} else {
					pageLoader._loadingBy = str;
					pageLoader.show(function() {
						app.cnLog("showLoading", [this._loadingBy]);
						df.resolve();
					});
				}
			}).bind(this) );
		} else {
			df.resolve();
		}
		return df.promise();
	};
	
	/*----------------
	* ローディング表示 OFF
	* @return $.Deferred().promise()
	*/
	app.hideLoading = function(str) {
		var
			df = $.Deferred(),
			pageLoader = app.vuer.get("pageLoader");
		
		if( pageLoader && app.isString(str) ) {
			if(pageLoader._loadingBy === str) {
				pageLoader.hide(function() {
					app.cnLog("hideLoading", [str]);
					delete this._loadingBy;
					df.resolve();
				});
				
			} else {
				app.cnLog("  (kick hideLoading " + str + ")");
				df.resolve();
			}
		} else {
			df.resolve();
		}
		return df.promise();
	};
	
	// ** override ** (for Google Analytics)
	app.pushState = function(data, url) {
		if( window.WebAppBase.prototype.pushState.call(app, data, url) ) {
			!!window.ga && (function(ga) {
				ga("set", "page", url);
				ga("send", "pageview");
				app.cnLog("**** send ga pageview.", url);
			})(window.ga);
			return this;
		} else {
			return false;
		}
	};
	
	// ** override ** (for Google Analytics)
	app.replaceState = function(data, url) {
		if( window.WebAppBase.prototype.replaceState.call(app, data, url) ) {
			!!window.ga && (function(ga) {
				ga("set", "page", url);
				ga("send", "pageview");
				app.cnLog("**** send ga pageview.", url);
			})(window.ga);
			return this;
		} else {
			return false;
		}
	};
	
})(window.jQuery || window.$);
