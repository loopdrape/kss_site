;(function() {
	"use strict";
	
	var
		root ={
			prod: "http://keeshkassoundservice.tumblr.com/",
			dev: "root"
		};
	
	window.app = new ApplicationBase("kss");
	app.config = {
		rootpath: function() {
			var
				arr = app.URL.split("/"),
				idx = function() {
					var rtn = arr.lastIndexOf(root.dev);
					if(rtn < 0) {
						rtn = arr.lastIndexOf(root.prod);
						app.LOG = false;
					}
					return rtn + 1;
				}();
			return arr.slice(0, idx).join("/") + "/";
		}()
	};
	
	var pageDirLv = app.URL.replace(app.config.rootpath, "").split("/").length;
	app._relativePath = (pageDirLv === 1) ? "." : function() {
		var
			tmp = [],
			len = pageDirLv - 1,
			i;
		for(i = 0; i < len; i++) {
			tmp.push("..");
		}
		return tmp.join("/");
	}();
	
	app.writeHTML = function(htmlFile) {
		var
			isAutopath = ( (/^\/|^\./).test(htmlFile) ) ? false : true,
			req = {
				type: "GET",
				url: (isAutopath) ? app._relativePath + "/" + htmlFile : htmlFile,
				async: false
			},
			xmlHttp = new XMLHttpRequest(),
			literal = /\{root\}/g;	// {root}
		
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
})();