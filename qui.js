/**
 * Qui for Javascript Q
 * GitHub: https://github.com/AugmentLogic/Javascript-Q
 * CDN: https://cdn.jsdelivr.net/gh/AugmentLogic/Javascript-Q@latest/qui.js
 * CDN: https://cdn.jsdelivr.net/gh/AugmentLogic/Javascript-Q@latest/qui.css
 * Depends on: https://cdn.jsdelivr.net/gh/AugmentLogic/Javascript-Q@latest/q.js
 */

(function ($) {
	var version = $.qui_version = 0.01;
	// display a tip note above or below an object
	$.note = function () {
		if (arguments[0] === false) {
			// remove all
			$("._qui-note").remove();
			return this;
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
			$box.css(objBoxCss);
		}
	 		
	 	$.delay(50, function () {
			$box.addClass('_qui-state-transitioned');
		});
	 	// Calls to positioning
		$(window).bind('resize.qui-note scroll.qui-note mousemove.qui-note', positionNote);
		positionNote();
		$.delay(10, positionNote);
		var refStartClass = $.delay(500, positionNote);
		var refInterval = window.setInterval(function () {
			positionNote();
		}, 1000);
		function positionNote() {
			var boolTop = $.scrollTop()+$.height()-intLimitOffset-intScrollBarOffset-$focal.height()-$box.height() < $focal.top(); // check if theres enough room under the focal
			if (boolTop)
				boolTop = $box.height() < $focal.scrollTop()-intLimitOffset; // check if there enough room over the focal
			var
			intTop = $focal.top(), // position from top of window
			intLeft = $focal.left(),
			intStartLeft = intLeft,
			intLeft = Math.min(intLeft, $.scrollLeft()+$.width()-$box.width()-intLimitOffset-intScrollBarOffset); // limit box from moving out of bounds
			intLeft = Math.max(intLeft, $focal.left()-$box.width()+intArrowWidth), // lock box to right of focal
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
				$("body").removeClass('_qui-state-transitioned');
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
})($);