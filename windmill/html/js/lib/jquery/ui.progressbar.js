/*
 * jQuery Progress Bar plugin
 * Version 1.1.0 (06/20/2008)
 * @requires jQuery v1.2.1 or later
 *
 * Copyright (c) 2008 Gary Teo
 * http://t.wits.sg

USAGE:
	$(".someclass").progressBar();
	$("#progressbar").progressBar();
	$("#progressbar").progressBar(45);							// percentage
	$("#progressbar").progressBar({showText: false });			// percentage with config
	$("#progressbar").progressBar(45, {showText: false });		// percentage with config
*/
(function($) {
	$.extend({
		progressBar: new function() {

			this.defaults = {
				increment	: 2,
				speed		: 15,
				showText	: true,											// show text with percentage in next to the progressbar? - default : true
				width		: 120,											// Width of the progressbar - don't forget to adjust your image too!!!
				boxImage	: '/windmill-serv/img/progressbar/progressbar.gif',		// boxImage : image around the progress bar
				barImage	: '/windmill-serv/img/progressbar/progressbg_green.gif',	// Image to use in the progressbar. Can be an array of images too.
				height		: 15											// Height of the progressbar - don't forget to adjust your image too!!!
			};
			
			/* public methods */
			this.construct = function(arg1, arg2) {
				var argpercentage	= null;
				var argconfig		= null;
				
				if (arg1 != null) {
					if (!isNaN(arg1)) {
						argpercentage 	= arg1;
						if (arg2 != null) {
							argconfig	= arg2; }
					} else {
						argconfig		= arg1; 
					}
				}
				
				return this.each(function(child) {
					var pb		= this;
					if (argpercentage != null && this.bar != null && this.config != null) {
						this.config.tpercentage	= argpercentage;
						if (argconfig != null)
							pb.config			= $.extend(this.config, argconfig);
					} else {
						var $this				= $(this);
						var config				= $.extend({}, $.progressBar.defaults, argconfig);
						var percentage			= argpercentage;
						if (argpercentage == null)
							var percentage		= $this.html().replace("%","");	// parsed percentage
						
						
						$this.html("");
						var bar					= document.createElement('img');
						var text				= document.createElement('span');
						bar.id 					= this.id + "_percentImage";
						text.id 				= this.id + "_percentText";
						bar.src					= config.boxImage;
						bar.width				= config.width;
						var $bar				= $(bar);
						var $text				= $(text);
						
						this.bar				= $bar;
						this.ntext				= $text;
						this.config				= config;
						this.config.cpercentage	= 0;
						this.config.tpercentage	= percentage;
						
						$bar.css("width", config.width + "px");
						$bar.css("height", config.height + "px");
						$bar.css("background-image", "url(" + config.barImage + ")");
						$bar.css("padding", "0");
						$bar.css("margin", "0");
						$this.append($bar);
						$this.append($text);
						
						bar.alt				= this.tpercentage;
						bar.title			= this.tpercentage;
					}
					
					
					
					var t = setInterval(function() {
						var config		= pb.config;
						var cpercentage = parseInt(config.cpercentage);
						var tpercentage = parseInt(config.tpercentage);
						var increment	= parseInt(config.increment);
						var bar			= pb.bar;
						var text		= pb.ntext;
						var pixels		= config.width / 100;			// Define how many pixels go into 1%
						
						bar.css("background-position", (((config.width * -1)) + (cpercentage * pixels)) + 'px 50%');
						
						if (config.showText)
							text.html(" " + Math.round(cpercentage) + "%");
						
						if (cpercentage > tpercentage) {
							if (cpercentage - increment  < tpercentage) {
								pb.config.cpercentage = 0 + tpercentage
							} else {
								pb.config.cpercentage -= increment;
							}
						}
						else if (pb.config.cpercentage < pb.config.tpercentage) {
							if (cpercentage + increment  > tpercentage) {
								pb.config.cpercentage = tpercentage
							} else {
								pb.config.cpercentage += increment;
							}
						} 
						else {
							clearInterval(t);
						}
					}, pb.config.speed); 
				});
			};
		}
	});
		
	$.fn.extend({
        progressBar: $.progressBar.construct
	});
	
})(jQuery);