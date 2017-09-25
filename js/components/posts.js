;(function (global, factory) {
	"use strict";
	factory(
		global.Klass,
		global.app,
		global.vuwer,
		global.jQuery || global.$
	);
}(this, function(Klass, app, vuwer, $) {
	"use strict";
	
	vuwer.get("secPosts.contentsView")
	.add("posts", {
		selector: "#posts",
		onReady: function($self) {
			if(!$self) {
				return false;
			}
			
			$self.children("script").remove();
			
			this.echoThumnail( this.getAsArray( this.$self.children() ) );
		},
		_addInnerLoaded: function($elm) {
			var methods = [];
			$elm.find("img, iframe, video").each(function() {
				methods.push( $.Deferred( (function(df) {
					this.onload = df.resolve.bind(df);
					return df.promise();
				}).bind(this) ) );
			});
			
			$elm._promise = $.Deferred(function(df) {
				setTimeout(df.resolve.bind(df), 1000);
				$.when.apply($, methods).then( df.resolve.bind(df) );
				return df.promise();
			});
			$elm.onInnerLoad = function(fn) {
				Klass.isFunction(fn) && this._promise.then(fn);
				return this;
			};
			
			return this;
		},
		echoThumnail: function(elementList) {
			var items = [];
			if(this.isArray(elementList) && elementList.length) {
				elementList.forEach(function(elm) {
					var $elm = $(elm);
					if( !this.isFunction($elm.onInnerLoad) ) {
						this._addInnerLoaded($elm);
					}
					items.push($elm);
				}, this);
			}
			
			!!items.length && app.thumbs.addItems(items);
			
			return this;
		},
		_getPosts: function(src, callback) {
			if( !this.isString(src) || !src) {
				callback("no src.");
			}
			
			$.ajax({
				url: src,
				timeout: app.config.ajaxTimeoutTime,
				type: "GET",
				dataType: "html"
			}).then( (function(res) {
				var $posts = $( $.parseHTML(res) ).filter(this.selector);
				app.isFunction(callback) && callback( null, this.getAsArray( $posts.children() ) );
			}).bind(this), function() {
				var err = app.ajaxErrorCallback.apply(app, arguments);
				app.isFunction(callback) && callback(err);
			});
		},
		loadPosts: function(src) {
			var df = $.Deferred();
			this._getPosts(src, (function(err, posts) {
				if(err) {
					df.reject(err);
				} else {
					if( this.$self && this.isArray(posts) ) {
						$.fn.append.apply(this.$self, posts);
						this.echoThumnail(posts);
					}
					df.resolve(posts);
				}
			}).bind(this) );
			return df.promise();
		},
		replacePosts: function(src) {
			if(!this.$self) {
				return $.Deferred().reject();
			}
			
			this.$self.empty();
			app.thumbs.clearItems();
			return this.loadPosts(src);
		}
	}, function() {
		// appからアクセス出来る様にする
		app.posts = this;
	});
	
}));