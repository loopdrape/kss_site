;(function($) {
	"use strict";
	
	if(!app) {
		return false;
	}
	
	app.switchView = function() {
		var hash = location.hash;
		(hash === "#about") && app.$gnav.find(".btn-about").trigger("click");
		(!hash || hash === "#about") && (hash = "#home");
		(/\/post\/|\/tagged\//).test(location.href) && (hash = "#posts");
		app.$container.removeClass(app.$container.get(0).className.split(" ").slice(1).join(" "))
		.addClass(hash.slice(1));
		app.$contents.children(".content").addClass("hide");
		$(hash).removeClass("hide");
		return this;
	};
	
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
		
		// [add event listener]
		app.$nav
		.on("click", ".btn-about", function(e) {
			e.preventDefault();
			var
				$this = $(this),
				flg = !$this.hasClass("active");
			
			$this.toggleClass("active", flg);
			if(flg) {
				app.$description.toggleClass("hide", !flg);
				setTimeout(function() {
					app.$contents.toggleFade(".description", flg);
					app.$container.hasClass("posts") && app.$contents.toggleFade(".posts", !flg)
					.then(function() {
						app.$contents.find(".posts").toggleClass("hide", flg);
					});
				}, 10);
			} else {
				app.$contents.toggleFade(".description", flg).then(function() {
					app.$description.toggleClass("hide", !flg);
				});
				if(app.$container.hasClass("posts")) {
					app.$contents.find(".posts").toggleClass("hide", flg);
					setTimeout(function() {
						app.$contents.toggleFade(".posts", !flg);
					}, 10);
				}
			}
		});
		
		(app.enablePopState) && (function() {
			$(window).on("popstate", function(e) {
				var state = e.originalEvent.state;
				app.cnlog("popstate", state);
				app.switchView();
			});
			
			$("#container").on("click", ".linkstate", function(e) {
				e.preventDefault();
				if(this.href === location.href) {
					return false;
				}
				history.pushState({}, app.name, this.href);
				app.switchView();
			});
		}).apply(app);
		
		return this;
	};
	
	// document.ready
	$(function() {
		app.parts = {
			$body: $(document.body),
			$header: $("#site_header"),
			$nav: $("#site_nav"),
			$description: $("#description")
		};
		
		app.switchView()._addEventListen();
	});
})(window.jQuery || window.$);