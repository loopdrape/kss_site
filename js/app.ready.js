;(function($) {
	"use strict";
	
	if(!app) {
		return false;
	}
	
	app._addEventListen = function() {
		
		$("#show_description").on("click", function(e) {
			e.preventDefault();
			var $target = $.data(this, "target");
			if(!$target) {
				$target = $("#show_nav_links");
				$.data(this, "target", $target);
			}
			$target.trigger("click", [true]);
			app.parts.$siteBody.attr("data-view", "description");
		});
		
		$("#sec_description").on("click", ".btn-close", function(e) {
			e.preventDefault();
			var
				$this = $(this),
				delay = $this.data("delay");
			
			if(!delay) {
				delay = parseFloat( $this.css("transition-duration") ) * 1000;
				$this.data("delay", delay);
			}
			app.parts.$siteBody.attr("data-view", "");
			setTimeout(function() {
				app.parts.$siteBody.attr("data-view", "posts");
			}, delay);
		});
		
		app.isTop && app.parts.$window.on("resize", function(e, isTrigger) {
			!!app.parts.$body._timer && clearTimeout(app.parts.$body._timer);
			app.parts.$body._timer = setTimeout(function() {
				var t = {
					wh: app.parts.$window.height(),
					th: app.parts.$secTitle.height()
				};
				app.parts.$body.css({
					"padding-top": (t.wh * 0.6 < t.th) ? t.th : ""
				});
			}, 200);
		});
		
		return this;
	};
	
	app.onReady(function() {
		var methods = [];
		
		app.parts = {
			$window: $(window),
			$body: $(document.body),
			$siteHeader: $("#site_header"),
			$siteBody: $("#site_body"),
			$nav: $("#site_nav"),
			$searchBox: $("#search_box"),
			$siteFooter: $("#site_footer")
		};
		
		if(app.isTop) {
			app.parts.$secTitle = app.parts.$siteBody
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
			
			methods.push( $.ajax({
				type: "GET",
				url: "./_postList.html",
				dataType: "html"
			}).then(function(html) {
				$("#post_list").html( $.parseHTML(html) );
			}) );
		}
		
		return $.when.apply($, methods);
	});
		
})(window.jQuery || window.$);