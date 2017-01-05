;(function($) {
	"use strict";
	
	if(!window.app || !window.moment) {
		return false;
	}
	
	function onDocumentReady(res) {
		app.parts = {
			$window: $(window),
			$body: app._addDeviceInfoClass("body"),
			$header: app._cleanupAfterWriteHTML("#site_header"),
			$main: $("#site_main"),
			$footer: app._cleanupAfterWriteHTML("#site_footer"),
			$breads: app._initBreadCrumbs("#list_bread")
		};
		
		// ページトップへ戻るボタン
		app.parts.$areaGoPageTop = app._initGoPageTop(app.config.scrollToTopElm);
		
		// スムーススクロール
		app._initSmoothScroll(function() {
			app.cnLog("scrolled.", this.offset().top);
		})
		._attachHoverStatus()
		._attachLink4SP();
		
		// コピーライト
		(function($cp) {
			if(!$cp.length) {
				return false;
			}
			$cp.html( $.parseHTML(app.config.copyright) );
			$cp.toyear = $cp.children(".toyear");
			$cp.nowY = moment().format("YYYY");
			if($cp.children(".fromyear").text() === $cp.nowY) {
				$cp.toyear.remove();
			} else {
				$cp.toyear.text( $cp.nowY );
			}
		})( $("#copyright") );
		
		// ポップアップ
		(app.popup) && app.popup.init(app);
	}
	
	// [app start]
	app.exec(onDocumentReady).then(function(flg) {
		if(flg === false) {
			// 第１引数がfalseの場合、エラーが発生している。（正常時はundefined）
			alert("申し訳ございませんが、サーバーでの処理に問題が発生しておりページを表示することができません。");
			return false;
		}
		
		app.parts.$body.addClass("is-ready");
		
		// CMS部分の描画時間を考慮して、処理を遅らせる
		setTimeout(function() {
			app.parts.$footer.footerFix();
			app.cnLog("app ready.");
		}, (app.cms) ? 100 : 1);
	});
	
	app.pushState = function(data, url) {
		if( window.WebAppBase.prototype.pushState.call(app, data, url) ) {
			(function(ga) {
				if(!ga) {
					return false;
				}
				
				ga("set", "page", url);
				ga("send", "pageview");
				app.cnLog("**** send ga pageview.", url);
			})(window.ga);
			return this;
		} else {
			return false;
		}
	};
	
	app.replaceState = function(data, url) {
		if( window.WebAppBase.prototype.replaceState.call(app, data, url) ) {
			(function(ga) {
				if(!ga) {
					return false;
				}
				
				ga("set", "page", url);
				ga("send", "pageview");
				app.cnLog("**** send ga pageview.", url);
			})(window.ga);
			return this;
		} else {
			return false;
		}
	};
	
	/*********************
	* set util functions *
	*********************/
	/*----------------
	* ローディング表示 ON
	* @return $.Deferred().promise()
	*/
	app.showLoading = function(str) {
		var df = $.Deferred();
		if(app._$loader) {
			if(!app._loadingBy) {
				app._loadingBy = str;
				app._$loader.fadeIn(400, function() {
					app.cnLog("showLoading", [str]);
					df.resolve();
				});
			} else {
				app.cnLog("  (kick showLoading " + str + ")");
				df.resolve();
			}
		} else {
			app._$loader = $("#page_loader");
			if(app._$loader.length) {
				if(app.browser[0] !== "ie" || parseInt(app.browser[1]) > 9) {
					app._$loader.cssLoader();
				}
				app._$loader.removeClass("hide");
				app._loadingBy = str;
				setTimeout(function() {
					app.cnLog("showLoading", [str]);
					df.resolve();
				}, 400);
			} else {
				delete app._$loader;
				df.resolve();
			}
		}
		return df.promise();
	};
	
	/*----------------
	* ローディング表示 OFF
	* @return $.Deferred().promise()
	*/
	app.hideLoading = function(str) {
		var df = $.Deferred();
		if(!app._$loader) {
			df.resolve();
		} else
		if(app._loadingBy === str) {
			app._$loader.fadeOut(400, function() {
				app.cnLog("hideLoading", [str]);
				delete app._loadingBy;
				df.resolve();
			});
		} else {
			app.cnLog("  (kick hideLoading " + str + ")");
			df.resolve();
		}
		return df.promise();
	};
	
	/**********************
	* set start functions *
	**********************/
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
	* app.writeHTMLの後始末
	*/
	app._cleanupAfterWriteHTML = function(selector) {
		var $area = $(selector);
		
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
	
	/*----------------
	* パンくずリスト
	*/
	app._initBreadCrumbs = function(selector) {
		var $breadList = $(selector);
		
		if(!$breadList.length) {
			app.cnLog("no bread list.");
			return true;
		}
		
		$breadList.children("li").eq(0).children("a").attr({
			href: app.config.rootpath
		});
		
		return $breadList;
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
	* attach hover status
	*/
	app._attachHoverStatus = function() {
		app.parts.$window.on("pageshow", function(e) {
			$(".is-hover").removeClass("is-hover");
		});
		
		app.parts.$body.data({
			hoverDecayTime: (app.device[0] === "sp") ? 250 : 0
		})
		.on("mouseenter touchstart", "a:not(.btn), .btn, .hoverTarget", function(e) {
			$(this).addClass("is-hover");
		})
		.on("mouseleave touchend", "a:not(.btn), .btn, .hoverTarget", function(e) {
			setTimeout( (function() {
				$(this).removeClass("is-hover");
			}).bind(this), app.parts.$body.data("hoverDecayTime") );
		});
		
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
	
})(window.jQuery || window.$);
