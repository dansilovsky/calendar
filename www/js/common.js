// screwfix jQuery plugins
(function($){
	/**
	 * Sets cursor to given position.
	 * 
	 * @param {int} pos position where to set cursor. If not provided position is set at the end of text.
	 * @returns {jQuery} this
	 */
	$.fn.setCursorPosition = function(pos) {
		if (_.isUndefined(pos)) {
			pos = false;
		}
		
		this.each(function(i, el) {
			if (pos === false) {
				var $el = $(el);
				
				pos = $el.val().length;
			}
			
			if (el.setSelectionRange) {
				el.setSelectionRange(pos, pos);
			} 
			else if (el.createTextRange) {
				var range = el.createTextRange();
				range.collapse(true);
				range.moveEnd('character', pos);
				range.moveStart('character', pos);
				range.select();
			}
		});
		
		return this;
	};
	
	/**
	 * Switches among given options
	 * @param {object} options 
	 *		            id         eg. mode (on element id="mode:choise0")
	 *		            select     callback to be called on selectedt element with choise. 
	 *		                       It gets element as argument eg. select(el);
	 *		            unselect   callback called on unselected elements. 
	 *		                       It gets element as argument eg. unselect(el);
	 *		            switch     called when element is selected(clicked on). 
	 *				       It gets choise and index of choise as arguments. 
	 *				       Choise is eg. choise0 from id="mode:choise0"
	 * @returns {undefined}
	 */
	$.fn.switcher = function(options) {
		var defaults = {
			id: null,
			select: null,
			unselect: null,
			switch: null,
		};
		
		var settings = $.extend({}, defaults, options);
		
		if (settings.id === null) {
			throw 'Option "id" must be defined.';
		}
		
		var $choises = this.find("[id^='" + settings.id + "']");
		
		$choises.each(function(index) {
			var $choise = $(this);
			
			var idStr = $choise.attr('id');
			
			var data = idStr.split(':');
			
			if (data.length !== 2) {
				throw 'Wrong id attribute.';
			}
			
			var selectedChoise = data[1];
			
			$choise.on('click', function() { 
				$choise.trigger('clickSwitcher', [selectedChoise, index, $choises]);
			});
			
		});
		
		$choises.on('clickSwitcher', function(e, selectedChoise, index, $choises) {
			$choises.each(function(i){
				if (i !== index) {
					if (settings.unselect) {
						settings.unselect(this);
					}
				}
				else {
					if (settings.select) {
						settings.select(this);
					}
				}
			});
			
			if (settings.switch) {
				settings.switch(selectedChoise, index);
			}
		});
	}

})(jQuery);

// common views
(function($){	
	var common = {};
	
	var appGlobal = {
		$body: $('body'),
		templates: {
			alert: _.template($('#commonAlert').html(), null, {variable: 'data'})
		}
	};
	
	var queues = common.queues = {
		'connectingAnimation': [],
	};
	
	var ConnectingAnimationView = common.ConnectingAnimationView = Backbone.View.extend({
		className: 'box-popup',
		
		initialize: function() {
			this.render();
		},
		
		render: function() {
			this.$el.text('Loading ...');
			this.$el.css({top: 0, left: 0})
			.appendTo(appGlobal.$body);
		}		
	});
	
	var LayoverView = common.LayoverView = Backbone.View.extend({
		className: 'layover',
		autoRemove: true,
		
		initialize: function(options) {
			var that = this;
			
			if (!_.isUndefined(options) && !_.isUndefined(options.autoRemove)) {
				this.autoRemove = options.autoRemove;
			}
			
			this.$el.one('click', function() {that.trigger('click');});
			
			this.render();			
		},
		
		render: function() {
			this.$el.appendTo(appGlobal.$body);
		},
		
		events: {
			"click": "clear"
		},
		
		clear: function(e) {
			e.stopPropagation();
			
			if (this.autoRemove) {
				this.remove();
			}
		}
		
	});
	
	var AlertView = common.AlertView = Backbone.View.extend({
		id: 'alert',
		className: 'box-alert',
		template: appGlobal.templates.alert,
		
		initialize: function(options) {			
			this.data = {
				title: options.title,
				text: options.text
			};
			
			this.render();			
		},
		
		events: {
			"click button": "clear"
		},
		
		render: function() {
			this.layoverView = new LayoverView({autoRemove: false});
			
			this.$el.html(this.template(this.data))
			.appendTo(appGlobal.$body);

			var top = Math.floor($(document).height()/2) - Math.floor(this.$el.outerHeight()/2);
			
			this.$el.css({top: top, left: 0});			
		},
		
		clear: function() {
			if (this.layoverView) {
				this.layoverView.remove();
			}
			
			this.remove();			
		}
	});
	
	var ConfirmView = common.ConfirmView = Backbone.View.extend({
		id: 'confirm',
		className: 'confirm',
		template: appGlobal.templates.confirm,
		
		initialize: function(options) {			
			this.data = {
				title: options.title,
				text: options.text
			};
			
			this.render();			
		},
		
		render: function() {
			this.layoverView = new LayoverView({autoRemove: false});
			
			this.$el.html(this.template(this.data))
			.appendTo(appGlobal.$body);

			var top = Math.floor($(document).height()/2) - Math.floor(this.$el.outerHeight()/2);
			
			this.$el.css({top: top, left: 0});
		},
		
		events: {
			"click button[name|='ok']": "ok",
			"click button[name|='cancel']": "cancel"
		},
		
		ok: function() {
			this.trigger('ok');
			this.clear();
		},
		
		cancel: function() {
			this.trigger('cancel');
			this.clear();
		},
		
		clear: function() {
			if (this.layoverView) {
				this.layoverView.remove();
			}
			
			this.remove();			
		}
	});
	
	//common functions
	var ajaxErrorAlert = common.ajaxErrorAlert = function(model, response, options) {
		var title, text;
		
		new Screwfix.common.AlertView({
			title: 'Connection error', 
			text: "There's a problem connecting to Calendar at the moment. Please make sure that you're connected to the Internet and try again."
		});
	};
	
	var connectingAnimation = common.connectingAnimation = function() {
		if (Screwfix.common.queues.connectingAnimation.length === 0) {
			var animation = new Screwfix.common.ConnectingAnimationView();

			Screwfix.common.queues.connectingAnimation.push(animation);
		}
		else {
			Screwfix.common.queues.connectingAnimation.push(null);
		}
	};
	
	var stopConnectingAnimation = common.stopConnectingAnimation = function() {
		if (Screwfix.common.queues.connectingAnimation.length > 1) {
			Screwfix.common.queues.connectingAnimation.pop();
		}
		else if (Screwfix.common.queues.connectingAnimation.length === 1) {
			Screwfix.common.queues.connectingAnimation.pop().remove();
		}
	}
	
	
	
	Screwfix = $.extend({}, Screwfix, {common: common});
	
}).call(this, jQuery);

// common objects
(function($){
	var common = {};
	
	/**
	 * Determines a week pattern number.
	 * If no year given then it sets itself to todays date
	 * 
	 * @param {int} year
	 * @param {int} month integer 1 to 12
	 * @param {int} day
	 */
	var ShiftPatternDate = common.ShiftPatternDate = function(year, month, day) {		
		var date = new Zidane.Calendar(year, month, day);
		
		if (!year) {
			date.today();
		}
		
		var startDate = new Zidane.Calendar(1970, 1, 5);
		
		return {
			/**
			 * Determines week pattern number.
			 * @param {int} weeksInPattern number of weeks in shift pattern
			 * @returns {int}
			 */
			week: function(weeksInPattern) {
				var days = date.diffDays(startDate);
				
				var weeks = Math.floor(days/7);
				
				var weekPatternNum = weeks % weeksInPattern;
				
				if (weekPatternNum === 0) {
					weekPatternNum = weeksInPattern - 1;
				}
				else {
					weekPatternNum--;
				}
				
				return weekPatternNum;
			},
			
			/**
			 * Adjusts weeks order of given pattern according to this date			 * 
			 * @param {array} pattern
			 * @returns {array} new adjusted pattern
			 */
			adjust: function(pattern) {
				var newPattern = [];
				var startWeek = this.week(pattern.length);
				
				for (
					var i=startWeek, counter=0; 
					counter<pattern.length; 
					i = (i+1 >= pattern.length) ? 0 : i+1, counter++
				) {
					newPattern[counter] = pattern[i];
				}
				
				return newPattern;
			}
		}
	}
	
	common = $.extend({}, common, Screwfix.common);
	Screwfix = $.extend({}, Screwfix, {common: common});
	
}).call(this, jQuery);

// TODO: smaz to
Screwfix.testCounter = 0;

// extend backbones model functionality
Backbone.Model.prototype.screwfix = Screwfix;

Backbone.Model.prototype.ajaxErrorAlert = Screwfix.common.ajaxErrorAlert;

Backbone.Model.prototype.connectingAnimation = Screwfix.common.connectingAnimation;

Backbone.Model.prototype.stopConnectingAnimation = Screwfix.common.stopConnectingAnimation;

Backbone.Model.prototype.on('request', Backbone.Model.prototype.connectingAnimation);

Backbone.Model.prototype.on('sync', Backbone.Model.prototype.stopConnectingAnimation);

Backbone.Model.prototype.on('error', Backbone.Model.prototype.stopConnectingAnimation);

Backbone.Model.prototype.on('error', Backbone.Model.prototype.ajaxErrorAlert);

// extend Backbone Collection prototype
Backbone.Collection.prototype.screwfix = Screwfix;

Backbone.Collection.prototype.ajaxErrorAlert = Screwfix.common.ajaxErrorAlert;

Backbone.Collection.prototype.connectingAnimation = Screwfix.common.connectingAnimation;

Backbone.Collection.prototype.stopConnectingAnimation = Screwfix.common.stopConnectingAnimation;

// extend Backbone View prototype
Backbone.View.prototype.screwfix = Screwfix;
