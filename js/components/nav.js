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
	
	// [nav]
	vuwer.add("nav", {
		selector: "#site_nav",
		onReady: function($self) {
//			app.positionTracker.tracking(this, false, true);
			
			app.categories = [];
			$self
			.on("click", "a", function(e) {
				var vuw;
				if( !(/archive$/).test(this.href) ) {
					e.preventDefault();
					vuw = $.data(e.delegateTarget, "vuw");
					vuw.get("switchNavLinks").setState("isChecked", false);
					vuwer.changePathname(this.pathname, this.search);
				}
			})
			.children(".link-list").find("a[href^='/tagged/']").each(function() {
				var arr = this.href.split("/");
				app.categories.push( arr.pop() );
			});
		},
		onChangeState: function(state) {
			var tmp = {};
			
			tmp.searchBox = this.get("searchBox");
			if(tmp.searchBox.getState("rockOpen") !== state.isFixed) {
				tmp.methods = [];
				tmp.methods.push( tmp.searchBox.setState("rockOpen", !!state.isFixed) );
				
				tmp.btnSearch = this.get("btnSearch");
				if( state.isFixed || tmp.btnSearch.getState("focus") ) {
					tmp.htmlFor = "search_submit";
				} else {
					tmp.htmlFor = "inp_q";
				}
				tmp.methods.push( tmp.btnSearch.setState("htmlFor",  tmp.htmlFor) );
				
				return $.when.apply($, tmp.methods);
			}
		}
	}, function() {
		// ** add child vuw **
		this
		// [switch for open nav]
		.add("switchNavLinks", {
			selector: "#show_nav_links",
			onReady: function($self) {
				this.$link = $self.closest(".btn-toggle");
				$self.on("change", function(e, isTrigger) {
					var vuw = $.data(this, "vuw");
					vuw.$link.toggleClass("is-checked", this.checked);
				});
			},
			onChangeState: function(state) {
				if(typeof state.isChecked === "boolean") {
					this.$self.prop("checked", !!state.isChecked).trigger("change", [true]);
				}
			}
		})
		
		// [searchBox]
		.add("searchBox", {
			selector: "#search_box",
			onReady: function($self) {
				$self
				.on("click", ".inp-txt", function(e, isTrigger) {
					var vuw = $.data(e.delegateTarget, "vuw");
					vuw.setState("focus", true);
					!!isTrigger && $(this).trigger("focus", [true]);
				})
				.on("blur", ".inp-txt", function(e) {
					var vuw = $.data(e.delegateTarget, "vuw");
					vuw.setState("focus", false);
				});
				
				this.$inp = $("#inp_q");
				
				this.state.focus = false;
			},
			onChangeState: function(state) {
				this.$self
				.toggleClass("is-focus", state.focus)
				.toggleClass("is-rockOpen", state.rockOpen)
				.closest(".link-list").toggleClass("is-form-focus", state.focus);
			}
		})
		
		// [btnSearch]
		.add("btnSearch", {
			selector: function() {
				return this.getOther("searchBox").$self.find(".btn-search");
			},
			onReady: function($self) {
				this.state.htmlFor = this.$self.attr("for");
				
				this.$self.on("click", function(e) {
					var vuw = $.data(this, "vuw");
					if(vuw.getState("htmlFor") === "inp_q") {
						e.preventDefault();
						vuw.getOther("searchBox").$inp.trigger("click", [true]);
					}
				});
			},
			onChangeState: function(state) {
				!!state.htmlFor && this.$self.attr("for", state.htmlFor);
			}
		});
	});
	
}));
