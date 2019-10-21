/**
 * Qui for Javascript Q
 * GitHub: https://github.com/AugmentLogic/Javascript-Q
 * CDN: https://cdn.jsdelivr.net/gh/AugmentLogic/Javascript-Q@latest/qui.js
 * CDN: https://cdn.jsdelivr.net/gh/AugmentLogic/Javascript-Q@latest/qui.css
 * Depends on: https://cdn.jsdelivr.net/gh/AugmentLogic/Javascript-Q@latest/q.js
 */

(function ($) {
	var version = $.qui_version = 0.08;
	
	// display a tip note above or below an object
	// returns handle
	var objDefaultParams = {};
	$.note = function () {
		if (arguments[0] === false) {
			// remove all
			$("._qui-note").remove();
			return this;
		}
		if (!this.is_qchain) {
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
			boolTop = objDefaultParams.topFixed || $.scrollTop()+$.height()-intLimitOffset-intScrollBarOffset-$focal.height()-$box.height() < $focal.top(); // check if theres enough room under the focal
			if (boolTop && !objDefaultParams.topFixed)
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
		var arrResponse = {
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
		};
		if (objDefaultParams.autoClose) {
			$("body").bind('click.qui-note-auto-close keydown.qui-note-auto-close', function () {
				$("body").unbind('click.qui-note-auto-close keydown.qui-note-auto-close');
				arrResponse.close();
			});
		}
		if (objDefaultParams.autoFocus) {
			$focal.focus();
		}
		return arrResponse;
	};
	
	$.plugin('note', $.note);

	// barbershop loader
	// returns handle
	$.plugin('barbershopLoader', function (arrParams) {
		if (!arrParams)
			arrParams = {};
		// default params
		var arrDefault = {
			width : 10, // width of lines
			spacing : 14, // space between lines
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
		$barLoader = (that.data('_qui-barbershop-loader') || $("<div>").appendAfter(that))
		.addClass('_qui-barbershop-loader')
		.css({
			borderBottomLeftRadius:that.css('-webkit-border-bottom-left-radius'),
			borderBottomRightRadius:that.css('-webkit-border-bottom-right-radius'),
			borderTopLeftRadius:that.css('-webkit-border-top-left-radius'),
			borderTopRightRadius:that.css('-webkit-border-top-right-radius')
		}),
		$barLoaderHolder = $("<div class='_qui-barbershop-holder'>").appendTo($barLoader),
		strAnimationName = '_qui-barbershop-animation-'+intSpace;
		that.appendTo($barLoader);
		that.data('_qui-barbershop-loader', $barLoader);
		$barLoaderHolder.addRawCSS('@keyframes ' + strAnimationName + ' {from {transform:translateX(0);}to {transform:translateX(' + intSpace + 'px);}}');
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
				$barLoaderHolder.remove();
				$barLoader.removeClass('_qui-barbershop-loader');
			}
		};
	});

	// returns chain
	$.plugin('xyselect', function (objParams) {
		$.iterate(this,function (k,el) {
			var
			$el = $(el),
			autoSelect = objParams.autoSelect || $el.attr('autoSelect'),
			intRows = objParams.rows || $el.attr('rows') || 0,
			intCols = objParams.cols || $el.attr('cols') || 0,
			fnChange = objParams.change,
			intContainerWidth = parseInt($el.css('width'))-$el.horizontalBorders(),
			intContainerHeight = parseInt($el.css('height'))-$el.verticalBorders(),
			intUnitWidth = !intCols ? intContainerWidth : intContainerWidth/intCols,
			intUnitHeight = !intRows ? intContainerHeight : intContainerHeight/intRows,
			arrValues = objParams.value ? (objParams.value+'').split(/ *, */) : [],
			intCurrentLeft = arrValues[0] * intUnitWidth,
			intCurrentTop = (arrValues[1] || 0) * intUnitWidth;
			$el.addClass('_qui-xyselect _qui-draggable');
			// add handle
			var $handle = $el.data('_qui-xyselect-handle');
			if (!$handle) {
				$handle = $("<a>").addClass('_qui-xyselect-handle').appendTo($el);
				$el.data('_qui-xyselect-handle', $handle[0]);
			} else {
				$handle = $($handle);
			}
			// position handle
			$handle.css({
				width:intUnitWidth,
				height:intUnitHeight,
				left : intCurrentLeft,
				top : intCurrentTop
			});
			// drag handle
			$el.bind('mousedown._qui-xyselect', function (e) {
				e.preventDefault();
				var 
				startX = e.clientX,
				startY = e.clientY,
				intCurrentLeft = parseInt($handle.css('left')),
				intCurrentTop = parseInt($handle.css('top')),
				intScrollDiffX = $.scrollLeft(),
				intScrollDiffY = $.scrollTop(),
				intSnapX,
				intSnapY
				intLastSnapX = intCurrentLeft,
				intLastSnapY = intCurrentTop,
				$mask = $.mask({
					css: {
						cursor:'grabbing'
					}
				});
				if (autoSelect && e.target != $handle[0]) {
					var 
					intDifX = e.offsetX,
					intDifY = e.offsetY,
					intStateX = intDifX,
					intStateY = intDifY,
					intPosX = !intCols ? 0 : Math.min(intCols-1, Math.max(0, Math.floor(intStateX/intUnitWidth))),
					intPosY = !intRows ? 0 : Math.min(intRows-1, Math.max(0, Math.floor(intStateY/intUnitHeight)));
					intSnapX = intPosX * intUnitWidth;
					intSnapY = intPosY * intUnitHeight;
					if (intSnapX != intLastSnapX || intSnapY != intLastSnapY) {
						intLastSnapX = intSnapX;
						intLastSnapY = intSnapY;
						$handle.css({
							left : intSnapX,
							top : intSnapY
						});
						objParams.change(intPosX,intPosY);
					}
				}
				$(window).bind('mousemove._qui-xyselect', function (e) {
					e.preventDefault();
					var 
					intScrollX = $.scrollLeft()-intScrollDiffX,
					intScrollY = $.scrollTop()-intScrollDiffY,
					moveX = e.clientX+intScrollX,
					moveY = e.clientY+intScrollY,
					intDifX = moveX-startX,
					intDifY = moveY-startY,
					intStateX = intDifX + intCurrentLeft,
					intStateY = intDifY + intCurrentTop,
					intPosX = !intCols ? 0 : Math.min(intCols-1, Math.max(0, Math.round(intStateX/intUnitWidth))),
					intPosY = !intRows ? 0 : Math.min(intRows-1, Math.max(0, Math.round(intStateY/intUnitHeight)));
					intSnapX = intPosX * intUnitWidth;
					intSnapY = intPosY * intUnitHeight;
					if (intSnapX != intLastSnapX || intSnapY != intLastSnapY) {
						intLastSnapX = intSnapX;
						intLastSnapY = intSnapY;
						$handle.css({
							left : intSnapX,
							top : intSnapY
						});
						objParams.change(intPosX,intPosY);
					}
				});
				$(window).bind('mouseup._qui-xyselect', function (e) {
					e.preventDefault();
					intCurrentLeft = intSnapX;
					intCurrentTop = intSnapY;
					$(window).unbind('mouseup._qui-xyselect');
					$(window).unbind('mousemove._qui-xyselect');
					$mask.remove();
				});
			});
		});
		return this;
	});

	// Disable
	$.plugin('disable', function () {
		var
		that = this,
		$parent = that.closest('._qui-disable');
		that.attr('disabled', 'disabled');
		if ($parent.length)
			return;
		$parent = $("<div class='_qui-disable'>")
		.css({
			display: that.css('display'),
			width: that.css('width')+that.horizontalMargins(),
			height: that.css('height')+that.verticalMargins()
		})
		.appendBefore(that);
		that.appendTo($parent);
		$("<div class='_qui-disable-inner'>").appendTo($parent);
	});
	$.plugin('enable', function () {
		var 
		that = this,
		$parent = that.closest('._qui-disable');
		that.removeAttr('disabled');
		if ($parent.length) {
			$parent.find('._qui-disable-inner').remove();
			$($parent.children()[0]).appendBefore($parent);
			$parent.remove();
		}
	});
	
	// toggle
	$.plugin('toggleable', function () {
		this.click(function () {
			$(this).toggle();
		});
	});
	$.plugin('toggle', function (boolValue, strParent) {
		var that = this;
		boolDown = that.hasClass('toggled');
		if (typeof boolValue == 'undefined') { // toggle
			boolDown = !boolDown;
		} else if (boolValue) { // on
			boolDown = 1;
		} else { // off
			boolDown = 0;
		}
		if (boolDown)
			that.addClass('toggled');
		else
			that.removeClass('toggled');
		that.trigger('toggled');
	});
	$.plugin('toggled', function (fnCallback) {
		var that = this;
		if (typeof fnCallback == 'undefined') {
			return that.hasClass('toggled');
		} else {
			that.bind('toggled', function () {
				fnCallback($(this).hasClass('toggled'), this);
			});
		}
	});

	// puts a div mask on the window
	// returns mask handle
	$.mask = function (arrParams) {
		var $mask = $("<div>").addClass('_qui-mask').appendTo('body');
		if (arrParams.css)
			$mask.css(arrParams.css);
		return $mask;
	};
})($);
