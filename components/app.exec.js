;(function($) {
	"use strict";
	
	if(!window.app || !app.Component) {
		return false;
	}
	
	// componentsオブジェクトの利用
	(function() {
		app.useComponents();
		app.components
		// [window]
		.add("window", {
			selector: function() {
				return $(window);
			},
			onReady: function($elm) {
			}
		})
		
		// [body]
		.add("body", {
			selector: function() {
				return $(document.body);
			},
			onReady: function($elm) {
				this
				._addDeviceInfoClass()
				._initSmoothScroll($elm)
				._attachHoverStatus($elm)
				._attachLink4SP($elm);
			},
			// [端末情報をクラス名として登録]
			_addDeviceInfoClass: function() {
				var classList = [];
				classList.push("device-" + app.device[0]);
				(app.device.length > 1) && classList.push("os-" + app.device[1]);
				classList.push("browser-" + app.browser[0]);
				(app.browser.length > 1) && classList.push( app.browser.join("") );
				this.$elm.addClass( classList.join(" ") );
				return this;
			},
			
			// [smooth scroll]
			_initSmoothScroll: function($elm) {
				var _self = this;
				$elm.on("click", "a", function(e) {
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
			_attachHoverStatus: function($elm) {
				var _self = this;
				_self.getOther("window").$elm.on("pageshow", function(e) {
					$(".is-hover").removeClass("is-hover");
				});
				
				_self.hoverDecayTime = (app.device[0] === "sp") ? 250 : 0;
				
				$elm
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
			_attachLink4SP: function($elm) {
				$elm.on("click", ".link4SP", function() {
					var t = {
						href: $(this).data("href"),
						blank: $(this).data("target") === "_blank" ? true : false
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
			onReady: function($elm) {
				app.cleanupAfterWriteHTML($elm);
			}
		})
		
		// [breadList] パンくずリスト
		.add("breadList", {
			selector: "#bread_list",
			onReady: function($elm) {
				if($elm) {
					this.$children = $elm.children();
				} else {
					app.cnLog("no bread list.");
				}
			},
			getChildren: function(selector) {
				if( selector && app.isString(selector) ) {
					return this.$elm.children(selector);
				} else {
					return this.$children;
				}
			},
			getLevel: function() {
				return this.$children.length;
			},
			upLevel: function(length) {
				app.isInteger(length) || (length = 1);
				this.getChildren().eq(length * -1).remove();
				return this;
			},
			addChild: function(opt) {
				(typeof opt === "object") || (opt = {});
				opt = Object.assign({
					text: "",
					className: "",
					href: "",
					target: "_self"
				}, opt);
				
				opt.$elm = $("<span/>").text(opt.text);
				!!opt.href && ( opt.$elm = $("<a/>").attr("target", opt.target).append(opt.$elm) );
				opt.$newChild = $("<li/>").append(opt.$elm);
				( opt.className && app.isString(opt.className) ) && opt.$newChild.addClass(opt.className);
				
				this.$elm.append(opt.$newChild);
				// 選択肢情報の更新
				this.$children = this.$elm.children();
				return opt.$newChild;
			}
		})
		
		// [main]
		.add("main", {
			selector: "#site_main",
			onReady: function($elm) {
			}
		})
		
		// [siteFooter]
		.add("siteFooter", {
			selector: "#site_footer",
			onReady: function($elm) {
				app.cleanupAfterWriteHTML($elm);
			},
			fixBottom: function() {
				var _self = this;
				
				// 親要素を格納
				this.$wrap = this.$elm.parent();
				(this.$wrap.length > 1) && ( this.$wrap = this.$wrap.eq(0) );
				(this.$wrap.css("position") === "static") && this.$wrap.css("position", "relative");
				this.$wrap.isBorderBox = (this.$wrap.css("box-sizing") === "border-box") ? true : false;
				
				// 更新スタイル取得関数
				this.updStyle = function() {
					var css = {
						"min-height": this.getOther("window").$elm.outerHeight() - 1,
						"padding-bottom": this.$elm.outerHeight(true)
					};
					this.$wrap.isBorderBox || (css["min-height"] -= css["padding-bottom"]);
					this.$wrap.css(css);
					return this;
				};
				
				this.updStyle();
				
				// for window resize event
				this.getOther("window").$elm
				.on("resize", function() {
					(_self._fixTimer) && clearTimeout(_self._fixTimer);
					_self._fixTimer = setTimeout(_self.updStyle.bind(_self), 100);
				});
				
				this.$elm.css({
					position: "absolute",
					bottom: 0,
					left: 0
				}).addClass("fixed-bottom");
				
				return this;
			}
		})
		
		// [copyright]
		.add("copyright", {
			selector: "#copyright",
			onReady: function($elm) {
				if($elm && window.moment) {
					$elm.toyear = $elm.children(".toyear");
					$elm.nowY = window.moment().format("YYYY");
					if($elm.children(".fromyear").text() === $elm.nowY) {
						$elm.toyear.remove();
					} else {
						$elm.toyear.text( $elm.nowY );
					}
				}
			}
		})
		
		// [scrollToPageTop] ページトップへスクロールするボタン
		.add("scrollToPageTop", {
			selector: function() {
				var
					$body = this.getOther("body").$elm,
					bodyId = $body.attr("id"),
//					strHTML = app.config.scrollToTopElm.replace(/\{root\}/g, app._relativePath);
					strHTML = "<span class='icon-arrow-t-before'></span>";
				
				if(!bodyId) {
					bodyId = "page_top";
					$body.attr("id", bodyId);
				}
				
				return $("<div/>").addClass("scroll-to-pageTop")
				.append(
					// clickでスムーススクロール
					$("<a/>").addClass("scroll-trigger hoverTarget").attr({
						href: "#" + bodyId
					}).html( $.parseHTML(strHTML) )
				).appendTo($body);
			},
			viewSwitch: 100,
			fadeTime: 600,
			onReady: function() {
				var _self = this;
				this.getOther("window").$elm.on("scroll", function() {
					var method = ( $(this).scrollTop() > _self.viewSwitch ) ? "fadeIn" : "fadeOut";
					// ボタンの表示・非表示の切り替え
					_self.$elm[method](_self.fadeTime);
				}).trigger("scroll");
			}
		})
		
		// [pageLoader]
		.add("pageLoader", {
			selector: "#page_loader",
			delay: 1,
			onReady: function($elm) {
				var delay;
				if($elm) {
					$elm.attr("data-visible", "0").removeClass("hide");
					delay = parseFloat( $elm.css("transition-duration") );
					if( !isNaN(delay) ) {
						this.delay += delay * 1000;
					}
					
					if(app.browser[0] !== "ie" || app.browser[1] > 9) {
						$elm.cssLoader();
					}
				}
			},
			show: function(cb) {
				if(this.$elm) {
					app.isFunction(cb) || (cb = function() {});
					// CSSアニメーション様に処理をずらす
					this.$elm.attr("data-visible", "");
					setTimeout( (function() {
						this.$elm.attr("data-visible", "1");
						setTimeout(cb.bind(this), this.delay);
					}).bind(this), 0);
				} else {
					app.cnWarn("pageLoader.show", "$elm is false.");
					cb.call(this);
				}
				return this;
			},
			hide: function(cb) {
				if(this.$elm) {
					app.isFunction(cb) || (cb = function() {});
					this.$elm.attr("data-visible", "");
					setTimeout( (function() {
						this.$elm.attr("data-visible", "0");
						cb.call(this);
					}).bind(this), this.delay);
				} else {
					app.cnWarn("pageLoader.hide", "$elm is false.");
					cb.call(this);
				}
				return this;
			}
		});
	})();
	
	
	// ** override ** (don't use CMS.)
	app.loadConfig = function() {
		return true;
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
	
	/******************
	*    app start    *
	******************/
	app.exec(function() {
		// ポップアップ
		(app.popup) && app.popup.init(app);
		
		// コンポーネント
		return app.components.getReady();
//		.then(function(res) {
//			app.cnLog("components.getReady()", res);
//		});
	}).then(function(flg) {
		app.components.get("body").$elm.addClass("is-ready");
		
		setTimeout(function() {
			app.components.get("siteFooter").fixBottom();
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
			pageLoader = app.components.get("pageLoader");
		
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
			pageLoader = app.components.get("pageLoader");
		
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
	
	/*----------------
	* app.writeHTMLの後始末
	*/
	app.cleanupAfterWriteHTML = function(selector) {
		var $area = (selector instanceof $) ? selector: $(selector);
		
		if(!$area.length) {
			return false;
		}
		
		$area.children("script").remove();
		
		$area.find("a").each(function() {
			if(this.href === app.URL) {
				$(this).addClass("is-current");
			}
		});
		
		return $area;
	};
	
})(window.jQuery || window.$);
