;(function() {
	"use strict";
	
	window.loadGoogleAnalytics = function(trackingID, autoSendPageview) {
		var elmScript, elmTarget;
		if(!trackingID) {
			return false;
		}
		window.GoogleAnalyticsObject = "ga";
		window.ga = window.ga || function() {
			(window.ga.q = window.ga.q || []).push(arguments);
		}, window.ga.l = 1 * new Date();
		elmScript = document.createElement("script"), elmTarget = document.getElementsByTagName("script")[0];
		elmScript.async = 1;
		elmScript.src = "//www.google-analytics.com/analytics.js";
		elmTarget.parentNode.insertBefore(elmScript, elmTarget);
		window.ga("create", trackingID, "auto");
		(autoSendPageview !== false) && window.ga("send", "pageview");
	};
})();