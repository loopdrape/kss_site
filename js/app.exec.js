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
	app.positionTracker = {
		_targets: [],
		tracking: function(vuw, trackingStart, trackingEnd) {
			if( !( vuw instanceof Klass("Vuw") ) ) {
				throw new TypeError("arguments[0] must be Vuw instance.");
			}
			
			vuw._pt = {
				$elm: $("<div/>").addClass("position-tracker").insertBefore(vuw.$self),
				buffer: vuw.$self.data("fix") || 0
			};
			
			!!trackingStart && (vuw._pt.fixStart = 0);
			!!trackingEnd && (vuw._pt.fixEnd = 0);
			
			vuw.onChangeState(function(state) {
				var isFixed;
				if( !app.isNumber(state.currentY) ) {
					return false;
				}
				
				isFixed =
					(!this._pt.fixStart || state.currentY >= this._pt.fixStart) &&
					(!this._pt.fixEnd || state.currentY <= this._pt.fixEnd);
				
				if(isFixed !== state.isFixed) {
					state.isFixed = isFixed;
					this.$self.toggleClass("is-fixed", state.isFixed);
					this._pt.$elm.css("height", state.isFixed ? this._pt.height : "");
				}
				delete state.currentY;
			});
			
			this._targets.push( vuw.getAddress() );
		},
		_updPtFixPosition: function() {
			var h = vuwer.$window.height();
			this._targets.forEach(function(vuwAddress) {
				var
					vuw = vuwer.get(vuwAddress),
					top = vuw._pt.$elm.offset().top;
				
				if(vuw && vuw.isReady) {
					vuw._pt.height = vuw.$self.outerHeight(true);
					if( app.isNumber( vuw._pt.fixStart ) ) {
						vuw._pt.fixStart = top + vuw._pt.buffer;
					}
					if( app.isNumber( vuw._pt.fixEnd ) ) {
						vuw._pt.fixEnd = top + vuw._pt.height - h;
					}
				}
			}, this);
			return this;
		},
		onWindowResize: function() {
			return this._updPtFixPosition();
		},
		onChangeScrollTop: function(t) {
			this._targets.forEach(function(vuwAddress) {
				var vuw = vuwer.get(vuwAddress);
				if(vuw && vuw.isReady) {
					vuw.setState("currentY", t);
				}
			}, this);
			return this;
		}
	};
	
	vuwer.onReady(function($window) {
		$window
		.on("resize.pt", function(e, isTrigger) {
				var scrollTop = $window.scrollTop();
				!!vuwer._resizePtTimer && clearTimeout(vuwer._resizePtTimer);
				vuwer._resizePtTimer = setTimeout(function() {
					if( scrollTop === $window.scrollTop() ) {
						app.positionTracker.onWindowResize();
					}
				}, !!isTrigger ? 0 : 100);
		})
		.on("scroll.pt", function(e, isTrigger) {
			app.positionTracker.onChangeScrollTop( $window.scrollTop() );
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
