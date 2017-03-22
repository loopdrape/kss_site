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
	
	// [position tracker]
	app.positionTracking = {
		_targets: [],
		add: function(vuw) {
			if( !( vuw instanceof Klass("Vuw") ) ) {
				throw new TypeError("arguments[0] must be Vuw instance.");
			}
			
			vuw.$pt = $("<div/>").addClass("position-tracker")
			.insertBefore(vuw.$self);
			
			vuw.state.fixStart = parseInt( vuw.$self.data("fix") );
			
			vuw.onChangeState(function(state) {
				var isFixed;
				if( !this.isNumber(state.current) ) {
					return false;
				}
				
				isFixed =
					state.current >= state.fixStart &&
					state.current <= (state.fixEnd || 0);
				
				if(state.isFixed !== isFixed) {
					this.$self.toggleClass("is-fixed", isFixed);
					this.$pt.css({
						height: isFixed ? this.height : ""
					});
					state.isFixed = isFixed;
				}
				delete state.current;
			});
			
			this._targets.push( vuw.getAddress() );
		},
		updFixEnd: function(h) {
			var methods = this._targets.map(function(vuwAddr) {
				var vuw = vuwer.get(vuwAddr);
				if(vuw.isReady) {
					vuw.height = vuw.$self.outerHeight();
					return vuw.setState("fixEnd", vuw.$pt.offset().top - h);
				}
			});
			return $.when.apply($, methods);
		},
		onScroll: function(t) {
			var methods = this._targets.map(function(vuwAddr) {
				var vuw = vuwer.get(vuwAddr);
				if(vuw.isReady) {
					return vuw.setState("current", t);
				}
			});
			return $.when.apply($, methods);
		}
	};
	
	vuwer.onReady(function($window) {
		$window
		.on("resize.pt", function(e, isTrigger) {
			!!vuwer._resizePtTimer && clearTimeout(vuwer._resizePtTimer);
			vuwer._resizePtTimer = setTimeout(function() {
				app.positionTracking.updFixEnd( $window.height() );
			}, !!isTrigger ? 0 : 100);
		})
		.on("scroll.pt", function(e, isTrigger) {
			!!vuwer._scrollPtTimer && clearTimeout(vuwer._scrollPtTimer);
			vuwer._scrollPtTimer = setTimeout(function() {
				app.positionTracking.onScroll( $window.scrollTop() );
			}, 0);
		});
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
		return vuwer.get("secTitle").setState("anime", true);
	};
	
	/*----------------
	* ローディング表示 OFF
	* @return $.Deferred().promise()
	*/
	app.hideLoading = function() {
		return vuwer.get("secTitle").setState("anime", false);
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
