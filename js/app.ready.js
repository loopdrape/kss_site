;(function($) {
	"use strict";
	
	if(!app) {
		return false;
	}
	
/*
	app.vuer.get("posts").setProp({
		onReady: function($self) {
			var vue = this;
			if(app.isTop) {
				return $.ajax({
					type: "GET",
					url: "./_postList.html",
					dataType: "html"
				}).then(function(html) {
					app.cnLog("_postList", "loaded");
					$self.html( $.parseHTML(html) );
				});
			}
		}
	});
*/
})(window.jQuery || window.$);