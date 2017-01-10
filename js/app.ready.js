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
		
		$("#sns_links").on("click", function() {
			$(this).toggleClass("is-open");
		});
		
		app.parts.$nav
		.on("click", ".btn-about", function(e) {
			e.preventDefault();
		});
		
		return this;
	};
	
	// document.ready
	$(function() {
		app.parts = {
			$window: $(window),
			$body: $(document.body),
			$header: $("#site_header"),
			$nav: $("#site_nav"),
			$description: $("#description"),
			$footer: $("#site_footer")
		};
		
		// トップページ判定
		(function(clsList) {
			app.isTop = (
						clsList.indexOf("page-day") +
						clsList.indexOf("page-tag") +
						clsList.indexOf("page-search")
					) < 0;
			app.isTop && app.parts.$body.addClass("page-top");
		})( app.parts.$body.get(0).className.split(" ") );
		
		app._addDeviceInfoClass("body");
		
		// ページトップへ戻るボタン
		app.parts.$areaGoPageTop =
			app._initGoPageTop("<span class='icon-arrow' data-arrow='t'></span>");
		
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
		(typeof selector === "string") || (selector = "body");
		var addClassName = "device-" + this.device[0];
		(this.device.length > 1) && (addClassName += " os-" + this.device[1]);
		addClassName += " browser-" + this.browser[0];
		(this.browser.length > 1) && (addClassName += " " + this.browser.join(""));
		return $(selector).addClass(addClassName);
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
	app._initGoPageTop = function(arg) {
		arg = arg.replace(/\{root\}/g, app._relativePath);
		
		var
			viewSwitch = 100,
			$areaGoPageTop = $("<div/>").addClass("area-go-pageTop")
			.append(
				$("<a/>").addClass("go-pageTop hoverTarget").attr("href", "#")
				.html( $.parseHTML(arg) )
				.on("click", function(e) {
					e.preventDefault();
					
					//ページトップへ移動する
					$("html, body").animate({
						scrollTop: 0
					}, {
						duration: "slow"
					});
				})
			);
		
		$areaGoPageTop.appendTo("body");
		
		app.parts.$window.on("scroll", function() {
			// ボタンの表示・非表示の切り替え
			if( $(this).scrollTop() > viewSwitch ) {
				$areaGoPageTop.fadeIn("slow");
			} else {
				$areaGoPageTop.fadeOut("slow");
			}
		}).trigger("scroll");
		
		return $areaGoPageTop;
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

})(window.jQuery || window.$);