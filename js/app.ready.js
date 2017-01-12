;(function($) {
	"use strict";
	
	if(!app) {
		return false;
	}
	
	app._addEventListen = function() {
/*
		app.$gnav.find(".btn-home>a")
		.toggleClass(".linkstate", (app.URL === app.config.root));
		
		// [video background]
		$("#video_wrap").load("video", function(e) {
			var $this = $(this);
			if(!$this.children("video").is(":hidden")) {
				$this.css("margin-left", "50%");
			}
		});
*/
		
		$("#show_sns_links").on("change", function() {
			app.parts.$body.toggleClass("is-slide-left", this.checked);
		});
		
		app.parts.$nav
		.on("click", ".btn-about", function(e) {
			e.preventDefault();
		});
		
		app.isTop && app.parts.$window.on("resize", function(e, isTrigger) {
			!!app.parts.$wrapper._timer && clearTimeout(app.parts.$wrapper._timer);
			app.parts.$wrapper._timer = setTimeout(function() {
				var t = {
					wh: app.parts.$window.height(),
					th: app.parts.$secTitle.height()
				};
				app.parts.$wrapper.css({
					"padding-top": (t.wh * 0.6 < t.th) ? t.th : ""
				});
			}, 200);
		});
		
		return this;
	};
	
	// document.ready
	$(function() {
		app.parts = {
			$window: $(window),
			$body: app._addDeviceInfoClass(document.body),
			$wrapper: $("#wrapper"),
			$siteHeader: $("#site_header"),
			$nav: $("#site_nav"),
			$description: $("#description"),
			$siteFooter: $("#site_footer")
		};
		
		// トップページ判定
		app.isTop = (function(clsList) {
			return (
				clsList.indexOf("page-day") +
				clsList.indexOf("page-tag") +
				clsList.indexOf("page-search")
			) < 0;
		})( app.parts.$body.get(0).className.split(" ") );
		
		app.LOG = true;
		app.isTop && (function() {
			var methods = [];
			app.parts.$body.addClass("page-top");
			app.parts.$secTitle = app.parts.$wrapper
			.children(".section[data-section='title']");
			
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
			$.when(methods).then(function() {
				app.parts.$window.trigger("resize", [true]);
				setTimeout(function() {
					app.parts.$body.addClass("is-ready");
				}, 100);
			});
		})();
		
		// ページトップへ戻るボタン
		app._initScrollToPageTop("<span class='icon-arrow' data-arrow='t'></span>");
		
		// スムーススクロール
		app._initSmoothScroll(function() {
			app.cnLog("scrolled.", this.offset().top);
		})
		._attachLink4SP()
		._addEventListen();
	});
	
	
	/*****************
	* util functions *
	*****************/
	/*----------------
	* 端末情報をクラス名として登録
	*/
	app._addDeviceInfoClass = function(selector) {
		!selector && (selector = document.body);
		var $target, addClassName;
		if(selector instanceof jQuery) {
			$target = selector;
		} else {
			$target = $(selector);
		}
		
		if(!$target.length) {
			return $target;
		}
		
		addClassName = "device-" + this.device[0];
		(this.device.length > 1) && (addClassName += " os-" + this.device[1]);
		addClassName += " browser-" + this.browser[0];
		(this.browser.length > 1) && (addClassName += " " + this.browser.join(""));
		return $target.addClass(addClassName);
	};
	
	/*----------------
	* smooth scroll
	*/
	app._initSmoothScroll = function(completeCallBack) {
		this._smoothScrollCallBack = completeCallBack;
		
		$("body").on("click", "a", function(e) {
			var $target, tmp;
			
			if(!this.hash) {
				return true;
			}
			
			// ページ内リンクのクリック時のみ発火
			tmp = this.href.replace(this.hash, "").replace(app.URL, "").split("?")[0];
			if(!tmp || tmp.split(".")[0] === "index") {
				e.preventDefault();
				
				$target = $(this.hash);
				$("html, body").animate({
					scrollTop: $target.offset().top - 20
				}, {
					complete: (typeof app._smoothScrollCallBack !== "function") ? null : function() {
						// ブラウザによっては2回実行されるためclearTimeout処理で対応
						(app._smoothScrollTimer) && clearTimeout(app._smoothScrollTimer);
						app._smoothScrollTimer = setTimeout(app._smoothScrollCallBack.bind($target), 100);
					},
					duration: 600
				});
			}
		});
		
		return this;
	};
	
	/*----------------
	* scroll to pageTop button
	*/
	app._initScrollToPageTop = function(strHtml) {
		strHtml = strHtml.replace(/\{root\}/g, app._relativePath);
		
		var $scrollToPageTop = $("<div/>").addClass("scroll-to-pageTop is-hide")
		.append(
			$("<a/>").addClass("btn-exec").attr("href", "#")
			.html( $.parseHTML(strHtml) )
			.on("click", function(e) {
				e.preventDefault();
				
				//ページトップへ移動する
//				$("html, body").animate({
				app.parts.$wrapper.animate({
					scrollTop: 0
				}, {
					duration: "slow"
				});
			})
		);
		
		app.parts.$scrollToPageTop = $scrollToPageTop.attr({
			"data-trigger": 100
		}).appendTo(app.parts.$body);
		
//		app.parts.$window.on("scroll", function() {
		app.parts.$wrapper.on("scroll", function() {
			// ボタンの表示・非表示の切り替え
			var viewSwitch = app.parts.$scrollToPageTop.data("trigger");
			(typeof viewSwitch === "number") || ( viewSwitch = parseInt(viewSwitch) );
			app.parts.$scrollToPageTop.toggleClass("is-hide", $(this).scrollTop() < viewSwitch);
		}).trigger("scroll");
		
		return this;
	};
	
	/*----------------
	* スマートフォンの場合のみリンクとなる要素
	* 動作条件：「link4SP」というclassを付ける　data-hrefにリンク先URLを記述する
	*（例）<span class="link4SP" data-href="tel:電話番号">電話番号</span>
	*/
	app._attachLink4SP = function() {
		app.parts.$body.on("click", ".link4SP", function() {
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
	};

	/*----------------
	* footerをbodyの最下部に表示させる
	*/
	$.fn.footerFix = function() {
		var
			$this = this,
			$elmWrap = $this.parent(),
			addCss;
		
		$this.getAddStyle = function() {
			var rtn = {
				"min-height": $(window).outerHeight() - 1,
				"padding-bottom": $this.outerHeight(true)
			};
			$elmWrap.isBorderBox || (rtn["min-height"] -= rtn["padding-bottom"]);
			return rtn;
		};
		($elmWrap.length > 1) && ($elmWrap = $elmWrap.eq(0));
		$elmWrap.isBorderBox = ($elmWrap.css("box-sizing") === "border-box") ? true : false;
		addCss = $this.getAddStyle();
		($elmWrap.css("position") === "static") && (addCss.position = "relative");
		$elmWrap.css(addCss);
		
		// for window resize event
		$(window).on("resize", function() {
			($this.timer) && clearTimeout($this.timer);
			$this.timer = setTimeout(function() {
				addCss = $this.getAddStyle();
				$elmWrap.css(addCss);
			}, 100);
		});
		
		return $this.css({
			position: "absolute",
			bottom: 0,
			left: 0,
			width: "100%"
		}).addClass("fixed-footer");
	};
})(window.jQuery || window.$);