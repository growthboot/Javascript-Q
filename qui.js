/**
 * Qui for Javascript Q
 * GitHub: https://github.com/AugmentLogic/Javascript-Q
 * CDN: https://cdn.jsdelivr.net/gh/AugmentLogic/Javascript-Q@latest/qui.js
 * CDN: https://cdn.jsdelivr.net/gh/AugmentLogic/Javascript-Q@latest/qui.css
 * Depends on: https://cdn.jsdelivr.net/gh/AugmentLogic/Javascript-Q@latest/q.js
 */

(function ($) {
	var version = $.qui_version = 0.05;
	
	// display a tip note above or below an object
	var objDefaultParams = {};
	$.note = function () {
		if (arguments[0] === false) {
			// remove all
			$("._qui-note").remove();
			return this;
		}
		if (!this.is_q) {
			objDefaultParams = arguments[0];
			return;
		}
		var 
		$focal = this,
	 	domOldNode = $focal.data('_qui-note-box-node');
	 	if (domOldNode)
	 		$(domOldNode).remove();
	 	var
		strMessage,
		strSecondary,
		objBoxCss = false,
		intArguments = arguments.length,
		intStringsFound = 0;
		for (var intItr=0; intItr!=intArguments; intItr++) {
			var 
			arguemnt = arguments[intItr],
			strArgumentType = typeof arguemnt;
			if (strArgumentType == "string") {
				if (intStringsFound == 0)
					strMessage = arguemnt;
				else if (intStringsFound == 1)
					strSecondary = arguemnt
				intStringsFound++;
			} else if (strArgumentType == "object") {
				objBoxCss = arguemnt;
			}
		}
		if (!objBoxCss)
			objBoxCss = objDefaultParams;
	 	var 
	 	intLimitOffset = 10, // window bounds offset
	 	intScrollBarOffset = 20,
	 	intExtraHeightOffset = 20,
	 	$box = $("<div class='_qui-note'></div>").appendTo("body"),
	 	$text = $("<div class='_qui-note-text'>").html(strMessage).appendTo($box),
	 	$arrow = $("<div class='_qui-note-arrow'>").appendTo($box),
	 	$secondary,
	 	intArrowWidth = $arrow.width(),
	 	intArrowHeight = $arrow.height();
	 	$focal.data('_qui-note-box-node', $box[0]);
	 	if (strSecondary) {
			$secondary = $("<div class='_qui-note-secondary-data'>").html(strSecondary).appendTo($box);
			$box.addClass('_qui-state-secondary');
		}
	 	if (objBoxCss) {
			for (var intItr in objBoxCss) {
				if (objBoxCss[intItr] == "focal-width") {
					objBoxCss[intItr] = $focal.width();
				}
			}
			if (!objBoxCss.width) {
				objBoxCss.width = $box.width();
			}
			$box.css(objBoxCss);
		} else {
			$box.css({
				width : Math.max($box.width(), $focal.width())
			});
		}
	 		
	 	$.delay(50, function () {
			$box.addClass('_qui-state-transitioned');
		});
	 	// Calls to positioning
		$(window).bind('resize.qui-note scroll.qui-note mousemove.qui-note', positionNote);
		positionNote();
		$.delay(10, positionNote);
		var 
		refStartClass = $.delay(500, positionNote),
		refInterval = window.setInterval(function () {
			positionNote();
		}, 1000);
		function positionNote() {
			var 
			intBoxWidth = $box.width(),
			boolTop = $.scrollTop()+$.height()-intLimitOffset-intScrollBarOffset-$focal.height()-$box.height() < $focal.top(); // check if theres enough room under the focal
			if (boolTop)
				boolTop = $box.height() < $focal.scrollTop()-intLimitOffset; // check if there enough room over the focal
			var
			intTop = $focal.top(), // position from top of window
			intLeft = $focal.left(),
			intStartLeft = intLeft,
			intLeft = Math.min(intLeft, $.scrollLeft()+$.width()-intBoxWidth-intLimitOffset-intScrollBarOffset); // limit box from moving out of bounds
			intLeft = Math.max(intLeft, $focal.left()-intBoxWidth+intArrowWidth), // lock box to right of focal
			intLeft = Math.max(intLeft, $.scrollLeft() + intLimitOffset), // lock to left window bounds
			intLeft = Math.min(intLeft, $focal.right()-intArrowWidth), // keep the box on the focal out of the left bounds
			intLeftDifference = intStartLeft - intLeft;
			boolTop ? $box.addClass('_qui-note-top-pos') : $box.removeClass('_qui-note-top-pos');
			$arrow.css({
				left : Math.max(0, intLeftDifference)
			});
			$box.css({
				top : boolTop ? $focal.top() - $box.height() - intArrowHeight  : $focal.bottom() + intArrowHeight,
				left : intLeft
			});
		}
		// repsonse
		return {
			text : function (strNewMessage) {
				if (typeof strNewMessage == "undefined")
					return strMessage;
				strMessage = strNewMessage;
				$text.html(strMessage);
			},
			secondary : function (strNewMessage) {
				if (typeof strNewMessage == "undefined")
					return strSecondary;
				if (strNewMessage !== false) {
					if (!$secondary) {
						$secondary = $("<div class='_qui-note-secondary-data'>").appendTo($box);
						$box.addClass('_qui-state-secondary');
					}
					$secondary.html(strNewMessage);
				} else {
					$secondary.remove();
					$box.removeClass('_qui-state-secondary');
					return;
				}
				strSecondary = strNewMessage;
			},
			box : $box,
			shake : function (boolLeaveError) {
				$box
				.addClass('_qui-state-error')
				.addClass('_qui-animation-shake');
				$.delay(1000, function () {
					$box.removeClass('_qui-animation-shake');
					if (!boolLeaveError)
						$box.removeClass('_qui-state-error');
				});
			},
			close : function () {
				$box.removeClass('_qui-state-transitioned');
				$box.addClass('_qui-state-closing');
				$.delay(500, function () {
					$box.remove();
				});
				$(window).unbind('resize.qui-note scroll.qui-note mousemove.qui-note');
				$.clear(refStartClass);
				window.clearTimeout(refInterval);
			}
		}
	};
	$.plugin('note', $.note);

	// barbershop loader
	var arrBarbershopAnimations = {};
	$.plugin('barberShopLoader', function (arrParams) {
		if (!arrParams)
			arrParams = {};
		// default params
		var arrDefault = {
			width : 10, // width of lines
			spacing : 7, // space between lines
			speed : 0.25 // seconds
		},
		arrParams = $.extend(arrDefault, arrParams);
		intSpace=arrParams.width+arrParams.spacing;
		var
		that = this,
		arrBars = [],
		intMaxDim = Math.max(that.width(), that.height()),
		intMaxBars = (intMaxDim / intSpace) * 2,
		intSize = intMaxDim * 2,
		$barLoader = $("<div class='_qui-barbershop-loader'>")
		.appendAfter(that)
		.css({
			borderBottomLeftRadius:that.css('-webkit-border-bottom-left-radius'),
			borderBottomRightRadius:that.css('-webkit-border-bottom-right-radius'),
			borderTopLeftRadius:that.css('-webkit-border-top-left-radius'),
			borderTopRightRadius:that.css('-webkit-border-top-right-radius')
		}),
		$barLoaderHolder = $("<div class='_qui-barbershop-holder'>").appendTo($barLoader),
		strAnimationName = '_qui-barbershop-animation-'+intSpace;
		that.appendTo($barLoader);
		if (!arrBarbershopAnimations[strAnimationName])
			$barLoaderHolder.addRawCSS('@keyframes ' + strAnimationName + ' {from {transform:translateX(0);}to {transform:translateX(' + intSpace + 'px);}}');
		arrBarbershopAnimations[strAnimationName] = 1;
		$barLoaderHolder.css({
			width:intSize,
			height:intSize,
			left:(that.width()/2)-(intSize/2),
			top:(that.height()/2)-(intSize/2),
			animation: strAnimationName + ' ' + arrParams.speed + 's infinite',
			'animation-timing-function': 'linear'
		});
		for (var intBars=0; intBars<intMaxBars; intBars++) {
			$("<div class='_qui-barbershop-bar'></div>")
			.appendTo($barLoaderHolder)
			.css({
				left : intBars * intSpace
			})
			.css(arrParams);
		}
		return {
			stop : function () {
				that.removeClass('_qui-barbershop-loader');
				that.find('._qui-barbershop-holder').remove();
			}
		};
	});
})($);