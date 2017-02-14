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
		return $.when(
			app.showLoading(),
			$.when.apply($, app._execCallbacks.map(function(fn) {
				return fn.apply(this, args);
			}, app))
		);
	}).then(function() {
		var df = $.Deferred();
		app.vuer.get("body").$self.addClass("is-ready");
		setTimeout(df.resolve, 0);
		return df.promise();
	}).then(function() {
		var df = $.Deferred();
		app.vuer.$window.trigger("resize", [true]);
		setTimeout(df.resolve, 600);
		return df.promise();
	}).then(function() {
		return app.hideLoading();
	}).then(function() {
		app.setScroll(1);
		app.vuer.$window.trigger("scroll", [true]);
		
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
	app.showLoading = function() {
		return app.vuer.get("secTitle").setState("anime", true);
	};
	
	/*----------------
	* ローディング表示 OFF
	* @return $.Deferred().promise()
	*/
	app.hideLoading = function() {
		return app.vuer.get("secTitle").setState("anime", false);
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
