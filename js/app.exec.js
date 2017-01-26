;(function($) {
	"use strict";
	
	if(!window.app || !app.Vue) {
		return false;
	}
	
	app.LOG = true;
		
	// vuerrオブジェクトの利用
	(function() {
		app.useVuer();
		app.vuer
		// [window]
		.add("window", {
			selector: function() {
				return $(window);
			},
			_positionTrackings: [],
			positionTracking: function(vue) {
				vue.onReady(function() {
					vue.$pt = $("<div/>").addClass("position-tracker")
					.insertBefore(vue.$self);
					vue.onChangeState(function(state) {
						if(app.isNumber(state.current)) {
							this.$self.toggleClass(
								"is-fixed",
								state.current >= state.fixStart &&
								state.current <= state.fixEnd
							);
							delete state.current;
						}
					});
					vue.setState("fixStart", parseInt(vue.$pt.data("fix")));
				});
				this._positionTrackings.push(vue.name);
			},
			updPtFixEnd: function(vue, h) {
				vue.setState("fixEnd", vue.$pt.offset().top - h);
			},
			onScroll: function(vue, t) {
				vue.setState("current", t);
			},
			onReady: function($self) {
				$self
				.on("resize", function() {
					var
						$this = $(this),
						vue = $.data(this, "vue"),
						h = $this.height();
					
					vue._positionTrackings.forEach(function(vueName) {
						this.updPtFixEnd(this.getOther(vueName), h);
					}, vue);
				})
				.on("scroll", function() {
					var
						$this = $(this),
						vue = $.data(this, "vue"),
						t = $this.scrollTop();
					
					vue._positionTrackings.forEach(function(vueName) {
						this.onScroll(this.getOther(vueName), t);
					}, vue);
				});
			}
		})
		
		// [body]
		.add("body", {
			selector: function() {
				return $(document.body);
			},
			onReady: function($self) {
				// トップページ判定
				app.isTop = (function(clsList) {
					return (
						clsList.indexOf("page-day") <= 0 &&
						clsList.indexOf("page-tag") <= 0 &&
						clsList.indexOf("page-search") <= 0 &&
						clsList.indexOf("page-permalink") <= 0
					);
				})( $self.get(0).className.split(" ") );
				
				app.isTop && $self.addClass("page-top");
				
				this
				._addDeviceInfoClass()
				._initSmoothScroll($self)
				._attachHoverStatus($self)
				._attachLink4SP($self);
			},
			
			// [端末情報をクラス名として登録]
			_addDeviceInfoClass: function() {
				var classList = [];
				classList.push("device-" + app.device[0]);
				(app.device.length > 1) && classList.push("os-" + app.device[1]);
				classList.push("browser-" + app.browser[0]);
				(app.browser.length > 1) && classList.push( app.browser.join("") );
				this.$self.addClass( classList.join(" ") );
				return this;
			},
			
			// [smooth scroll]
			_initSmoothScroll: function($self) {
				var _self = this;
				$self.on("click", "a", function(e) {
					var $target;
					
					// ページ内リンクのクリック時のみ発火
					if(this.hash && this.origin + this.pathname === app.URL) {
						e.preventDefault();
						
						$target = $(this.hash);
						$("html, body").animate({
							scrollTop: $target.offset().top - 20
						}, {
							complete: app.isFunction(_self.smoothScrollCallBack) ? function() {
								// ブラウザによっては2回実行されるためclearTimeout処理で対応
								(_self._smoothScrollTimer) && clearTimeout(_self._smoothScrollTimer);
								_self._smoothScrollTimer = setTimeout(_self.smoothScrollCallBack.bind($target), 100);
							} : null,
							duration: 600
						});
					}
				});
				return this;
			},
			smoothScrollCallBack: function() {
				app.cnLog("scrolled.", this.offset().top);
			},
			
			// [attach hover status]
			_attachHoverStatus: function($self) {
				var _self = this;
				_self.getOther("window").$self
				.on("pageshow", function(e) {
					$(".is-hover").removeClass("is-hover");
				});
				
				_self.hoverDecayTime = (app.device[0] === "sp") ? 250 : 0;
				
				$self
				.on("mouseenter touchstart", "a:not(.btn), .btn, .hoverTarget", function(e) {
					$(this).addClass("is-hover");
				})
				.on("mouseleave touchend", "a:not(.btn), .btn, .hoverTarget", function(e) {
					setTimeout( $.fn.removeClass.bind($(this), "is-hover"), _self.hoverDecayTime);
				});
				
				return this;
			},
			
			/**
			* スマートフォンの場合のみリンクとなる要素
			* 動作条件：「link4SP」というclassを付ける　data-hrefにリンク先URLを記述する
			*（例）<span class="link4SP" data-href="tel:電話番号">電話番号</span>
			*/
			_attachLink4SP: function($self) {
				$self.on("click", ".link4SP", function() {
					var
						$this = $(this),
						t = {
							href: $this.data("href"),
							blank: $this.data("target") === "_blank" ? true : false
						};
					
					if(app.device[0] === "sp") {
						if(t.blank) {
							window.open(t.href);
						} else {
							location.href = t.href;
						}
					}
				});
				return this;
			}
		})
		
		// [siteHeader]
		.add("siteHeader", {
			selector: "#site_header",
			onReady: function($self) {
				$self.on("click", ".icon-keeshkas", function(e) {
					e.preventDefault();
					var $target = $.data(this, "target");
					if(!$target) {
						$target = $("#show_nav_links");
						$.data(this, "target", $target);
					}
					$target.trigger("click", [true]);
				});
			}
		})
		
		// [siteBody]
		.add("siteBody", {
			selector: "#site_body",
			onReady: function($self) {
			},
			onChangeState: function(state) {
				this.$self.attr({
					"data-view": state.view || ""
				});
			}
		})
		
		// [siteFooter]
		.add("siteFooter", {
			selector: "#site_footer",
			onReady: function($self) {
			},
			fixBottom: function() {
				var _self = this;
				
				// 親要素を格納
				this.$wrap = this.$self.parent();
				!!this.$wrap.length && ( this.$wrap = this.$wrap.eq(0) );
				(this.$wrap.css("position") === "static") && this.$wrap.css("position", "relative");
				this.$wrap.isBorderBox = (this.$wrap.css("box-sizing") === "border-box") ? true : false;
				
				// 更新スタイル取得関数
				this.updStyle = function() {
					var css = {
						"min-height": this.getOther("window").$self.outerHeight() - 1,
						"padding-bottom": this.$self.outerHeight(true)
					};
					this.$wrap.isBorderBox || (css["min-height"] -= css["padding-bottom"]);
					this.$wrap.css(css);
					return this;
				};
				
				this.updStyle();
				
				// for window resize event
				this.getOther("window").$self
				.on("resize", function() {
					(_self._fixTimer) && clearTimeout(_self._fixTimer);
					_self._fixTimer = setTimeout(_self.updStyle.bind(_self), 100);
				});
				
				this.$self.css({
					position: "absolute",
					bottom: 0,
					left: 0
				}).addClass("fixed-bottom");
				
				return this;
			}
		})
		
		// [searchBox]
		.add("searchBox", {
			selector: "#search_box",
			onReady: function($self) {
				$self
				.on("focus", "input", function(e) {
					var vue = $.data(e.delegateTarget, "vue");
					vue.setState("focus", true);
				})
				.on("blur", "input", function(e) {
					var vue = $.data(e.delegateTarget, "vue");
					vue.setState("focus", false);
				});
			},
			onChangeState: function(state) {
				this.$self.toggleClass("is-focus", state.focus);
			}
		})
		
		// [nav]
		.add("nav", {
			selector: "#site_nav",
			onReady: function($self) {
				this.getOther("window").positionTracking(this);
			}
		})
		
		.add("switchNavLinks", {
			selector: "#show_nav_links",
			onReady: function($self) {
				this.$link = $self.closest(".btn-toggle");
				$self.on("change", function() {
					var vue = $.data(this, "vue");
					vue.setState("isChecked", this.checked);
					vue.getOther("siteBody")
					.seState("view", this.checked ? "" : "posts");
				});
			},
			onChangeState: function(state) {
				this.$link.toggleClass("is-checked", !!state.isChecked);
			}
		})
		
		// [scrollToPageTop] ページトップへスクロールするボタン
		.add("scrollToPageTop", {
			selector: "#scroll_to_pageTop",
			onReady: function($self) {
				this.getOther("window").positionTracking(this);
			}
		});
		
/*
		// [pageLoader]
		.add("pageLoader", {
			selector: "#page_loader",
			delay: 1,
			onReady: function($self) {
				var delay;
				$self.attr("data-visible", "0").removeClass("hide");
				delay = parseFloat( $self.css("transition-duration") );
				if( !isNaN(delay) ) {
					this.delay += delay * 1000;
				}
				
				if(app.browser[0] !== "ie" || app.browser[1] > 9) {
					$self.cssLoader();
				}
			},
			show: function(cb) {
				app.isFunction(cb) || (cb = function() {});
				// CSSアニメーション様に処理をずらす
				this.$self.attr("data-visible", "");
				setTimeout( this.setState({
					visible: "1",
					cb: cb
				}).bind(this), 0);
				return this;
			},
			hide: function(cb) {
				app.isFunction(cb) || (cb = function() {});
				this.$self.attr("data-visible", "");
				this.setState({
					visible: "0",
					cb: cb
				});
				return this;
			},
			onChangeState: function(state) {
				if(state.visible) {
					this.$self.attr("data-visible", "1");
					setTimeout(state.cb.bind(this), this.delay);
				} else {
					setTimeout( (function() {
						this.$self.attr("data-visible", "0");
						state.cb.call(this);
					}).bind(this), this.delay);
				}
			}
		});
*/
	})();
	
	// attach execute callbacks
	app._execCallbacks = [];
	app.onReady = function(fn) {
		this.isFunction(fn) && this._execCallbacks.push(fn);
	};
	
	/******************
	*    app start    *
	******************/
	$.Deferred(function(df) {
		$(function() {
			// コンポーネント
			app.vuer.getReady().then(df.resolve);
		});
		return df.promise();
	}).then(function() {
		var args = Array.prototype.slice.call(arguments, 0);
		// onReadyで登録されたコールバックの実行
		return $.when.apply($, app._execCallbacks.map(function(fn) {
			return fn.apply(this, args);
		}, app));
	}).then(function() {
		app.vuer.get("window").$self
		.trigger("resize", [true])
		.trigger("scroll", [true]);
		app.vuer.get("body").$self.addClass("is-ready");
		
		setTimeout(function() {
//			app.vuer.get("siteFooter").fixBottom();
			app.cnLog("app ready.");
		}, 0);
	});
	
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
