;(function($) {
	"use strict";
	
	if( !app || !Klass("Vuw") ) {
		return false;
	}
	
	/******************
	*    component    *
	******************/
	vuwer
	// [window]
	.setProp({
		onReady: function($window) {
//			$window
//			.on("resize", function(e, isTrigger) {
//				!!vuwer._resizeTimer && clearTimeout(vuwer._resizeTimer);
//				vuwer._resizeTimer = setTimeout(function() {
//				}, !!isTrigger ? 0 : 100);
//			});
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
			this.$title = $self.children(".main-title");
			this.$bgColor = $self.find(".bg-color");
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
		selector: "#site_body",
		onReady: function($self) {
		},
		onChangeState: function(state) {
			this.$self.attr({
				"data-view": state.view || ""
			});
		}
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
	})
	
	// [discription section]
	.add("secDescription", {
		selector: "#sec_description",
		onReady: function($self) {
			this._delay = parseFloat( $self.css("transition-duration") ) * 1000;
			
			$self.on("click", ".btn-close", function(e) {
				e.preventDefault();
				var vuw = $.data(e.delegateTarget, "vuw");
				vuw.getOther("siteBody").setState("view", "")
				.then( (function() {
					var df = $.Deferred();
					setTimeout(df.resolve, this._delay);
					return df.promise();
				}).bind(this) )
				.then(function() {
					vuw.getOther("siteBody").setState("view", "posts");
				});
			});
		}
	})
	
	// [link for show description]
	.add("showDescription", {
		selector: "#show_description",
		onReady: function($self) {
			$self.on("click", function(e) {
				e.preventDefault();
				vuwer.get("switchNavLinks.nav").$self.prop({
					checked: false
				}).trigger("change", ["description"]);
			});
		}
	});
	
})(window.jQuery || window.$);