;(function($) {
	"use strict";
	
	if( !app || !Klass("Vuw") ) {
		return false;
	}
	
	/******************
	*    app start    *
	******************/
	$.Deferred(function(df) {
		$(function() {
			// コンポーネントの準備
			vuwer.getReady().then(df.resolve);
		});
		return df.promise();
	}).then(function() {
		var args = Array.prototype.slice.call(arguments, 0);
		csl.log.blue("vuwer ready.", args);
		// app.onReadyで登録されたコールバックの実行
		return $.when(
			app.showLoading(),
			$.when.apply($, app._execCallbacks.map(function(fn) {
				return fn.apply(this, args);
			}, app))
		);
	}).then(function() {
		var df = $.Deferred();
		vuwer.get("body").$self.addClass("is-ready");
		setTimeout(df.resolve, 0);
		return df.promise();
	}).then(function() {
		var df = $.Deferred();
		vuwer.$window.trigger("resize", [true]);
		setTimeout(df.resolve, 600);
		return df.promise();
	}).then(function() {
		return app.hideLoading();
	}).then(function() {
		vuwer.$window.trigger("scroll", [true]);
		
//		setTimeout(function() {
//			vuwer.get("siteFooter").fixBottom();
			csl.log.blue("**** app ready. ****");
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
		return app.vuwer.get("secTitle").setState("anime", true);
	};
	
	/*----------------
	* ローディング表示 OFF
	* @return $.Deferred().promise()
	*/
	app.hideLoading = function() {
		return app.vuwer.get("secTitle").setState("anime", false);
	};
	
	// ** override ** (for Google Analytics)
	app.pushState = function(data, url) {
		if( Klass("WebAppBase").prototype.pushState.call(app, data, url) ) {
			!!window.ga && (function(ga) {
				ga("set", "page", url);
				ga("send", "pageview");
				csl.log.gray("**** send ga pageview.", url);
			})(window.ga);
			return this;
		} else {
			return false;
		}
	};
	
	// ** override ** (for Google Analytics)
	app.replaceState = function(data, url) {
		if( Klass("WebAppBase").prototype.replaceState.call(app, data, url) ) {
			!!window.ga && (function(ga) {
				ga("set", "page", url);
				ga("send", "pageview");
				csl.log.gray("**** send ga pageview.", url);
			})(window.ga);
			return this;
		} else {
			return false;
		}
	};
	
})(window.jQuery || window.$);
