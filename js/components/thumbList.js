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
	
	vuwer.get("siteBody")
	.add("thumbList", {
		selector: "#thumb_list",
		onChangeState: function(state) {
			var list;
			if( !this.isArray(state.items) || !state.items.length ) {
				return false;
			}
			
			csl.log.blue(this.name + ": new items", state.items.length);
			list = [];
			state.items.forEach( (function($artcl) {
				var
					artclID = $artcl.attr("id"),
					$li = $("<li/>").attr({
						"data-id": artclID
					}).addClass( $artcl.get(0).className.replace(/^post /, "") ),
					$a = $artcl.children(".permalink").appendTo($li),
					$imgFrame = $("<span/>").addClass("img-frame").appendTo($a),
					$ttl = $artcl.find(".entry-title").clone();
				
				$ttl.children(".date").replaceWith(function() {
					return $(this).children().addClass(this.className);
				});
				$ttl.children().appendTo($a);
				
				$artcl.onInnerLoad(
					this._createThumbnail.bind(this, $artcl, function($img) {
						$img.appendTo($imgFrame);
						csl.log.gray("thumbnail: " + artclID);
					})
				);
				
				list.push($li);
			}).bind(this) );
			
			!!list.length && $.fn.append.apply(this.$self, list);
		},
		addItems: function(items) {
			return this.setState({
				items: items
			});
		},
		_createThumbnail: function($artcl, callback) {
			var postID = $artcl.attr("id");
			
			return $.Deferred(function(df) {
				var $elm, bgi;
				if($artcl.data("type") === "audio" && $artcl.hasClass("soundcloud") ) {
					if(SC) {
						$elm = $artcl.find("iframe");
						if($elm.length) {
							SC.Widget( $elm.get(0) ).getCurrentSound(function(music) {
								df.resolve( music.artwork_url.replace("-large", "-t500x500") );
							});
						} else {
							df.reject();
						}
					} else {
						df.reject();
					}
				} else {
					$elm = $artcl.find("img").eq(0);
					if($elm.length) {
						df.resolve( $elm.attr("src") );
					} else {
						df.reject();
					}
				}
				return df.promise();
			})
			.then(function(imgURL) {
				var $img = $("<img/>").attr({
					src: imgURL,
					alt: "thumbnail"
				});
				
				Klass.isFunction(callback) && callback($img);
			});
		}
	}, function() {
		// appからアクセス出来る様にする
		app.thumbs = this;
	});
	
}));