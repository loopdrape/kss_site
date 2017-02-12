;(function($) {
	"use strict";
	
	if(!app || !app.Vue) {
		return false;
	}
	
	/******************
	*    component    *
	******************/
	// vuerオブジェクトの利用
	app.useVuer();
	app.vuer
	// [window]
	.setProp({
		_positionTrackings: [],
		positionTracking: function(vue) {
			vue.$pt = $("<div/>").addClass("position-tracker")
			.insertBefore(vue.$self);
			vue.state.fixStart = parseInt( vue.$self.data("fix") );
			vue.onChangeState(function(state) {
				app.cnLog(this.name, "onChangeState", state);
				if( app.isNumber(state.current) ) {
					state.isFixed =
						state.current >= state.fixStart &&
						state.current <= (state.fixEnd || 0);
					
					this.$self.toggleClass("is-fixed", state.isFixed);
					delete state.current;
				}
			});
			
			this._positionTrackings.push(vue.name);
		},
		updPtFixEnd: function(vueName, h) {
			var vue = this.get(vueName);
			if(vue.isReady) {
				return vue.setState("fixEnd", vue.$pt.offset().top - h);
			}
		},
		onScroll: function(vueName, t) {
			var vue = this.get(vueName);
			if(vue.isReady) {
				return vue.setState("current", t);
			}
		},
		onReady: function($self) {
			$self
			.on("resize", function(e, isTrigger) {
				var
					$this = $(this),
					vuer = $.data(this, "vue"),
					h = $this.height();
				
				!!vuer._resizeTimer && clearTimeout(vuer._resizeTimer);
				vuer._resizeTimer = setTimeout(function() {
					vuer._positionTrackings.forEach(function(vueName) {
						this.updPtFixEnd(vueName, h);
					}, vuer);
				}, !!isTrigger ? 0 : 100);
			})
			.on("scroll", function() {
				var
					$this = $(this),
					vuer = $.data(this, "vue"),
					t = $this.scrollTop();
				
				vuer._positionTrackings.forEach(function(vueName) {
					this.onScroll(vueName, t);
				}, vuer);
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
			._initSmoothScroll()
			._attachHoverStatus()
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
		_initSmoothScroll: function() {
			this.$self.on("click", "a", function(e) {
				var vue, $target;
				
				// ページ内リンクのクリック時のみ発火
				if(this.hash && this.origin + this.pathname === app.URL) {
					e.preventDefault();
					vue = $.data(e.delegateTarget, "vue");
					$target = $(this.hash);
					$("html, body").animate({
						scrollTop: $target.offset().top - 20
					}, {
						complete: app.isFunction(vue.smoothScrollCallBack) ? function() {
							// ブラウザによっては2回実行されるためclearTimeout処理で対応
							!!vue._smoothScrollTimer && clearTimeout(vue._smoothScrollTimer);
							vue._smoothScrollTimer = setTimeout(vue.smoothScrollCallBack.bind($target), 100);
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
		_attachHoverStatus: function() {
			this.getVuer().$window
			.on("pageshow", function(e) {
				$(".is-hover").removeClass("is-hover");
			});
			
			this.hoverDecayTime = (app.device[0] === "sp") ? 250 : 0;
			
			this.$self
			.on("mouseenter touchstart", "a:not(.btn), .btn, .hoverTarget", function(e) {
				$(this).addClass("is-hover");
			})
			.on("mouseleave touchend", "a:not(.btn), .btn, .hoverTarget", function(e) {
				var vue = $.data(e.delegateTarget, "vue");
				setTimeout( $.fn.removeClass.bind($(this), "is-hover"), vue.hoverDecayTime);
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
			$self.on("click", ".icon-keeshkas", function(e) {
				var vue = $.data(e.delegateTarget, "vue");
				e.preventDefault();
				if( vue.getOther("nav").getState("isFixed") ) {
					vue.getOther("switchNavLinks").$self.trigger("click", [true]);
				} else {
					vue.getOther("scrollToPageTop").execScroll();
				}
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
					"min-height": this.getVuer().$window.outerHeight() - 1,
					"padding-bottom": this.$self.outerHeight(true)
				};
				this.$wrap.isBorderBox || (css["min-height"] -= css["padding-bottom"]);
				this.$wrap.css(css);
				return this;
			};
			
			this.updStyle();
			
			// for window resize event
			this.getVuer().$window
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
	
	// [nav]
	.add("nav", {
		selector: "#site_nav",
		onReady: function($self) {
			this.getVuer().positionTracking(this);
		},
		onChangeState: function(state) {
			this.$self.toggleClass("lock-fixed", !!state.isLockFixed);
		}
	})
	
	// [switch for open nav]
	.add("switchNavLinks", {
		selector: "#show_nav_links",
		onReady: function($self) {
			this.$link = $self.closest(".btn-toggle");
			$self.on("change", function(e, isTrigger) {
				var
					vue = $.data(this, "vue"),
					section = app.isString(isTrigger) ? isTrigger : "posts";
				vue.setState("isChecked", this.checked);
				vue.getOther("nav").setState("isLockFixed", this.checked);
				vue.getOther("siteBody").setState("view", this.checked ? "" : section);
			});
		},
		onChangeState: function(state) {
			this.$link.toggleClass("is-checked", !!state.isChecked);
		}
	})
	
	// [searchBox]
	.add("searchBox", {
		selector: "#search_box",
		onReady: function($self) {
			$self
			.on("focus", ".inp-txt", function(e) {
				var vue = $.data(e.delegateTarget, "vue");
				vue.setState("focus", true);
			})
			.on("blur", ".inp-txt", function(e) {
				var vue = $.data(e.delegateTarget, "vue");
				vue.setState("focus", false);
			});
			
			this.$inp = $("#inp_q");
			
			this.getOther("nav").onChangeState(function(state) {
				this.getOther("searchBox").setState("rockOpen", !!state.isFixed);
			});
			this.state.focus = false;
		},
		onChangeState: function(state) {
			this.$self
			.toggleClass("is-focus", state.focus)
			.toggleClass("is-rockOpen", state.rockOpen);
		}
	})
	
	// [btnSearch]
	.add("btnSearch", {
		selector: function() {
			return this.getOther("searchBox").$self.find(".btn-search");
		},
		onReady: function($self) {
			this.getOther("searchBox").onChangeState(function(state) {
				var htmlFor;
				if(state.rockOpen) {
					htmlFor = "search_submit";
				} else {
					htmlFor = state.focus ? "search_submit" : "inp_q";
				}
				this.getOther("btnSearch").setState({
					htmlFor: htmlFor
				});
			});
			
			this.$self.on("click", function(e) {
				var vue = $.data(this, "vue");
				if(vue.getState("htmlFor") === "inp_q") {
					e.preventDefault();
					vue.getOther("searchBox").$inp.trigger("focus", [true]);
				}
			});
		},
		onChangeState: function(state) {
			!!state.htmlFor && this.$self.attr("for", state.htmlFor);
		}
	})
	
	// [scrollToPageTop] ページトップへスクロールするボタン
	.add("scrollToPageTop", {
		selector: "#scroll_to_pageTop",
		onReady: function($self) {
			this.getVuer().positionTracking(this);
		},
		execScroll: function() {
			this.$self.children(".btn-exec").trigger("click", [true]);
		}
	})
	
	// [title section] for index page
	.add("secTitle", {
		selector: "#sec_title",
		onReady: function($self) {
			var methods;
			if(!$self) {
				return false;
			}
			
			if(app.isTop) {
				this.getOther("body").onChangeState(function(state) {
					if(state.wndH && state.ttlH) {
						state.t = (state.wndH * 0.6 < state.ttlH) ? state.ttlH : "";
						app.cnLog("body.onChangeState", state);
						this.$self.css("padding-top", state.t);
						delete state.t;
					}
				});
				
				this.$mainBG = $self.children(".main-background");
				this.getVuer().$window.on("resize", function(e, isTrigger) {
					var
						vuer = $.data(this, "vue"),
						secTitle =	vuer.get("secTitle");
					!!secTitle._timer && clearTimeout(secTitle._timer);
					secTitle._timer = setTimeout(function() {
						vuer.get("body").setState({
							wndH: vuer.$window.height(),
							ttlH: secTitle.$mainBG.height()
						});
					}, !!isTrigger ? 0 : 100);
				});
				
				methods = [];
				methods.push( $.Deferred(function(df) {
					$("#main_bg_video").on("load", df.resolve);
					setTimeout(df.resolve, 1000);
					return df.promise();
				}) );
				methods.push( $.Deferred(function(df) {
					$("#main_bg_image").on("load", df.resolve);
					setTimeout(df.resolve, 1000);
					return df.promise();
				}) );
				return $.when.apply($, methods);
				
			} else {
				$self.children(".main-title").remove();
			}
		}
	})
	
	// [discription section]
	.add("secDescription", {
		selector: "#sec_description",
		onReady: function($self) {
			this._delay = parseFloat( $self.css("transition-duration") ) * 1000;
			
			$self.on("click", ".btn-close", function(e) {
				e.preventDefault();
				var vue = $.data(e.delegateTarget, "vue");
				vue.getOther("siteBody").setState("view", "")
				.then( (function() {
					var df = $.Deferred();
					setTimeout(df.resolve, this._delay);
					return df.promise();
				}).bind(this) )
				.then(function() {
					vue.getOther("siteBody").setState("view", "posts");
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
				var vue = $.data(e.delegateTarget, "vue");
				vue.getOther("switchNavLinks").$self.prop({
					checked: false
				}).trigger("change", ["description"]);
			});
		}
	})
	
	// [posts]
	.add("posts", {
		selector: "#posts",
		checkLoaded: function() {
			var methods = [];
			this.$self.find("img, iframe, video").each(function() {
				var $this = $(this);
				methods.push( $.Deferred(function(df) {
					$.data($this.get(0), "timer", setTimeout(function() {
						$this.off(".check");
						df.resolve();
					}, 1000));
					$this.on("load.check", function() {
						clearTimeout( $.data(this, "timer") );
						df.resolve();
					});
					return df.promise();
				}) );
			});
			return $.when.apply($, methods).then(function() {
				app.cnLog("checkLoaded", "complete");
			});
		},
		scBgi: function() {
			if(!window.SC) {
				return false;
			}
			this.$self.children(".soundcloud").each(function() {
				var t = {
					iframe: $(this).find("iframe").get(0)
				};
				if(t.iframe) {
					t.widget = window.SC.Widget(t.iframe);
				}
				if(t.widget) {
					t.widget.getCurrentSound(function(music) {
						t.artwork_url = music.artwork_url;
						app.cnLog(music.artwork_url);
					});
				}
			});
		},
		onReady: function($self) {
		}
	});
	
	
})(window.jQuery || window.$);