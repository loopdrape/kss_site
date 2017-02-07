;(function($) {
	"use strict";
	
	if(!app) {
		return false;
	}
	
	 app.vuer.get("posts").setProp({
		checkLoaded: function() {
			var methods = [];
			this.$self.find("img, iframe, video").each(function() {
				var $this = $(this);
				methods.push( $.Deferred(function(df) {
					$.data($this.get(0), "timer", setTimeout(function() {
						$this.off(".check");
						df.resolve();
					}, 1000));
					$this.on("load.check", function() {
						clearTimeout( $.data(this, "timer") );
						df.resolve();
					});
					return df.promise();
				}) );
			});
			return $.when.apply($, methods);
		},
		onChangeState: function(state) {
			if(state.load) {
				return $.ajax({
					type: "GET",
					url: "./_postList.html",
					dataType: "html"
				}).then(function(html) {
					app.cnLog("_postList", "loaded");
					state.innerHTML = html;
					delete state.load;
				});
			}
		},
		render: function() {
			var html = this.getState("innerHTML");
			!!html && this.$self.html( $.parseHTML(html) );
		}
	});
	
	app.onReady(function() {
		$.when(function() {
			if(app.isTop) {
				return app.vuer.get("posts").setState("load", true);
			}
		}()).then(function() {
			return app.vuer.get("posts").checkLoaded();
		}).then(function() {
			app.cnLog("checkLoaded", "complete");
		});
	});
		
})(window.jQuery || window.$);