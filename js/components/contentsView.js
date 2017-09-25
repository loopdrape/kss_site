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
	
	// [contentsView]
	vuwer.add("contentsView", {
		selector: "#contents_view",
		onReady: function($self) {
		},
		onChangeState: function(state) {
			// [view]
			if(state.view !== this.state.view) {
				this.isString(state.view) || (state.view = "");
				this.$self.toggleClass("is-active", !!state.view).attr({
					"data-view": state.view
				});
				
				if(state.view === "posts") {
					return this.get("secPosts").setState({
						active: state.active
					});
				}
			}
		}
	}, function() {
		// ** add child vuw **
		this
		// [discription section]
		.add("secDescription", {
			selector: "#description_section",
			onReady: function($self) {
				this._delay = parseFloat( $self.css("transition-duration") ) * 1000;
				
				$self.on("click", ".btn-close", function(e) {
					var
						vuw = $.data(e.delegateTarget, "vuw"),
						query = Object.assign({}, app._GET);
					
					e.preventDefault();
					delete query.description;
					vuwer.setState( "query", app.createQueryString(query) );
				});
			}
		})
		
		//[posts section]
		.add("secPosts", {
			selector: "#posts_section",
			onChangeState: function(state) {
				if(state.active === this.state.active) {
					return false;
				}
				
				this.isString(state.active) || (state.active = "");
				!!this.state.active && $("#" + this.state.active).removeClass("is-active");
				!!state.active && $("#" + state.active).addClass("is-active");
			}
		});
	});
}));