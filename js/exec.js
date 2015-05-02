(function($) {
	"use strict";
	
	window.app = new ClassApp("kss");
	app.$contents = $("#contents");
	app.switchView = function() {
		var hash = location.hash;
		(hash) || (hash = "#home");
		((/\/post\//).test(location.href)) && (hash = "#posts");
		app.$contents.children(".content").addClass("hide");
		$(hash).removeClass("hide");
		
		return this;
	};
	
	app._addEventListen = function() {
		// [video background]
//		$("#video_wrap").load("video", function(e) {
//			var $this = $(this);
//			if(!$this.children("video").is(":hidden")) {
//				$this.css("margin-left", "50%");
//			}
//		});
		
		// [add event listener]
		$("#footer").on("click", ".btn-about>a", function(e) {
			e.preventDefault();
			var
				$this = $(this),
				flg = !$this.hasClass("active");
			$this.toggleClass("active", flg);
			$("#description").toggleClass("hide", !flg);
		});
		
		(window.history && window.history.pushState) && (function() {
			$(window).on("popstate", function(e) {
				var state = e.originalEvent.state;
				console.log("popstate", state);
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
		})();
		
		return this;
	};
	
	// document.ready
	$(function() {
		app.switchView()._addEventListen();
	});
})(window.jQuery || window.$);