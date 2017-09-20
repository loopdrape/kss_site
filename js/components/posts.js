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
	
	vuwer
	.add("posts", {
		selector: "#posts",
		_addInnerLoaded: function($elm) {
			var methods = [];
			$elm.find("img, iframe, video").each(function() {
				methods.push( $.Deferred( (function(df) {
					this.onload = df.resolve.bind(df);
					return df.promise();
				}).bind(this) ) );
			});
			
			$elm._promise = $.Deferred(function(df) {
				setTimeout(function() {
					csl.log.gray($elm.attr("id") + ": timeout");
					df.resolve();
				}, app.config.ajaxTimeoutTime);
				$.when.apply($, methods).then( df.resolve.bind(df) );
				return df.promise();
			});
			$elm.onInnerLoad = function(fn) {
				Klass.isFunction(fn) && this._promise.then(fn);
				return this;
			};
			
			return this;
		},
		onReady: function($self) {
			var items;
			
			if(!$self) {
				return false;
			}
			
			$self.children("script").remove();
			
			items = [];
			$self.children().each( (function(i, elm) {
				var $elm = $(elm);
				this._addInnerLoaded($elm);
				items.push($elm);
			}).bind(this) );
			
			app.thumbs.addItems(items);
		}
	});
	
}));