;(function (global, factory) {
	"use strict";
	factory(
		global.SC,
		global.Klass,
		global.app,
		global.vuwer,
		global.jQuery || global.$
	);
}(this, function(SC, Klass, app, vuwer, $) {
	"use strict";
	
	vuwer
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
					}, app.config.ajaxTimeoutTime));
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
		_addLoadListener: function($elm, cb) {
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
				!!SC && this._addLoadListener($post.find("iframe"), function() {
					SC.Widget(this).getCurrentSound(function(music) {
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
			return this.checkLoaded().then(function() {
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
			});
		}
	});
	
}));