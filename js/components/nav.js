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
					var
						vuw = $.data(this, "vuw"),
						section = app.isString(isTrigger) ? isTrigger : "posts";
					
					vuw.setState("isChecked", this.checked);
					vuwer.get("body").setState("lockScroll", this.checked);
					vuwer.get("siteBody").setState("view", this.checked ? "" : section);
				});
			},
			onChangeState: function(state) {
				if(typeof state.isChecked === "boolean") {
					this.$link.toggleClass("is-checked", !!state.isChecked);
					delete state.isChecked;
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
