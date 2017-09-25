;(function($) {
	"use strict";
	
	/**********************
	*  position tracking  *
	**********************/
	app.positionTracker = {
		_targets: [],
		tracking: function(vuw, trackingStart, trackingEnd) {
			if( !( vuw instanceof Klass("Vuw") ) || (!trackingStart && !trackingEnd) ) {
				return false;
			}
			vuw._pt = {
				$elm: $("<div/>").addClass("position-tracker").insertBefore(vuw.$self)
			};
			
			!!trackingStart && (vuw._pt.fixStart = 0);
			!!trackingEnd && (vuw._pt.fixEnd = 0);
			
			vuw.onChangeState(function(state) {
				var isFixed;
				if( !app.isNumber(state.currentY) ) {
					return false;
				}
				
				isFixed =
					(!this._pt.fixStart || state.currentY >= this._pt.fixStart) &&
					(!this._pt.fixEnd || state.currentY <= this._pt.fixEnd);
				
				if(isFixed !== state.isFixed) {
					state.isFixed = isFixed;
					this.$self.toggleClass("is-fixed", state.isFixed);
					this._pt.$elm.css("height", state.isFixed ? this._pt.height : "");
				}
				delete state.currentY;
			});
			
			this._targets.push( vuw.getAddress() );
			return this;
		},
		_updPtFixPosition: function() {
			var h = vuwer.$window.height();
			this._targets.forEach(function(vuwAddress) {
				var
					vuw = vuwer.get(vuwAddress),
					top = vuw._pt.$elm.offset().top;
				
				vuw._pt.height = vuw.$self.outerHeight(true);
				
				if( vuw && vuw.isReady && app.isNumber( vuw._pt.fixStart ) ) {
					vuw._pt.fixStart = top - this._ptBuffer;
				}
				if( vuw && vuw.isReady && app.isNumber( vuw._pt.fixEnd ) ) {
					vuw._pt.fixEnd = top + vuw._pt.height - h;
				}
			}, this);
			return this;
		},
		_ptBuffer: 0,
		_calcPtBuffer: function() {
			this._ptBuffer = vuwer.get("siteHeader").$self.outerHeight(true);
			return this;
		},
		onWindowResize: function() {
			return this._calcPtBuffer()._updPtFixPosition();
		},
		onChangeScrollTop: function(t) {
			this._targets.forEach(function(vuwAddress) {
				var vuw = vuwer.get(vuwAddress);
				if(vuw && vuw.isReady) {
					vuw.setState("currentY", t);
				}
			}, this);
			return this;
		}
	};
	
	vuwer.setProp({
		onReadyLast: function($window) {
			// for position tracker
			$window
			.on("resize.pt", function(e, isTrigger) {
				var scrollTop = $window.scrollTop();
				!!vuwer._resizePtTimer && clearTimeout(vuwer._resizePtTimer);
				vuwer._resizePtTimer = setTimeout(function() {
					if( scrollTop === $window.scrollTop() ) {
						app.positionTracker.onWindowResize();
					}
				}, !!isTrigger ? 0 : 100);
			})
			.on("scroll.pt", function(e, isTrigger) {
				app.positionTracker.onChangeScrollTop( $window.scrollTop() );
			});
			
			// for pop state
			app.enablePushState && $window.on("popstate", function(e) {
				var state = e.originalEvent.state || app.parseQueryString(location.search);
				csl.log("popstate", state);
				state.popstate = true;
				vuwer.setState(state);
			});
		}
	});
	
})(window.$ || window.jQuery);