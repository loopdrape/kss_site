;(function($) {
	"use strict";
	
	if( !app || !Klass("Vuw") ) {
		return false;
	}
	
	// [vuwerオブジェクトの利用]
	Klass("Vuw").useVuwer();
	
	/******************
	*    component    *
	******************/
	vuwer
	// [window]
	.setProp({
		onReady: function($window) {
			$window
			.on("resize", function(e, isTrigger) {
				!!vuwer._resizeTimer && clearTimeout(vuwer._resizeTimer);
				vuwer._resizeTimer = setTimeout(function() {
					vuwer.centerX = $window.outerWidth() / 2;
				}, !!isTrigger ? 0 : 100);
			});
			
/*
			if(app.device[0] === "sp") {
				window.addEventListener("deviceorientation", function(e) {
					!!vuwer._slopeTimer && clearTimeout(vuwer._slopeTimer);
					vuwer._slopeTimer = setTimeout(function() {
						vuwer.get("secTitle").setState({
							slopeX: e.gamma / 4
						});
					}, 0);
				}, false);
			} else {
				$window.on("mousemove", function(e) {
					if( !vuwer.isNumber(vuwer.centerX) ) {
						return true;
					}
					
					!!vuwer._slopeTimer && clearTimeout(vuwer._slopeTimer);
					vuwer._slopeTimer = setTimeout(function() {
						vuwer.get("secTitle").setState({
							slopeX: (e.clientX - vuwer.centerX) / 200
						});
					}, 0);
				});
			}
*/
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
			$self.on("click", ".icon-keeshkas", function(e) {
				e.preventDefault();
				if( vuwer.$window.scrollTop() < 10 ) {
					vuwer.get("switchNavLinks.nav").$self.trigger("click", [true]);
				} else {
					vuwer.get("scrollToPageTop").execScroll();
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
	
	// [nav]
	.add("nav", {
		selector: "#site_nav",
		onReady: function($self) {
//			app.positionTracker.tracking(this, false, true);
		},
		onChangeState: function(state) {
			var tmp = {};
			
			tmp.searchBox = this.get("searchBox");
			if(tmp.searchBox.getState("rockOpen") !== state.isFixed) {
				tmp.methods = [];
				tmp.methods.push( tmp.searchBox.setState("rockOpen", !!state.isFixed) );
				
				tmp.btnSearch = this.get("btnSearch");
				if( state.isFixed || tmp.btnSearch.getState("focus") ) {
					tmp.htmlFor = "search_submit";
				} else {
					tmp.htmlFor = "inp_q";
				}
				tmp.methods.push( tmp.btnSearch.setState("htmlFor",  tmp.htmlFor) );
				
				return $.when.apply($, tmp.methods);
			}
		}
	}, function() {
		// ** add child vuw **
		this
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
					vuwer.get("body").setState("lockScroll", this.checked);
					vuwer.get("siteBody").setState("view", this.checked ? "" : section);
				});
			},
			onChangeState: function(state) {
				if(typeof state.isChecked === "boolean") {
					this.$link.toggleClass("is-checked", !!state.isChecked);
					delete state.isChecked;
				}
			}
		})
		
		// [searchBox]
		.add("searchBox", {
			selector: "#search_box",
			onReady: function($self) {
				$self
				.on("click", ".inp-txt", function(e, isTrigger) {
					var vuw = $.data(e.delegateTarget, "vuw");
					vuw.setState("focus", true);
					!!isTrigger && $(this).trigger("focus", [true]);
				})
				.on("blur", ".inp-txt", function(e) {
					var vuw = $.data(e.delegateTarget, "vuw");
					vuw.setState("focus", false);
				});
				
				this.$inp = $("#inp_q");
				
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
				
				this.$self.on("click", function(e) {
					var vuw = $.data(this, "vuw");
					if(vuw.getState("htmlFor") === "inp_q") {
						e.preventDefault();
						vuw.getOther("searchBox").$inp.trigger("click", [true]);
					}
				});
			},
			onChangeState: function(state) {
				!!state.htmlFor && this.$self.attr("for", state.htmlFor);
			}
		});
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
	
	// [title section]
	.add("secTitle", {
		selector: "#sec_title",
		onReady: function($self) {
			this.$title = $self.children(".main-title");
			this.$bgColor = $self.find(".bg-color");
		},
		onChangeState: function(state) {
			if("anime" in state) {
				this.$title.toggleClass("is-anime", !!state.anime);
				delete state.anime;
			}
			
			if("slopeX" in state) {
				this.$title.css({
					transform: "translateX(" + (state.slopeX * -0.1) + "%)"
				});
				this.$bgColor.css({
					transform: "translateX(" + (state.slopeX * -0.3) + "%)"
				});
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
				$elm = $elm.eq(0);
				$.Deferred(function(df) {
					$elm.on("load.once", df.resolve);
					setTimeout(function() {
						$elm.off(".once");
						df.resolve();
					}, 3000);
					return df.promise();
				}).then(function() {
					cb.call( $elm.get(0) );
				});
			}
		},
		createThumbnail: function($post) {
			var
				_self = this,
				postID = $post.attr("id"),
				$thumb, bgi;
			
			if($post.data("type") === "audio" && $post.hasClass("soundcloud") ) {
				if(window.SC) {
					this.addLoadListener($post.find("iframe"), function() {
						window.SC.Widget(this).getCurrentSound(function(music) {
							bgi = "url(" + music.artwork_url.replace("-large", "-t500x500") + ")";
							$("<div/>").addClass("post-background").css({
								"background-image": bgi
							}).appendTo($post);
							
							$post.children(".entry-header").prepend(
								$("<div/>").addClass("thumbnail").css({
									"background-image": bgi
								})
							);
						});
					});
				}
			} else {
				$thumb = $post.find("img").eq(0);
				if($thumb.length) {
					bgi = "url(" + $thumb.attr("src") + ")";
					$thumb = $("<div/>").addClass("post-background").css({
						"background-image": bgi
					}).appendTo($post);
					
					$post.children(".entry-header").prepend(
						$("<div/>").addClass("thumbnail").css({
							"background-image": bgi
						})
					);
				}
			}
		},
		onReady: function($self) {
			var vuw = this;
			$self.children("script").remove();
//			return this.checkLoaded().then(function() {
				if( (/^index/).test(app.pageType) ) {
					vuw.$posts = $self.children(".post").each(function() {
						vuw.createThumbnail( $(this) );
					});
					(/\.top/).test(app.pageType) && (function() {
						var $more = $("<div/>").addClass("post more-box")
						.append( $("<a/>").addClass("load-next").attr("href", "./") );
						
						$more.clone().append(
							$("<p/>").addClass("icon-more-after").append(
								$("<span/>").text("more")
							)
						).insertBefore( vuw.$posts.eq(5) );
						
						$more.append(
							$("<p/>").addClass("icon-arrow-after").attr({
								"data-arrow": "r"
							}).append(
								$("<span/>").text("more")
							)
						).insertAfter( vuw.$posts.eq(-1) );
						
						$self.on("click", ".load-next", function(e) {
							var $more = $(this).parent();
							if( $more.next().length ) {
								e.preventDefault();
								$more.remove();
							}
						});
					})();
				}
//			});
		}
	});
	
	
})(window.jQuery || window.$);