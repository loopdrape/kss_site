;(function($) {
	"use strict";
	
	if(!app || !Vuw) {
		return false;
	}
	
	/******************
	*    component    *
	******************/
	// vuwerオブジェクトの利用
	app.vuwer = Vuw.useVuwer()
	// [window]
	.setProp({
		_positionTrackings: [],
		positionTracking: function(vuw) {
			vuw.$pt = $("<div/>").addClass("position-tracker")
			.insertBefore(vuw.$self);
			vuw.state.fixStart = parseInt( vuw.$self.data("fix") );
			vuw.onChangeState(function(state) {
//				csl.log(this.name, "onChangeState", state);
				if( app.isNumber(state.current) ) {
					state.isFixed =
						state.current >= state.fixStart &&
						state.current <= (state.fixEnd || 0);
					
					this.$self.toggleClass("is-fixed", state.isFixed);
					delete state.current;
				}
			});
			
			this._positionTrackings.push(vuw.name);
		},
		updPtFixEnd: function(vuwName, h) {
			var vuw = this.get(vuwName);
			if(vuw.isReady) {
				return vuw.setState("fixEnd", vuw.$pt.offset().top - h);
			}
		},
		onScroll: function(vuwName, t) {
			var vuw = this.get(vuwName);
			if(vuw.isReady) {
				return vuw.setState("current", t);
			}
		},
		onReady: function($self) {
			$self
			.on("resize", function(e, isTrigger) {
				var
					$this = $(this),
					vuwer = $.data(this, "vuw"),
					h = $this.height();
				
				!!vuwer._resizeTimer && clearTimeout(vuwer._resizeTimer);
				vuwer._resizeTimer = setTimeout(function() {
					vuwer._positionTrackings.forEach(function(vuwName) {
						this.updPtFixEnd(vuwName, h);
					}, vuwer);
				}, !!isTrigger ? 0 : 100);
			})
			.on("scroll", function() {
				var
					$this = $(this),
					vuwer = $.data(this, "vuw"),
					t = $this.scrollTop();
				
				vuwer._positionTrackings.forEach(function(vuwName) {
					this.onScroll(vuwName, t);
				}, vuwer);
				
				!!vuwer._scrollTimer && clearTimeout(vuwer._scrollTimer);
				vuwer._scrollTimer = setTimeout(function() {
					$this.scrollTop(t + 10);
//					app.setScroll(t + 10);
				}, 100);
			});
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
			this.getVuwer().$window
			.on("pageshow", function(e) {
				$(".is-hover").removeClass("is-hover");
			});
			
			this.hoverDecayTime = (app.device[0] === "sp") ? 250 : 0;
			
			this.$self
			.on("mouseenter touchstart", "a:not(.btn), .btn, .hoverTarget", function(e) {
				$(this).addClass("is-hover");
			})
			.on("mouseleave touchend", "a:not(.btn), .btn, .hoverTarget", function(e) {
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
			$self.on("click", ".icon-keeshkas", function(e) {
				var vuw = $.data(e.delegateTarget, "vuw");
				e.preventDefault();
				if( vuw.getOther("nav").getState("isFixed") ) {
					vuw.getOther("switchNavLinks").$self.trigger("click", [true]);
				} else {
					vuw.getOther("scrollToPageTop").execScroll();
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
					"min-height": this.getVuwer().$window.outerHeight() - 1,
					"padding-bottom": this.$self.outerHeight(true)
				};
				this.$wrap.isBorderBox || (css["min-height"] -= css["padding-bottom"]);
				this.$wrap.css(css);
				return this;
			};
			
			this.updStyle();
			
			// for window resize event
			this.getVuwer().$window
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
			this.getVuwer().positionTracking(this);
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
					vuw = $.data(this, "vuw"),
					section = app.isString(isTrigger) ? isTrigger : "posts";
				vuw.setState("isChecked", this.checked);
				vuw.getOther("nav").setState("isLockFixed", this.checked);
				vuw.getOther("siteBody").setState("view", this.checked ? "" : section);
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
				var vuw = $.data(e.delegateTarget, "vuw");
				alert("focus inp");
				vuw.setState("focus", true);
			})
			.on("blur", ".inp-txt", function(e) {
				var vuw = $.data(e.delegateTarget, "vuw");
				vuw.setState("focus", false);
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
			.toggleClass("is-rockOpen", state.rockOpen)
			.closest(".link-list").toggleClass("is-form-focus", state.focus);
		}
	})
	
	// [btnSearch]
	.add("btnSearch", {
		selector: function() {
			return this.getOther("searchBox").$self.find(".btn-search");
		},
		onReady: function($self) {
			this.state.htmlFor = this.$self.attr("for");
			
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
				var vuw = $.data(this, "vuw");
				if(vuw.getState("htmlFor") === "inp_q") {
					e.preventDefault();
					vuw.getOther("searchBox").$inp.trigger("focus", [true]);
				}
			});
		},
		onChangeState: function(state) {
//			!!state.htmlFor && this.$self.attr("for", state.htmlFor);
		}
	})
	
	// [scrollToPageTop] ページトップへスクロールするボタン
	.add("scrollToPageTop", {
		selector: "#scroll_to_pageTop",
		onReady: function($self) {
			this.getVuwer().positionTracking(this);
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
			$.when.apply($, methods).then( (function() {
				csl.log("main bg loaded");
				this.getVuwer().$window.trigger("resize", [true]);
			}).bind(this) );
			
			this.$title = $self.children(".main-title");
			
			if(app.isTop) {
				this.getOther("body").onChangeState(function(state) {
					if(state.wndH && state.ttlH) {
						state.t = (state.wndH * 0.6 < state.ttlH) ? state.ttlH : "";
						csl.log("body.onChangeState", state);
						this.$self.css("padding-top", state.t);
						delete state.t;
					}
				});
				
				this.$mainBG = $self.children(".main-background");
				this.getVuwer().$window.on("resize", function(e, isTrigger) {
					var
						vuwer = $.data(this, "vuw"),
						secTitle =	vuwer.get("secTitle");
					
					!!secTitle._timer && clearTimeout(secTitle._timer);
					secTitle._timer = setTimeout(function() {
						vuwer.get("body").setState({
							wndH: vuwer.$window.height(),
							ttlH: secTitle.$mainBG.height()
						});
					}, !!isTrigger ? 0 : 100);
				});
			}
		},
		onChangeState: function(state) {
			("anime" in state) && this.$title.toggleClass("is-anime", !!state.anime);
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
				var vuw = $.data(e.delegateTarget, "vuw");
				vuw.getOther("switchNavLinks").$self.prop({
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
				csl.log("checkLoaded", "complete");
			});
		},
		addLoadListener: function($elm, cb) {
			if($elm && $elm.length & app.isFunction(cb)) {
				$.Deferred(function(df) {
					$elm.eq(0).on("load", df.resolve);
					setTimeout(df.resolve, 1000);
					return df.promise();
				}).then(function() {
					cb.call( $elm.get(0) );
				});
			}
		},
		scMap: {},
		postCheck: function($post) {
			var
				_self = this,
				postID = $post.attr("id");
			
			switch( $post.data("type") ) {
				case "audio":
					if($post.hasClass("soundcloud") && window.SC) {
						this.addLoadListener($post.find("iframe"), function() {
							window.SC.Widget(this).getCurrentSound(function(music) {
								$("<img/>").addClass("thumbnail").attr({
									src: music.artwork_url.replace('-large', '-t500x500'),
									alt: "artwork"
								}).appendTo($post);
								_self.scMap[postID] = music;
								csl.log("soundcloud", postID, music);
							});
						});
					}
					break;
			}
		},
		onReady: function($self) {
			var vuw = this;
//			return this.checkLoaded().then(function() {
				if( (/^index/).test(app.pageType) ) {
					vuw.$posts = $self.children(".post").each(function() {
						vuw.postCheck( $(this) );
					});
					if( (/\.top/).test(app.pageType) ) {
						vuw.$posts.eq(5).before(
							$("<div/>").addClass("post more-box").append(
								$("<a/>").addClass("icon-more-after").append(
									$("<span/>").text("more")
								)
							)
						);
					}
				}
//			});
		}
	});
	
	
})(window.jQuery || window.$);