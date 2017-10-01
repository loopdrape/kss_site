;(function (global, factory) {
	"use strict";
	global.app = factory(global.Klass);
}(this, function(Klass) {
	"use strict";
	
	var
		gaTrackingID = "",
		app = Klass.new_("WebAppBase", "KSS", {
			prod: "keeshkassoundservice.tumblr.com",
			test: "kss_site",
			dev: location.hostname === "127.0.0.1" ? location.host : false
		}),
		currentSctipt = (function() {
			// get current <script/>
			var scripts = document.getElementsByTagName("script");
			return scripts[scripts.length - 1];
		}).call(this),
		endpoint = (app._environment === "prod") ? "//loopdrape.github.io/kss_site" : "",
		path = currentSctipt.getAttribute("data-package");
	
	(app._environment === "prod") || csl.on("log");
	csl.on("warn");
	
	if(!path) {
		alert("設定ファイルが未指定です");
		return false;
	}
	
	app.config.ajaxTimeoutTime = 5000;
	app.config.siteTitle = document.title.split(" // ").pop();
	
	// [Google Analytics]
	!!gaTrackingID && app.require(endpoint + "/js/modules/loadGoogleAnalytics.min", function() {
		(app._environment === "prod") && window.loadGoogleAnalytics(gaTrackingID, false);
		app.gaAutoSendPageview = true;
	});
	
	app.searchStringFromArray = function(target, callback) {
		var isArray, arr, len, i, v;
		if( typeof target === "object" && this.isFunction(callback) ) {
			isArray = this.isArray(target);
			arr = isArray ? target : Object.keys(target);
			len = arr.length;
			for(i = 0; i < len; i++) {
				v = isArray ? arr[i] : target[ arr[i] ];
				if( this.isString(v) ) {
					// callbackの実行
					if(callback(v, isArray ? i : arr[i], target) === false) {
						break;
					}
				} else {
					this.searchStringFromArray(v, callback);
				}
			}
		}
		return this;
	};
	
	// [load modules]
	!!path && app.getJSON(endpoint + path, function(data) {
		
		!!endpoint && app.searchStringFromArray(data, function(path, i, arr) {
			(/^\/(?!\/)/).test(path) && (arr[i] = endpoint + path);
		});
		
		app.require(data, function() {
			return app.exec();
		}, currentSctipt);
	});
	
	csl.log.gray("** init WebAppBase (version:" + app.getVersion() + ") **");
	return app;
}));
