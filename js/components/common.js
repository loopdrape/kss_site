;(function (global, factory) {
	"use strict";
	factory(
		global.Klass,
		global.app,
		global.vuwer,
		global.jQuery || global.$
	);
}(this, function(Klass, app, vuwer, $) {
	"use strict";
	
	/******************
	*    component    *
	******************/
	vuwer
	// [window]
	.setProp({
		onReady: function($window) {
			$window
//			.on("resize", function(e, isTrigger) {
//				!!vuwer._resizeTimer && clearTimeout(vuwer._resizeTimer);
//				vuwer._resizeTimer = setTimeout(function() {
//				}, !!isTrigger ? 0 : 100);
//			})
			.on("popstate", function(e) {
				var state = e.originalEvent.state;
				app.isObject(state) || (state = {});
				csl.log.blue("** popstate **", state);
				state.isPopstate = true;
				vuwer.setState(state);
			});
		},
		onChangeState: function(state) {
			var
				isPopstate = !!state.isPopstate,
				methods = [],
				childState = {},
				url;
			
			isPopstate && delete state.isPopstate;
			
			app._GET = this.isString(state.query) ? app.parseQueryString(state.query) : {};
			
			childState.contentsView = {};
			
			if(state.param === "tagged") {
				if(state.value === this.state.value) {
					methods.push( app.posts.loadPosts(state.pathname) );
				} else {
					methods.push( app.posts.replacePosts(state.pathname) );
				}
			} else
			if(state.param === "post") {
				childState.contentsView.view = "posts";
				childState.contentsView.active = state.value;
			}
			
			if(app._GET.description) {
				childState.contentsView.view = "description";
			}
			
			methods = methods.concat( Object.keys(childState).map(function(vuwname) {
				return this.get(vuwname).setState(childState[vuwname]);
			}, this) );
			
			if(state.pathname !== this.state.pathname || state.query !== this.state.query) {
				url = (state.pathname || "/") + (state.query || "");
				app[isPopstate ? "replaceState" : "pushState"](
					state,
					location.origin + url,
					{
						title: (!!state.title ? state.title + " // " : "") + app.config.siteTitle
					}
				);
			}
			
			csl.log.orange("vuwer:change", state, childState, methods.length);
			return $.when.apply($, methods);
		},
		changePathname: function(pathname, query) {
			var arr, state;
			
			this.isString(pathname) || (pathname = "");
			pathname = pathname.replace(/^\//, "");
			
			this.isString(query) || (query = "");
			
//			if( pathname === location.pathname.replace(/^\//, "") ) {
//				return $.Deferred().resolve();
//			} else {
				// parse
				arr = pathname.split("/");
				state = {
					pathname: "/" + pathname,
					param: arr.shift() || ""
				};
				
				!!query && (state.query = query);
				
				if(state.param) {
					state.value = arr.shift() || "";
					
					if(arr.length) {
						state.title = arr.join(" / ");
					}
				}
				
				return this.setState(state);
//			}
		}
	})
	
	// [body]
	.add("body", {
		selector: function() {
			return $(document.body);
		},
		onReady: function($self) {
			// ページタイプ判定
			app.pageType = [];
			$self.hasClass("page-index") && app.pageType.push("index");
			$self.hasClass("page-day") && app.pageType.push("day");
			$self.hasClass("page-tag") && app.pageType.push("tag");
			$self.hasClass("page-search") && app.pageType.push("search");
			$self.hasClass("page-permalink") && app.pageType.push("permalink");
			if(app.pageType.length) {
				if(app.pageType[0] === "index" && app.pageType.length === 1) {
					app.pageType.push("top");
					$self.addClass("page-top");
					app.isTop = true;
				} else {
					app.isTop = false;
				}
			}
			app.pageType = app.pageType.join(".");
			
			this
			._addDeviceInfoClass()
			._initSmoothScroll()
			._attachHoverStatus()
			._attachLink4SP();
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
		_initSmoothScroll: function() {
			this.$self.on("click", "a", function(e) {
				var vuw, $target, origin = this.origin;
				
				!origin && (origin = !this.protocol ? "" : this.protocol + "\/\/" + this.hostname);
				// ページ内リンクのクリック時のみ発火
				if(this.hash && (
					origin + this.pathname === app.URL || !origin
				)) {
					e.preventDefault();
					vuw = $.data(e.delegateTarget, "vuw");
					$target = $(this.hash);
					$("html, body").animate({
						scrollTop: $target.offset().top - 20
					}, {
						complete: app.isFunction(vuw.smoothScrollCallBack) ? function() {
							// ブラウザによっては2回実行されるためclearTimeout処理で対応
							!!vuw._smoothScrollTimer && clearTimeout(vuw._smoothScrollTimer);
							vuw._smoothScrollTimer = setTimeout(vuw.smoothScrollCallBack.bind($target), 100);
						} : null,
						duration: 600
					});
				}
			});
			return this;
		},
		smoothScrollCallBack: function() {
			csl.log("scrolled.", this.offset().top);
		},
		
		// [attach hover status]
		_attachHoverStatus: function() {
			vuwer.$window
			.on("pageshow", function(e) {
				$(".is-hover").removeClass("is-hover");
			});
			
			this.hoverDecayTime = (app.device[0] === "sp") ? 250 : 0;
			
			this.$self
			.on("mouseenter touchstart", "a, .hoverTarget", function(e) {
				$(this).addClass("is-hover");
			})
			.on("mouseleave touchend", "a, .hoverTarget", function(e) {
				var vuw = $.data(e.delegateTarget, "vuw");
				setTimeout( $.fn.removeClass.bind($(this), "is-hover"), vuw.hoverDecayTime);
			});
			
			return this;
		},
		
		/**
		* スマートフォンの場合のみリンクとなる要素
		* 動作条件：「link4SP」というclassを付ける　data-hrefにリンク先URLを記述する
		*（例）<span class="link4SP" data-href="tel:電話番号">電話番号</span>
		*/
		_attachLink4SP: function() {
			this.$self.on("click", ".link4SP", function() {
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
		},
		
		onChangeState: function(state) {
			if(typeof state.lockScroll === "boolean") {
				this.$self.toggleClass("is-lock-scroll", state.lockScroll);
			}
		}
	})
	
	// [siteHeader]
	.add("siteHeader", {
		selector: "#site_header",
		onReady: function($self) {
			this.$title = $self.children(".site-title");
		},
		onChangeState: function(state) {
			if("anime" in state) {
				this.$title.toggleClass("is-anime", !!state.anime);
				delete state.anime;
			}
		}
	})
	
	// [siteBody]
	.add("siteBody", {
		selector: "#site_body"
	})
	
	// [scrollToPageTop] ページトップへスクロールするボタン
	.add("scrollToPageTop", {
		selector: "#scroll_to_pageTop",
		onReady: function($self) {
			app.positionTracker.tracking(this, true, true);
		},
		execScroll: function() {
			this.$self.children(".btn-exec").trigger("click", [true]);
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
					"min-height": vuwer.$window.outerHeight() - 1,
					"padding-bottom": this.$self.outerHeight(true)
				};
				this.$wrap.isBorderBox || (css["min-height"] -= css["padding-bottom"]);
				this.$wrap.css(css);
				return this;
			};
			
			this.updStyle();
			
			// for window resize event
			vuwer.$window
			.on("resize", function(e, isTrigger) {
				(_self._fixTimer) && clearTimeout(_self._fixTimer);
				_self._fixTimer = setTimeout(_self.updStyle.bind(_self), !!isTrigger ? 0 : 50);
			});
			
			this.$self.css({
				position: "absolute",
				bottom: 0,
				left: 0
			}).addClass("fixed-bottom");
			
			return this;
		}
	});
	
}));