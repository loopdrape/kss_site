(function($) {
	"use strict";
	
	window.app = new ApplicationBase("kss");
	app.root = "http://keeshkassoundservice.tumblr.com/";
	app.$container = $("#container");
	app.$header = $("#header");
	app.$gnav = $("#gnav");
	app.$contents = $("#contents");
	
	app.enablePopState = (window.history && window.history.pushState) ? true : false;
	
	app.switchView = function() {
		var hash = location.hash;
		(hash) || (hash = "#home");
		(/\/post\/|\/tagged\//).test(location.href) && (hash = "#posts");
		app.$container.removeClass(app.$container.get(0).className.split(" ").slice(1).join(" "))
		.addClass(hash.slice(1));
		app.$contents.children(".content").addClass("hide");
		$(hash).removeClass("hide");
		return this;
	};
	
	app._addEventListen = function() {
		app.$gnav.find(".btn-home>a").toggleClass(".linkstate", (app.URL === app.root));
		
		// [video background]
//		$("#video_wrap").load("video", function(e) {
//			var $this = $(this);
//			if(!$this.children("video").is(":hidden")) {
//				$this.css("margin-left", "50%");
//			}
//		});
		
		// [add event listener]
		app.$gnav
		.on("click", ".btn-about", function(e) {
			e.preventDefault();
			var
				$this = $(this),
				flg = !$this.hasClass("active");
			$this.toggleClass("active", flg);
			$("#description").toggleClass("hide", !flg);
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
		app.switchView()._addEventListen();
	});
})(window.jQuery || window.$);