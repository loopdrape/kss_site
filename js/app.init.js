;(function() {
	"use strict";
	
	window.app = new ApplicationBase("kss", {
		prod: "keeshkassoundservice.tumblr.com",
		dev: "root"
	});
	
	app.writeHTML = function(htmlFile, cache) {
		var
			literal = /\{root\}/g,	// {root}
			isAutopath = ( literal.test(htmlFile) || (/^\/|^\./).test(htmlFile) ) ? false : true,
			req = {
				type: "GET",
				url: (isAutopath) ? app._relativePath + "/" + htmlFile : htmlFile,
				async: false
			},
			xmlHttp = new XMLHttpRequest();
		
		req.url = req.url.replace(literal, app._relativePath);
		(cache) || ( req.url += "?_=" + String( (new Date()).valueOf() ) );
		xmlHttp.open(req.type, req.url, req.async);
		xmlHttp.send(null);
		document.write(xmlHttp.responseText.replace(literal, app._relativePath));
	};
	
	// 共通画像のプリロード
	(function() {
		var
			arrImgs, arrLoaded, i, len,
			loaded = function(flg, src) {
				arrLoaded = Object.keys(app.preloadedImgs);
				(arrLoaded.length === len) && app.cnLog("preload success.", arrLoaded);
			};
		
		arrImgs = [
			// プリロード画像の記述
		];
		len = arrImgs.length;
		
		for(i = 0; i < len; i++) {
			app.imgPreload(app._relativePath + arrImgs[i], loaded);
		}
	})();
	
	// Google Analytics
	(window.loadGoogleAnalytics) && (function(trackingID) {
		(app._environment === "prod") && window.loadGoogleAnalytics(trackingID);
	})("");
})();