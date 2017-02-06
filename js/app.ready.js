;(function($) {
	"use strict";
	
	if(!app) {
		return false;
	}
	
	app.onReady(function() {
		if(app.isTop) {
			return $.ajax({
				type: "GET",
				url: "./_postList.html",
				dataType: "html"
			}).then(function(html) {
				$("#posts").html( $.parseHTML(html) );
			});
		}
	});
		
})(window.jQuery || window.$);