/**
 * Javascript Q
 * GitHub: https://github.com/AugmentLogic/Javascript-Q
 * CDN: https://cdn.jsdelivr.net/gh/AugmentLogic/Javascript-Q@latest/q.js
 */

(function(JavascriptQ) {
	var 

	// Initialize Q
	q = window[JavascriptQ] = function (mixedQuery) {
		var that = copy(fun);
		return that.put(mixedQuery);
	},

	version = q.version = '3.0.1',
	
	BYPASS_QUEUE = q.BYPASS_QUEUE = 'BYPASS_QUEUE_CONSTANT',

	// Duplicates an object
	copy = q.copy = function (obj) {
		return extend({}, obj);
	},
	
	// Find out if an object is a DOM node
	isNode = q.isNode = function (o){
		return (
			typeof Node === "object" 
			? o instanceof Node 
			: o && typeof o === "object" && typeof o.nodeType === "number" && typeof o.nodeName==="string"
		);
	},

	// Extends the properties of an object
	extend = q.extend = function (obj1, obj2) {
		var keys = Object.keys(obj2);
		for (var i = 0; i < keys.length; i += 1) {
			var val = obj2[keys[i]];
			obj1[keys[i]] = ['object', 'array'].indexOf(typeof val) != -1 && !isNode(val) ? extend(obj1[keys[i]] || {}, val || {}) : val;
		}
		return obj1;
	},

	// callback(key, value, posFlag)
	// posFlag 0=start; 2=end; 1=other
	iterate = q.iterate = function (that, fnCallback, boolBackwords) {
		var 
		l=that.length,
		i=boolBackwords?l-1:0;
		if (isNode(that)) {
			fnCallback.call(that, 0, that, 2);
		} else {
			if (boolBackwords) {
				while (i>=0) {
					if (fnCallback.call(that[i], i, that[i], i==l-1 ? 2 : (!i ? 0 : 1)) === false)
						break;
					i--;
				}
			} else {
				while (i<l) {
					if (fnCallback.call(that[i], i, that[i], i==l-1 ? 2 : (!i ? 0 : 1)) === false)
						break;
					i++;
				}
			}
		}
		return !!l;
	},
	riterate = q.riterate = function (that, fnCallback) {
		return iterate(that,fnCallback,1);
	},
	
	preload = q.preload = function (url, fnSuccess, fnError) {
		var img = new Image();
		img.src=url;
		if (img.complete) {
			if (fnSuccess)
				fnSuccess(url);
		} else {
			if (fnSuccess)
				img.addEventListener('load', fnSuccess);
			if (fnError)
				img.addEventListener('error', fnError);
		}
	},

	uriEncode = q.uriEncode = function (val) {
		return encodeURIComponent(val).replace(/\+/, '%2B').replace(/ /, '+');
	},

	queryString = q.queryString = function (arrItem) {
		var strResult = "";
		for (var k in arrItem) {
			var v = q.uriEncode(arrItem[k]);
			strResult += k + '=' + v + '&';
		}
		strResult = strResult.slice(0, -1);
		return strResult;
	},
	
	// change camel case for dashes
	camelToDash = q.camelToDash = function (strInput) {
		return strInput
			.replace(/([a-z])([A-Z])/g, '$1-$2')
			.toLowerCase();
	},

	// Handle DOM ready
	boolReadyEventsOn = false,
	arrReadyPromises = [],
	// check if there's a queue open and if there is add the call the sequence, 
	// if not just call it. used for handling animations, delays, ifs, etc...
	prospectQueue = function (arrArgs,strParentName) {
		var 
		that = this,
		intTotal = that.length,
		intBlocked = 0,
		arrNewQueue = [],
		boolLoopAdded=!that.loopOn;
		arrArgs = Array.prototype.slice.call(arrArgs);
		var arrArgsSequence = arrArgs.slice(0);
		arrArgsSequence.unshift(strParentName);
		if (
			arrArgs.includes(BYPASS_QUEUE)
			|| that.loopOn === 0
			|| that.withoutQueueOn
		)
			return true;
		// all elements must be queued to disable the entire process
		// add elements to the sequence that are queued
		// then remove those elements from the selection
		// so that none queued items can continue with their normal process 
		iterate(that,function (intItem, el) {
			if (!el) return;
			var intElUid = q(el).uniqueId();
			if (objQueueChain[intElUid]) {
				var objLink = objQueueChain[intElUid];
				if (objLink.skip_queue) {
					intBlocked++;
					return;
				}
				if (!boolLoopAdded) {
					addLoopParam.call(that,arrArgsSequence);
					boolLoopAdded = true;
				}
				if (objLink.active) {
					intBlocked++;
					objLink.sequence.push(arrArgsSequence);
					return;
				}
				objLink.skip_queue = true;
				objLink.active = true;
				q(el)[strParentName].apply(that, arrArgs);
				objLink.active = false;
				objLink.skip_queue = false;
				if (!that.loopOn)
					q.queueNext.call(that, el, true);
			}
			arrNewQueue.push(el);
		});
		var boolContinue = intBlocked != intTotal;
		if (boolContinue && intBlocked != 0) {
			that.put(arrNewQueue);
		}
		if (intBlocked+intTotal==0) {
			boolContinue = true;
		}
		return boolContinue;// parent proceeds
	},
	addLoopParam = function (arrArgsSequence) {
		var that = this;
		that.loopBuffer[Object.keys(that.loopBuffer).length] = Object.values(copy(arrArgsSequence));
	},
	// For adding new functions to the q
	fnResolve = function (mixedValue) {
		if (typeof mixedValue == "function")
			mixedValue = mixedValue.call(this);
		return mixedValue;
	},
	// Free up memory by removing the selections that are not part of the selection anymore
	fnTrimQueue = function (intStart) {
		var that = this;
		that.length = intStart;
		while (that[intStart]) {
			delete that[intStart++];
		}
	},
	animations = 0, // the current amount of animations that have been started
	objAnimationInstances = {},
	objTransformHistory = {}, // css transforms are lost in the matrix so we gotta keep track of them
	// default transform scales
	objTransformDefaults = {
		scale : "1,1",
		scaleX : 1,
		scaleY : 1,
		scaleZ : 1,
		scale3d : "1,1,1",
	},

	objQueueChain = {}, // holds information for queuing animations for synchronous playback

	// Don't add px postfix to these values
	arrExcludePx = {'transform-scaleX':1,'transform-scaleY':1,'transform-scale':1,'column-count': 1,'fill-opacity': 1,'font-weight': 1,opacity: 1,orphans: 1,widows: 1,'z-index': 1,zoom: 1,'background-color': 1},

	// create new methods in the q variable that call bind ex: q(mixed).click(function);
	arrAutoBind = ["submit","click","mousedown","mouseup","mouseover","mousemove","mouseleave","mouseenter","change","load","dblclick","focus","focusin","focusout","blur","input","keydown","keypress","keyup","resize","reset","scroll","select","touchcancel","touchend","touchmove","touchstart","transitionend","unload","wheel","contextmenu"],

	// Support for .data
	arrDataMemory = {},
	// Support for: .bind .unbind .trigger
	objEventMomory = {},
	// the start of the fun return variable
	fun = {
		length : 0,
		is_q : 1,
		is_qchain : 1,
		version : version,
		layers : 0, // how many times has the find function ran
		loopOn : false,
		loopCount : 0,
		loopBuffer : [],
		// ifs
		condition_count : 0, // ifs count
		conditions : [1],
		orFired : false
	},
	hexToRgb = q.hexToRgb = function (hex) {
	    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
	    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
	    hex = hex.replace(shorthandRegex, function(m, r, g, b) {
	        return r + r + g + g + b + b;
	    });
		var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	    return result ? {
	        r: parseInt(result[1], 16),
	        g: parseInt(result[2], 16),
	        b: parseInt(result[3], 16)
	    } : null;
	},
	// a better typeof
	type = q.type = function (mixedVar) {
		var type = typeof(mixedVar);
		if(type != "object") {
			return type;
		}
		switch(mixedVar) {
			case null:
				return 'null';
			case window:
				return 'window';
			case document:
				return 'document';
			case window.event:
				return 'event';
			default:
				break;
		}
		switch(mixedVar.constructor) {
			case Array:
				return 'array';
			case Boolean:
				return 'boolean';
			case Date:
				return 'date';
			case Object:
				return 'object';
			case RegExp:
				return 'regexp';
			case ReferenceError:
			case Error:
				return 'error';
			case null:
			default:
				break;
		}
		switch(mixedVar.nodeType) {
			case 1:
				return 'domelement';
			case 3:
				return 'string';
			case null:
			default:
				break;
		}
		return 'Unknown';
	},
	// Report an error
	error = q.error = function (objError) {
		console.log(objError);
		return this;
	},
	// source: https://stackoverflow.com/questions/4817029/whats-the-best-way-to-detect-a-touch-screen-device-using-javascript/4819886#4819886
	is_touch_device = q.is_touch_device = function () {
		var prefixes = ' -webkit- -moz- -o- -ms- '.split(' ');
		var mq = function(query) {
			return window.matchMedia(query).matches;
  		}
		if (('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch) {
			return true;
		}
		var query = ['(', prefixes.join('touch-enabled),('), 'heartz', ')'].join('');
		return mq(query);
	},
	// Added functions to the q lib
	fn = q.plugin = function (mixedName, fnCallback) {
		iterate(typeof mixedName == "string" ? [mixedName] : mixedName, function (k,strName) {
			fun[strName] = function () {
				var that = this;
				if (that.orFired)
					return that;
				that.caller = strName;
				if (strName == 'if' || strName == 'else') {
					if (!prospectQueue.call(that,arguments,strName))
						return that;
				}
				// pre dispatch
				if (strName != 'else' && !that.conditions[that.condition_count]){ // if this level condition wasnt matched
					return that; // pass the query on without doing anything
				}
				var mixedResult = fnCallback.apply(that,arguments);
				return mixedResult;
			};
		});
	},
	// Animation easings still used for scrolling
	easings = q.easings = {};
	easings.linear = function(t, b, c, d) {return c * t / d + b;};
	easings.easeInQuad = function(t, b, c, d) {return c * (t /= d) * t + b;};
	easings.easeOutQuad = function(t, b, c, d) {return -c * (t /= d) * (t - 2) + b;};
	easings.easeInOutQuad = function(t, b, c, d) {if ((t /= d / 2) < 1) return c / 2 * t * t + b;return -c / 2 * ((--t) * (t - 2) - 1) + b;};
	easings.easeInCubic = function(t, b, c, d) {return c * (t /= d) * t * t + b;};
	easings.easeOutCubic = function(t, b, c, d) {return c * ((t = t / d - 1) * t * t + 1) + b;};
	easings.easeInOutCubic = function(t, b, c, d) {if ((t /= d / 2) < 1) return c / 2 * t * t * t + b;return c / 2 * ((t -= 2) * t * t + 2) + b;};
	easings.easeInQuart = function(t, b, c, d) {return c * (t /= d) * t * t * t + b;};
	easings.easeOutQuart = function(t, b, c, d) {return -c * ((t = t / d - 1) * t * t * t - 1) + b;};
	easings.easeInOutQuart = function(t, b, c, d) {if ((t /= d / 2) < 1) return c / 2 * t * t * t * t + b;return -c / 2 * ((t -= 2) * t * t * t - 2) + b;};
	easings.easeInQuint = function(t, b, c, d) {return c * (t /= d) * t * t * t * t + b;};
	easings.easeOutQuint = function(t, b, c, d) {return c * ((t = t / d - 1) * t * t * t * t + 1) + b;};
	easings.easeInOutQuint = function(t, b, c, d) {if ((t /= d / 2) < 1) return c / 2 * t * t * t * t * t + b;return c / 2 * ((t -= 2) * t * t * t * t + 2) + b;};
	easings.easeInSine = function(t, b, c, d) {return -c * Math.cos(t / d * (Math.PI / 2)) + c + b;};
	easings.easeOutSine = function(t, b, c, d) {return c * Math.sin(t / d * (Math.PI / 2)) + b;};
	easings.easeInOutSine = function(t, b, c, d) {return -c / 2 * (Math.cos(Math.PI * t / d) - 1) + b;};
	easings.easeInExpo = function(t, b, c, d) {return (t == 0) ? b : c * Math.pow(2, 10 * (t / d - 1)) + b;};
	easings.easeOutExpo = function(t, b, c, d) {return (t == d) ? b + c : c * (-Math.pow(2, -10 * t / d) + 1) + b;};
	easings.easeInOutExpo = function(t, b, c, d) {if (t == 0) return b;if (t == d) return b + c;if ((t /= d / 2) < 1) return c / 2 * Math.pow(2, 10 * (t - 1)) + b;return c / 2 * (-Math.pow(2, -10 * --t) + 2) + b;};
	easings.easeInCirc = function(t, b, c, d) {return -c * (Math.sqrt(1 - (t /= d) * t) - 1) + b;};
	easings.easeOutCirc = function(t, b, c, d) {return c * Math.sqrt(1 - (t = t / d - 1) * t) + b;};
	easings.easeInOutCirc = function(t, b, c, d) {if ((t /= d / 2) < 1) return -c / 2 * (Math.sqrt(1 - t * t) - 1) + b;return c / 2 * (Math.sqrt(1 - (t -= 2) * t) + 1) + b;};
	easings.easeInElastic = function(t, b, c, d) {var p = 0;var a = c;if (t == 0) return b;if ((t /= d) == 1) return b + c;if (!p) p = d * .3;if (a < Math.abs(c)) {a = c;var s = p / 4;}else var s = p / (2 * Math.PI) * Math.asin(c / a);return -(a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b;};
	easings.easeOutElastic = function(t, b, c, d) {var p = 0;var a = c;if (t == 0) return b;if ((t /= d) == 1) return b + c;if (!p) p = d * .3;if (a < Math.abs(c)) {a = c;var s = p / 4;}else var s = p / (2 * Math.PI) * Math.asin(c / a);return a * Math.pow(2, -10 * t) * Math.sin((t * d - s) * (2 * Math.PI) / p) + c + b;};
	easings.easeInOutElastic = function(t, b, c, d) {var p = 0;var a = c;if (t == 0) return b;if ((t /= d / 2) == 2) return b + c;if (!p) p = d * (.3 * 1.5);if (a < Math.abs(c)) {a = c;var s = p / 4;}else var s = p / (2 * Math.PI) * Math.asin(c / a);if (t < 1) return -.5 * (a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b;return a * Math.pow(2, -10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p) * .5 + c + b;};
	easings.easeInBack = function(t, b, c, d, s) {if (s == undefined) s = 1.70158;return c * (t /= d) * t * ((s + 1) * t - s) + b;};
	easings.easeOutBack = function(t, b, c, d, s) {if (s == undefined) s = 1.70158;return c * ((t = t / d - 1) * t * ((s + 1) * t + s) + 1) + b;};
	easings.easeInOutBack = function(t, b, c, d, s) {if (s == undefined) s = 1.70158;if ((t /= d / 2) < 1) return c / 2 * (t * t * (((s *= (1.525)) + 1) * t - s)) + b;return c / 2 * ((t -= 2) * t * (((s *= (1.525)) + 1) * t + s) + 2) + b;};
	easings.easeInBounce = function(t, b, c, d) {return c - easings.easeOutBounce(d - t, 0, c, d) + b;};
	easings.easeOutBounce = function(t, b, c, d) {if ((t /= d) < (1 / 2.75)) {return c * (7.5625 * t * t) + b;} else if (t < (2 / 2.75)) {return c * (7.5625 * (t -= (1.5 / 2.75)) * t + .75) + b;} else if (t < (2.5 / 2.75)) {return c * (7.5625 * (t -= (2.25 / 2.75)) * t + .9375) + b;} else {return c * (7.5625 * (t -= (2.625 / 2.75)) * t + .984375) + b;}};
	easings.easeInOutBounce = function(t, b, c, d) {if (t < d / 2) return easings.easeInBounce(t * 2, 0, c, d) * .5 + b;return easings.easeOutBounce(t * 2 - d, 0, c, d) * .5 + c * .5 + b;};
	// define prototype object
	q.prototype = fun;
	q.is_q = 1;

	q.zIndex = {
		increment: 100,
		current: 1000,
		add: function () {
			q.zIndex.current += q.zIndex.increment;
			return q.zIndex.current;
		},
		remove: function () {
			q.zIndex.current -= q.zIndex.increment;
			return q.zIndex.current;
		}
	};

	// stores callbacks, to be recalled at a later time
	// optionally watches for uniqueness to prevent duplicate calls
	// params.unique for unique key value hook
	q.hook = function (params) {
		if (!params)
			params = {};
		var bank = [];
		var watching = {};
		return function (fnRegister) {
			var arrResult = [];
			var arrParams = Object.values(arguments);
			arrParams.shift();
			if (fnRegister !== undefined) {
				bank.push(fnRegister);
			} else {
				for (var intItr in bank) {
					if (!params.unique || watching[arrParams[0]] !== arrParams[1]) {
						if (params.unique)
							watching[arrParams[0]] = arrParams[1];
						arrResult.push(bank[intItr].apply(this, arrParams));
					}
				}
			}
			return arrResult;
		};
	};

	// Returns a function, that, as long as it continues to be invoked, will not
	// be triggered unless the last trigger has hasnt been for longer than <wait> seconds
	q.debounce = function (wait, func, immediate) {
		var timeout;
		return function() {
			var context = this, args = arguments;
			var later = function() {
				timeout = null;
				if (!immediate) func.apply(context, args);
			};
			var callNow = immediate && !timeout;
			q.clear(timeout);
			timeout = setTimeout(later, wait);
			if (callNow) func.apply(context, args);
		};
	};
	
	// Returns a function, that, as long as it continues to be invoked, will only
	// trigger every N milliseconds
	q.throttle = function (func, wait, immediate) {
		var timeout;
		return function() {
			var context = this, args = arguments;
			var later = function() {
				timeout = null;
				if (!immediate) func.apply(context, args);
			};
			var callNow = immediate && !timeout;
			if ( !timeout ) timeout = q.delay( wait, later );
			if (callNow) func.apply(context, args);
		};
	};
	var intHashOffset = 0;
	q.hash_offset = function (offset) {
		$(function () {
			if ( "onhashchange" in window ) {
				if (offset != undefined) {
					intHashOffset = offset
					$(window).unbind("hashchange.hash_offset load.hash_offset");
				}
				var hashHandler = function(e) {
					var hash = window.location.hash.substring( 1 );
					if ( !hash )
						return;
					var sel = 'a[name="' + hash + '"]';
					var $sel = $( sel );
					var $a = $('a[href="#' + hash + '"]:not(.prevented)');
					if ($a.length) {
						$a.bind('click.hash_offset', function (e) {
							var hash = window.location.hash.substring( 1 );
							if ($(this).attr('href') == '#'+hash)
								e.preventDefault();
						}).addClass('prevented');
					}
					if ($sel.length) {
						var currentOffset = $sel.offset().top;
						var intNewTop = currentOffset - intHashOffset;
						$('body').scrollTop( intNewTop );
						$.delay(10, function () {
							$('body').scrollTop( intNewTop );
						});
					}
				};
				if (offset != undefined) {
					$(window).bind("hashchange.hash_offset", hashHandler);
					$(window).bind("load.hash_offset", hashHandler);
				}
				
				hashHandler();
			}
		});
	};

	var componentsTemplates = {};
	var componentsLoadedCallbacks = {};
	var components = {};
	var routes = {};
	var routesOpen = [];
	q.component = {};
	var fnComponentRoot = function (objComponent) {
		return {
			mount: function (mixedLocation) {
				$(mixedLocation).append(objComponent.template);
				if (objComponent.mounted)
					objComponent.mounted();
				q.component.mount.call(objComponent);
			},
			unmount: function (mixedLocation) {
				objComponent.template.remove();
				if (objComponent.unmounted)
					objComponent.unmounted();
			}
		};
	};
	function checkRoutePath() {
		var strLocation = window.location.hash;
		var strLocationWithHash = strLocation === '' ? '#' : strLocation;
		var $a = $("a[href='" + strLocationWithHash + "']");
		$(".q-link-active").removeClass('q-link-active');
		$a.addClass('q-link-active');
	}
	function checkRoute() {
		var strLocation = window.location.hash;
		checkRoutePath();
		var route;
		var strPath;
		for (strPath in routes) {
			if (strLocation.match(new RegExp("^" + strPath + "$"))) {
				route = routes[strPath];
				break;
			}
		}
		if (route) {
			// close routes
			for (var intRouteOpen in routesOpen) {
				var strOpenRoute = routesOpen[intRouteOpen];
				var objOpenRoute = routes[strOpenRoute];

				//for (var intPath in objOpenRoute.paths) {
				//	var strOpenPath = objOpenRoute.paths[intPath];
				for (var intPath in route.paths) {
					if (route.paths[intPath].match(new RegExp("^" + strOpenRoute + "$"))) {
						return; // route already open
					}
				}

				// unmount route
				for (var strName in routes[strOpenRoute].components) {
					var objRouteComponent = routes[strOpenRoute].components[strName];
					var $placeholder = $(document.createComment(''));
					objRouteComponent.tag = $placeholder;
					$placeholder.appendAfter(objRouteComponent.component.template);
					objRouteComponent.component.template.remove();
					if (objRouteComponent.component.unmounted)
						objRouteComponent.component.unmounted();
				}
				routesOpen.shift();
			}
			// open route
			for (var strName in route.components) {
				var objRouteComponent = route.components[strName];
				routesOpen.push(strPath)
				var strId = objRouteComponent.id;
				function setComponent () {
					var $placeholder = $(document.createComment(''));
					$placeholder.appendAfter(objRouteComponent.tag);
					$placeholder.replace(objComponent.template);
					objRouteComponent.tag.remove();
					if (objComponent.mounted)
						objComponent.mounted();
					q.component.mount.call(objComponent);
					$.delay(10, function () {
						checkRoutePath();
						$.hash_offset();
					});
				}
				var objComponent = q.component.load(strName, setComponent);
				objRouteComponent.component = objComponent;
				if (!objComponent.loading) {
					setComponent();
				}
			}
		}
	}

	window.addEventListener("popstate", checkRoute);
	var intRouteCounter = 0;
	q.component.route = function (mixedPath, strName) {
		var arrPath = mixedPath;
		if (!Array.isArray(mixedPath)) {
			arrPath = [mixedPath];
		}
		
		// intialize a route for each path provided
		for (var intPath in arrPath) {
			// set placeholder
			var strId = "q__component__router__" + intRouteCounter++;
			document.write("<q__component__router id='" + strId + "' style='display:none'></q__component__router>");
			var $placeholder = $("#" + strId);
			$placeholder.replace(document.createComment(''));

			var strPath = arrPath[intPath];
			if (!routes[strPath]) {
				routes[strPath] = {
					name: strName,
					components: {},
					paths: arrPath
				};
			}
			if (routes[strPath].components[strName])
				throw "Error component " + strName + " was route injected twice";
			routes[strPath].components[strName] = {
				id: strId,
				name: strName,
				tag: $placeholder
			};

		}
	};
	q.component.set = function (strName, fnCallback) {
		// generate root component
		var objComponent = new fnCallback();
		Object.assign(objComponent, fnComponentRoot(objComponent));
		// add template to new component
		var $template = componentsTemplates[strName].find("template");
		objComponent.template = $($template.html());
		$template.remove();

		$('body').append(componentsTemplates[strName].children());
		checkRoutePath();
		componentsTemplates[strName].remove();
		delete componentsTemplates[strName];
		objComponent.name = strName;
		Object.assign(components[strName], objComponent);
		objComponent = components[strName];
		delete objComponent.loading;
		objComponent.loaded = true;
		objComponent.finsihed_loading();
		delete objComponent.finsihed_loading;
		if (objComponent.created)
			objComponent.created();
		if (componentsLoadedCallbacks[strName]) {
			componentsLoadedCallbacks[strName](objComponent);
			delete componentsLoadedCallbacks[strName];
		}
		console.log('objComponent', objComponent);
	};
	q.component.get = function (strName) {
		return q.component.load(strName);
	};
	q.component.insert = function (strName) {
		var strId = "q__component__inject__" + strName;
		document.write("<q__component__inject id='" + strId + "'></q__component__inject>");

		var objComponent = q.component.load(strName, function () {
			$("#" + strId).replace(objComponent.template);
			if (objComponent.mounted)
				objComponent.mounted();
			q.component.mount.call(objComponent);
		});
	};
	q.component.root = "";
	q.component.mount = q.hook();
	q.component.load = function (strName, strUrl, fnLoaded) {
		if (typeof strUrl === 'function') {
			fnLoaded = strUrl;
			strUrl = undefined;
		}
		var objComponent = components[strName];
		if (!objComponent || !objComponent.loading && !objComponent.loaded) {
			componentsLoadedCallbacks[strName] = fnLoaded;
			// auto loader
			if (!strUrl) {
				q.component.root = q.component.root.replace(/\/$/, '');
				var arrPath = strName.split('_');
				strFileName = arrPath.pop()+".htm";
				strUrl = q.component.root + '/' + arrPath.join('/') + '/' + strFileName;
			}
			// create root component
			objComponent = {
				loading: true,
				finsihed_loading: q.hook()
			};
			components[strName] = objComponent;
			$.request({
				url : strUrl,
				success : function (strResponse) {
					componentsTemplates[strName] = $("<div style='display:none'>").appendTo('body');
					$(componentsTemplates[strName]).append(strResponse);
				}
			});
		}
		return objComponent;
	};
	
	fn('rtrim', function (intFromRight) {
		var that = this;
		if (!prospectQueue.call(that,arguments,'rtrim'))
			return that;
		fnTrimQueue.call(that);
		return that;
	});

	// add in-framework logic
	fn('if', function (mixedValue) {
		var that = this;
		mixedValue = fnResolve.call(this,mixedValue);
		that.conditions[that.condition_count+1] = !!mixedValue;
		that.condition_count++;
		return that;
	});

	// else logic
	fn('else', function (mixedValue) {
		var that = this,
		v;
		if (typeof mixedValue == "undefined") {
			v = !that.conditions[that.condition_count];
		} else {
			mixedValue = fnResolve.call(that,mixedValue);
			v = !!mixedValue;
		}
		that.conditions[that.condition_count] = v;
		return that;
	});

	fn('or', function (mixedAction) {
		var that = this;
		if (!prospectQueue.call(that,arguments,'or') || that.length)
			return that;
		that.orFired = true;
		if (typeof mixedAction == "function")
			mixedAction.call(that);
		return this;
	});

	fn('index', function (strMatch) {
		var that = this;
		if (!that.length)
			return that;
		return [].slice.call(that.parent().children(strMatch)).indexOf(that[0]);
	});
	
	// DOM Ready
	fn('ready', function (fnCallback) {
		if (document.readyState === "complete") {
			if (fnCallback)
				fnCallback();
			return true;
		} else {
			if (!fnCallback)
				return false;
			// Create the promise
			arrReadyPromises.push(fnCallback);
			// Set the even listeners
			if (!boolReadyEventsOn) {
				boolReadyEventsOn = true;
				var
				// call all the promised functions
				ready = function () {
					for (var intItr in arrReadyPromises) {
						arrReadyPromises[intItr]();
					}
				},
				// attach event for dom ready
				completed = function( event ) {
					if ( document.addEventListener || event.type === "load" || document.readyState === "complete" ) {
						detach();
						ready();
					}
				},
				// detatch completed function
				detach = function() {
					if ( document.addEventListener ) {
						document.removeEventListener( "DOMContentLoaded", completed, false );
						window.removeEventListener( "load", completed, false );

					} else {
						document.detachEvent( "onreadystatechange", completed );
						window.detachEvent( "onload", completed );
					}
				};
				if ( document.addEventListener ) {
					document.addEventListener( "DOMContentLoaded", completed, false );
					// A fallback to window.onload, that will always work
					window.addEventListener( "load", completed, false );
				// If IE event model is used
				} else {
					// Ensure firing before onload, maybe late but safe also for iframes
					document.attachEvent( "onreadystatechange", completed );
					// A fallback to window.onload, that will always work
					window.attachEvent( "onload", completed );
				}
			}
		}
	});
	
	// gives a q something to do. used when q is called as a function
	fn('put', function (mixedQuery,strType) {
		var 
		that = this,
		queryType = strType || typeof mixedQuery;
		//if (queryType === 'string')
			//mixedQuery = mixedQuery.replace(/^[\r\n]+/g, '').trim();
		if (queryType == 'undefined') {
			return that;
		} else if (queryType == 'function') {
			return that.ready(mixedQuery); // DOM ready
		} else if (queryType == 'object') {
			var i=0;
			if (isNode(mixedQuery)) {
				that[i++] = mixedQuery;
			} else if (mixedQuery.is_qchain) {
				return mixedQuery;
			} else if (Array.isArray(mixedQuery)) {
				iterate(mixedQuery,function () {
					that[i++] = this;
				});
			} else {
				that[i++] = mixedQuery;
			}
			fnTrimQueue.call(that,i);
		} else if (queryType == 'string' && mixedQuery.match(/</) && mixedQuery.match(/>/) && mixedQuery.length >= 3) {
			return that.make(mixedQuery,BYPASS_QUEUE);
		} else
			return fun.find(mixedQuery);
		return that;
	});

	// Create HTML within the selection
	fn('make', function (strHTML) {
		var 
		that = this;
		if (!prospectQueue.call(that,arguments,'make'))
			return that;
		var wrapper = document.createElement('div');
		wrapper.innerHTML = strHTML;
		var
		children = wrapper.children,
		len = Math.max(children.length, that.length),
		i=0;
		while (i<len)
			that[i] = children[i++];
		that.length = i;
		fnTrimQueue.call(that,i);
		var script = $(wrapper).find("script").each(function() {
			var that = this;
			var strJS = that.innerHTML.replace(/\t/g, "\n");
			q.delay(1, function () { Function(strJS)() });
		});
		return that;
	});

	// Find elements in dom that matches a CSS selection
	// Adds them as a list to a copy of the q object
	fn('find', function (strQuery) {
		var that = this,
		l=that.length;
		if (that.layers!=0 && !l)
			return that;
		var qcopy = copy(fun), // start with a fresh q handle
		arrResult = [],
		i=0;

		qcopy.layers=that.layers+1;
		var arrMatched = strQuery.match(/^ *> *(.+)/);
		if (arrMatched) {
			iterate(that.children(), function (k,el) {
				if (arrMatched[1] == "*" || q(el).is(arrMatched[1]))
					qcopy[i++] = el;
			});
		} else {
			if (!l)
				arrResult = [].slice.call(document.querySelectorAll(strQuery));
			else while (i<l) {
				var arrSubResult = [].slice.call(that[i++].querySelectorAll(strQuery));
				arrResult = arrResult.concat(arrSubResult);
			}
			l = arrResult.length;
			i=0;
			while (i<l)
				qcopy[i] = arrResult[i++];
		}
		qcopy.length = i;
		return qcopy;
	});

	// Check if matches a selection
	fn('is', function (strQuery) {
		var boolIs = true;
		iterate(this,function (k,el) {
			if (!(el.matches || el.matchesSelector || el.msMatchesSelector || el.mozMatchesSelector || el.webkitMatchesSelector || el.oMatchesSelector).call(el, strQuery)) {
				boolIs = false;
				return false;
			}
		});
		return boolIs;
	});

	// Clone a dom node
	fn('clone', function (boolDeep) {
		var that = this;
		if (!prospectQueue.call(that,arguments,'clone'))
			return that;
		var qcopy = copy(that),
		len = 0;
		boolDeep = boolDeep !== false;
		iterate(that,function (k,v) {
			qcopy[k] = v.cloneNode(boolDeep);
			len++;
		});
		fnTrimQueue.call(qcopy,len);
		return qcopy;
	});

	// Store data on a DOM node
	fn('data', function (strKey, strVal) {
		var 
		boolGet = typeof strVal == "undefined",
		arrDataResult = [];
		iterate(this,function (j,el) {
			if (!el) return;
			var intUId = q(el).uniqueId();
			if (boolGet)
				arrDataResult.push(arrDataMemory[intUId] && typeof arrDataMemory[intUId][strKey] != 'undefined' ? arrDataMemory[intUId][strKey] : null);
			else {
				if (!arrDataMemory[intUId])
					arrDataMemory[intUId] = {};
				arrDataMemory[intUId][strKey] = strVal;
			}
		});
		if (boolGet)
			return arrDataResult.length == 1 ? arrDataResult[0] : arrDataResult;
		else
			return this;
	});

	fn('checked', function (boolValue) {
		var that = this;
		if (typeof boolValue == "undefined") {
			if (!that.length)
				return null;
			var boolResult = true;
			iterate(that,function (j,el) {
				if (!el.checked)
					boolResult = false;
			});
			return boolResult;
		} else {
			iterate(that,function (j,el) {
				el.checked = boolValue;
			});
		}
	});

	// Get all the HTML currently held as nodes in the current query
	fn('html', function (strHTML, strAttrKey) {
		var that = this;
		var htmlAttr = strAttrKey || "innerHTML";
		if (strHTML == undefined) {
			strHTML = "";
			iterate(that,function (k,el) {
				strHTML += el[htmlAttr];
			});
			return strHTML;
		}
		if (!prospectQueue.call(that,arguments,'html'))
			return that;
		strHTML = fnResolve.call(that,strHTML);
		iterate(that,function (k,el) {
			el[htmlAttr] = strHTML;
		});
		return that;
	});

	// Get or alter the elements tag name
	fn('tagName', function (strAlter) {
		var that = this;
		if (typeof strAlter == 'undefined') {
			return that[0].tagName;
		} else {
			var item = q(
				that[0]
				.outerHTML
				.replace(new RegExp('^<' + that.tagName() + ' ','i'), "<" + strAlter + ' ')
				.replace(new RegExp(that.tagName() + '>','i'), strAlter + '>')
			);
			that.replace(item);
			that[0] = item[0]; // recreate the ref
		}
		return that;
	});
	
	// Get the children of a node
	fn('children', function (strMatch) {
		var
		qcopy = copy(fun),
		intNode = 0,
		boolMatch = typeof strMatch !== 'undefined';
		iterate(this,function (k,el) {
			var 
			nodes = el.childNodes,
			intNodes = nodes.length;
			for (var i=0;i!=intNodes;i++) {
				if (!boolMatch || q(nodes[i]).is(strMatch))
					qcopy[intNode++] = nodes[i];
			}
		});
		qcopy.length = intNode;
		return qcopy;
	});
	// first child
	fn('first', function (strMatch) {
		var
		qcopy = copy(fun),
		intNode = 0,
		boolMatch = typeof strMatch !== 'undefined';
		iterate(this,function (k,el) {
			var 
			nodes = el.childNodes,
			intNodes = nodes.length;
			for (var i=0;i!=intNodes;i++) {
				if (!boolMatch || q(nodes[i]).is(strMatch)) {
					qcopy[0] = nodes[i];
					qcopy.length = 1;
					return qcopy;
				}
			}
		});
		return qcopy;
	});
	// last child
	fn('last', function (strMatch) {
		var
		qcopy = copy(fun),
		intNode = 0,
		boolMatch = typeof strMatch !== 'undefined';
		riterate(this,function (k,el) {
			var 
			nodes = el.childNodes,
			intNodes = nodes.length;
			for (var i=intNodes-1;i>=0;i--) {
				if (!boolMatch || q(nodes[i]).is(strMatch)) {
					qcopy[0] = nodes[i];
					qcopy.length = 1;
					return qcopy;
				}
			}
		});
		return qcopy;
	});
	
	// Add CSS for disabled selection (Investigate depreciation because this should likely always be handeled with pure CSS)
	fn('disableSelect', function () {
		var that = this;
		if (!prospectQueue.call(that,arguments,'disableSelect'))
			return that;
		var none = "none";
		iterate(that,function (k,el) {
			q(el).css({
				'-webkit-touch-callout': none, /* iOS Safari */
			    '-webkit-user-select': none, /* Safari */
			     '-khtml-user-select': none, /* Konqueror HTML */
			       '-moz-user-select': none, /* Firefox */
			        '-ms-user-select': none, /* Internet Explorer/Edge */
			            'user-select': none /* Non-prefixed version, currently
			                                  supported by Chrome and Opera */
			},undefined,undefined,undefined,BYPASS_QUEUE);
		});
		return that;
	});

	// Same as .html except with the outer html
	fn('outer', function (strHTML) {
		return this.html(strHTML, "outerHTML");
	});
	
	// Add text to a DOM node
	fn('text', function (strText) {
		return this.html(strText, "textContent");
	});
	
	// set the value of an input
	fn('val', function (strVal) {
		var that = this;
		if (!prospectQueue.call(that,arguments,'val'))
			return that;
		if (!that[0])
			return;
		if (strVal == undefined)
			return that[0].value;
		that[0].value = strVal;
		return that;
	});

	// Find the top left position of a DOM object
	fn('position', function () {
		var el = this[0],
		rect = el.getBoundingClientRect(), 
		scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
		scrollTop = window.pageYOffset || document.documentElement.scrollTop;
	    return { 
	    	top: rect.top + scrollTop,
	    	left: rect.left + scrollLeft
	    };
	});
	
	// Get the left or top, right or bottom position of something (if you need both left and top use position for higher performance)
	fn('left', function () {
		return this.position().left;
	});
	fn('top', function () {
		return this.position().top;
	});
	fn('bottom', function () {
		return this.position().top+this.height();
	});
	fn('right', function () {
		return this.position().left+this.width();
	});
	fn('show', function (strCustomDisplay) {
		var that = this;
		that.css({
			display: strCustomDisplay || 'block'
		});
		q.delay(10, function () {
			that.addClass('show');
		});
		return  that;
	});
	fn('hide', function (intTransitionLength, strCustomDisplay) {
		var that = this;
		if (intTransitionLength === undefined)
			intTransitionLength = 1000;
		that.removeClass('show');
		q.delay(intTransitionLength, function () {
			that.css({
				display: strCustomDisplay || 'none'
			});
		});
		return that;
	});
	
	// Find out if something has scrolled into the visible range of the screen
	fn('inViewY', function () {
		var intTotal = 0;
		iterate(this,function (k,el) {
			var 
			$el = $(el),
			intTop = $el.scrollTop(),
			intHeight = $el.height(),
			intAmount = Math.max(0, Math.min(intHeight, intTop + intHeight));
			intAmount -= Math.max(0, Math.min(intHeight, intTop - q.height() + intHeight));
			intTotal += intAmount;
		});
		return intTotal;
	});
	
	fn('inViewX', function () {
		var intTotal = 0;
		iterate(this,function (k,el) {
			var 
			$el = $(el),
			intLeft = $el.scrollLeft(),
			intWidth = $el.width(),
			intAmount = Math.max(0, Math.min(intWidth, intLeft + intWidth));
			intAmount -= Math.max(0, Math.min(intWidth, intLeft - q.width() + intWidth));
			intTotal += intAmount;
		});
		return intAmount;
	});
	
	// Find the top left position of a DOM relative to the nearest relative, absolute or fixed positioned object
	fn('offset', function () {
		var 
		selfPos = this.position(),
		parentPos = this.offsetParent().position();
		return {
			left : selfPos.left-parentPos.left,
			top : selfPos.top-parentPos.top
		};
	});

	// Scroll to a specfic object on the page
	fn('scrollTo', function (mixedDuration, strEasing, fnCallback) {
		var that = this;
		if (!prospectQueue.call(that,arguments,'scrollTo'))
			return that;
		q('body').scrollTop(that.top(), mixedDuration, strEasing, fnCallback);
		return that;
	});

	// Get or set the scroll top location
	fn('scrollTop', function (mixedTop, mixedDuration, strEasing, fnCallback) {
		var that = this;
		if (!prospectQueue.call(that,arguments,'scrollTop'))
			return that;
		var strType = typeof mixedTop;
		// set
		if (strType != "undefined") {
			var destinationOffset = strType == "number" ? mixedTop : q(mixedTop).position().top;
			if (!mixedDuration || mixedDuration == "smooth") {
				var objParams = {
					top: destinationOffset
				};
				if (mixedDuration == "smooth")
					objParams.behavior = "smooth";
				return window.scroll(objParams);
			}
			var start = that.scrollTop();
			var startTime = 'now' in window.performance ? performance.now() : new Date().getTime();
			var documentHeight = q(document).height();
			var windowHeight = q.height();
			var destinationOffsetToScroll = Math.round(documentHeight - destinationOffset < windowHeight ? documentHeight - windowHeight : destinationOffset);
			var fnEasing = easings[strEasing||'linear'];
			if (typeof mixedDuration == "undefined")
				mixedDuration = 0;
			function scroll() {
				var now = 'now' in window.performance ? performance.now() : new Date().getTime();
				var time = Math.min(1, ((now - startTime) / mixedDuration));
				var timeFunction = fnEasing(time, 0, 1, 1);
				var x = Math.ceil((timeFunction * (destinationOffsetToScroll - start)) + start);
				window.scroll(0, x);

				if (that.scrollTop() === destinationOffsetToScroll) {
					if (fnCallback) {
						fnCallback();
					}
					return;
				}
				requestAnimationFrame(scroll);
			}
			scroll();
			return that;
		}
		// get
		var el = that[0];
		if (el == window) {
			return window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;
		} else {
			return that.position().top-q(window).scrollTop();
		}
	});
	// Get or set the scroll left location
	fn('scrollLeft', function (mixedLeft, mixedDuration, strEasing, fnCallback) {
		var that = this;
		if (!prospectQueue.call(that,arguments,'scrollLeft'))
			return that;
		var strType = typeof mixedLeft;
		// set
		if (strType != "undefined") {
			var destinationOffset = strType == "number" ? mixedLeft : q(mixedLeft).position().left;
			if (!mixedDuration || mixedDuration == "smooth") {
				var objParams = {
					left: destinationOffset,
					block: "center",
					inline: "center"
				};
				if (mixedDuration == "smooth")
					objParams.behavior = "smooth";
				return window.scroll(objParams);
			}
			var start = that.scrollLeft();
			var startTime = 'now' in window.performance ? performance.now() : new Date().getTime();
			var documentWidth = q(document).width();
			var windowWidth = q.width();
			var destinationOffsetToScroll = Math.round(documentWidth - destinationOffset < windowWidth ? documentWidth - windowWidth : destinationOffset);
			var fnEasing = easings[strEasing||'linear'];
			if (typeof mixedDuration == "undefined")
				mixedDuration = 0;
			function scroll() {
				var now = 'now' in window.performance ? performance.now() : new Date().getTime();
				var time = Math.min(1, ((now - startTime) / mixedDuration));
				var timeFunction = fnEasing(time, 0, 1, 1);
				var x = Math.ceil((timeFunction * (destinationOffsetToScroll - start)) + start);
				window.scroll(x, 0);

				if (that.scrollLeft() === destinationOffsetToScroll) {
					if (fnCallback) {
						fnCallback();
					}
					return;
				}
				requestAnimationFrame(scroll);
			}
			scroll();
			return that;
		}
		// get
		var el = that[0];
		if (el == window) {
			return window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft;
		} else {
			return that.position().left-q(window).scrollLeft();
		}
	});

	function getWidthHeight(strType) {
		if (this[0] == document) {
			var db = document.body,
			de = document.documentElement;
			return Math.max(
				db["scroll" + strType], de["scroll" + strType],
				db["offset" + strType], de["offset" + strType],
				db["client" + strType], de["client" + strType]
			);
		}
		return this[0]["inner" + strType] || this[0]["offset" + strType] || this[0]["client" + strType];
	}
	function getProcessedWidthHeight(strType) {
		if (strType == 'Width')
			return parseInt(this.css('border-left-width')) + parseInt(this.css('padding-left')) + parseInt(this.css('width')) + parseInt(this.css('padding-right')) + parseInt(this.css('border-right-width'));
		else
			return parseInt(this.css('border-top-width')) + parseInt(this.css('padding-top')) + parseInt(this.css('height')) + parseInt(this.css('padding-bottom')) + parseInt(this.css('border-bottom-width'));
	}
	// DOM width
	fn('width', function (mixedValue, boolProcessed) {
		if (typeof mixedValue != 'undefined')
			return this.css('width',mixedValue);
		else
			return boolProcessed ? getProcessedWidthHeight.call(this,"Width"): getWidthHeight.call(this,"Width");
	});
	q.width = function () {
		return q(window).width();
	};
	q.scrollWidth = function () {
		return Math.max(
			document.body.scrollWidth, document.documentElement.scrollWidth,
			document.body.offsetWidth, document.documentElement.offsetWidth,
			document.body.clientWidth, document.documentElement.clientWidth
		);
	};
	q.copyToClipboard = function (strVal) {
		var $el = $("<textarea>")
		.val(strVal)
		.attr('readonly', '')
		.css({
			position : 'absolute',
			left : '-9999px'
		})
		.appendTo('body')
		var selected 
			= document.getSelection().rangeCount > 0
			? document.getSelection().getRangeAt(0)
			: false;
		$el[0].select();
		document.execCommand('copy');
		$el.remove();
		if (selected) {
			document.getSelection().removeAllRanges();
			document.getSelection().addRange(selected);
		}
	};
	
	// DOM height
	fn('height', function (mixedValue, boolProcessed) {
		if (typeof mixedValue != 'undefined')
			return this.css('height',mixedValue);
		else
			return boolProcessed ? getProcessedWidthHeight.call(this,"Height") : getWidthHeight.call(this,"Height");
	});
	q.height = function () {
		return q(window).height();
	};
	q.scrollHeight = function () {
		return Math.max(
			document.body.scrollHeight, document.documentElement.scrollHeight,
			document.body.offsetHeight, document.documentElement.offsetHeight,
			document.body.clientHeight, document.documentElement.clientHeight
		);
	};
	q.scrollTop = function () {
		return q(window).scrollTop();
	};
	q.scrollLeft = function () {
		return q(window).scrollLeft();
	};
	
	// sames as lodash get/set
	q.get = function ( object, keys, defaultVal ){
		keys = Array.isArray( keys )? keys : keys.split('.');
		object = object[keys[0]];
		if( object && keys.length>1 ){
			return q.get( object, keys.slice(1));
		}
		return object === undefined? defaultVal : object;
	};
	q.set = function ( object, keys, val ){
		keys = Array.isArray( keys )? keys : keys.split('.');
		if( keys.length>1 ){
			object[keys[0]] = object[keys[0]] || {};
			return q.set( object[keys[0]], keys.slice(1), val );
		}
		object[keys[0]] = val;
	};

	// DOM innerWidth (not counting scrollbars)
	fn('innerWidth', function () {
		if (this[0] == window)
			return document.documentElement.clientWidth || this.width();
		return this[0].clientWidth || this.width();
	});
	// DOM innerHeight (not counting scrollbars)
	fn('innerHeight', function () {
		if (this[0] == window)
			return document.documentElement.clientHeight || this.height();
		return this[0].clientHeight || this.height();
	});

	fn('horizontalBorders', function () {
		return parseInt(this.css('border-top-width')) + parseInt(this.css('border-bottom-width'))
	});
	fn('verticalBorders', function () {
		return parseInt(this.css('border-left-width')) + parseInt(this.css('border-right-width'))
	});
	fn('horizontalMargins', function () {
		return parseInt(this.css('margin-left')) + parseInt(this.css('margin-right'))
	});
	fn('verticalMargins', function () {
		return parseInt(this.css('margin-top')) + parseInt(this.css('margin-bottom'))
	});

	// Dynamically adds a CSS stylesheet
	q.addCSS = function (strCss, arrCss) {
		var that = this;
		if (typeof arrCss == 'object') {
			var strTempCss = strCss + ' {';
			for (var strName in arrCss) {
				strTempCss += strName + ':' + arrCss[strName] + ';';
			}
			strTempCss += '}';
			strCss = strTempCss;
		}

		var all = document.styleSheets;
		if (typeof all[all.length - 1] == 'undefined') {
			document.head.appendChild(document.createElement('style'));
			all = document.styleSheets;
		}
		var s = all[all.length - 1],
		l = s.cssRules.length;
		if (s.insertRule)
			s.insertRule(strCss, l);
		else
			s.addRule(strCss, -1); //IE
		return that;
	};
	fn('addRawCSS', function (strCss) {
		var style = document.createElement('style');
		style.type = 'text/css';
		style.innerHTML = strCss;
		this.append(style);
		return style;
	});
	
	function stringifyTransformData(objTransform) {
		var arrTransforms = [];
		for (var strName in objTransform) {
			var mixedToValue = objTransform[strName];
			arrTransforms.push(strName + "(" + mixedToValue + (typeof mixedToValue == 'string' || arrExcludePx['transform-'+strName] ? '' : 'px') + ")");
		}
		return arrTransforms.join(" ");
	}
	
	function parseTransformData(strTransform) {
		var 
		arrTransform = strTransform.split(/ /),
		arrResult = {};
		for (var intItr in arrTransform) {
			var arrParsed = arrTransform[intItr].split(/[\(\)]/);
			arrResult[arrParsed[0]] = arrParsed[1];
		}
		return arrResult;
	}
	
	// Request or define CSS
	fn('css', function (mixedCss,mixedValue) {
		var that = this;
		if (!that.length)
			return that;
		var cssType = typeof mixedCss;  
		try {
			if (cssType == 'undefined') {
				return getComputedStyle(that[0]);
			} else if (cssType == 'string' && typeof mixedValue == 'undefined') {
				var objStyle = getComputedStyle(that[0]);
				mixedCss = fnResolve.call(that,mixedCss);
				return objStyle ? objStyle[camelToDash(mixedCss)] : 0;
			}
		} catch (e) {
			return false;
		}
		if (!prospectQueue.call(that,arguments,'css'))
			return that;
		mixedCss = fnResolve.call(that,mixedCss);
		if (typeof mixedValue != 'undefined') {
			var params = {};
			params[mixedCss] = mixedValue;
			return that.css(params);
		}
		for (var strKey in mixedCss) {
			var strValue = mixedCss[strKey];
			if (strKey == "transform" && typeof strValue == "object") {
				iterate(that,function (k,el) {
					if (!el) return;
					var intElUid = q(el).uniqueId();
					if (!objTransformHistory[intElUid])
						objTransformHistory[intElUid] = {};
					objTransformHistory[intElUid] = strValue;
				});
				strValue = stringifyTransformData(strValue);
			}
			var 
			strParam = camelToDash(strKey),
			strImportant = /!important *$/.test(mixedCss[strKey]) ? 'important' : '';
			if (typeof strValue == 'string')
				strValue = strValue.replace(/ *!important *$/, '');
			if (
				(typeof strValue == "number" || (strValue+"").match(/^[0-9\.]+$/))
				&& !arrExcludePx[strParam]
			)
				strValue += 'px';
			iterate(that,function (k,el) {
				el.style.setProperty(strParam, strValue, strImportant);
			});
		}
		return that;
	});

	// Check if selection has a class (a bit redundant with .is but should be tested for a performance difference)
	fn('hasClass', function (strClassName) {
		var arrOrs = strClassName.split(/\|/);
		for (var intOr=0; intOr!=arrOrs.length; intOr++) {
			var 
			strSegment = arrOrs[intOr],
			arrClasses = strSegment.split(/ /),
			boolHas = true,
			l=arrClasses.length;
			if (!this.length)
				return false;
			iterate(this,function ()  {
				for (var i=0;i!=l;i++) {
					var strName = arrClasses[i];
					if (!this.classList.contains(strName))
						boolHas = false;
				}
			});
			if (boolHas)
				return true;
		}
		return false
	});
	
	fn('withoutClass', function (strClassList) {
		var that = this;
		var arrNewIndex = [];
		iterate(that,function ()  {
			var node = this;
			if (!q(node).hasClass(strClassList))
				arrNewIndex.push(node);
		});
		that.put(arrNewIndex);
		return that;
	});

	fn('withClass', function (strClassList) {
		var that = this;
		var arrNewIndex = [];
		iterate(that,function ()  {
			var node = this;
			if (q(node).hasClass(strClassList))
				arrNewIndex.push(node);
		});
		that.put(arrNewIndex);
		return that;
	});

	fn('filter', function (strSelection) {
		var that = this;
		var arrNewIndex = [];
		iterate(that,function ()  {
			var node = this;
			if (q(node).is(strSelection))
				arrNewIndex.push(node);
		});
		that.put(arrNewIndex);
		return that;
	});

	// Add a class to the selection
	fn('addClass', function (strClassName, boolRemove) {
		var that = this;
		if (!prospectQueue.call(that,arguments,'addClass'))
			return that;
		var strEvent = boolRemove ? "remove" : "add";
		var arrClassNames = strClassName.split(/ /);
		iterate(arrClassNames, function (k,v) {
			iterate(that,function ()  {
				this.classList[strEvent](v);
			});
		});
		return that;
	});

	// Remove a class
	fn('removeClass', function (strClassName) {
		var that = this;
		if (!prospectQueue.call(that,arguments,'removeClass'))
			return that;
		return that.addClass(strClassName, 1);
	});

	fn('toggleClass', function (strClassName) {
		var that = this;
		if (!prospectQueue.call(that,arguments,'toggleClass'))
			return that;
		return that.hasClass(strClassName) 
			? that.removeClass(strClassName)
			: that.addClass(strClassName);
	});

	// Set an attribute
	fn('attr', function (strKey, strVal, boolRemove) {
		var that = this;
		if (!prospectQueue.call(that,arguments,'attr'))
			return that;
		if (typeof strVal=='undefined')
			return that[0].getAttribute(strKey);
		iterate(that,function () {
			this.setAttribute(strKey, strVal);
		});
		return that;
	});

	// Remove an attribute
	fn('removeAttr', function (strKey) {
		var that = this;
		if (!prospectQueue.call(that,arguments,'removeAttr'))
			return that;
		iterate(that,function () {
			this.removeAttribute(strKey);
		});
		return that;
	});

	// Get a results from the query
	fn('get', function (intIndex) {
		if (intIndex < 0) {
			intIndex = this.length + intIndex;
		}
		if (typeof intIndex != "undefined") {
			if (this[intIndex])
				return this[intIndex];
		} else
			return Array.prototype.slice.call(this);
	});

	// Get a results from the query and return as a new q selection
	fn('become', function (intIndex) {
		return q(this.get(intIndex));
	});

	// Loop though a query
	fn('each', function (fnCallback) {
		var that = this;
		if (!prospectQueue.call(that,arguments,'each'))
			return that;
		iterate(that, function (k,v,p) {
			return fnCallback.call(this,k,v,p);
		});
	});
	fn('reach', function (fnCallback) {
		var that = this;
		if (!prospectQueue.call(that,arguments,'reach'))
			return that;
		riterate(that, function (k,v,p) {
			return fnCallback.call(this,k,v,p);
		});
	});
	q.each = function (obj, fnCallback) {
		iterate(obj, function (k,v,p) {
			return fnCallback.call(this,k,v,p);
		});
	};

	// Bind events
	fn('on', function (strEvents, fnCallback) {
		var that = this;
		if (!prospectQueue.call(that,arguments,'on'))
			return that;
		var arrEvents = strEvents.split(/ /);
		iterate(that,function (k,node) {
			if (!node) return;
			var method = function (e) {
				e = e || window.event;
				e.target = e.target || e.srcElement;
				// defeat Safari bug
				if (e.target.nodeType == 3)
					e.target = e.target.parentNode;
				return fnCallback.call(node, e);
			},
			intNodeUid = q(node).uniqueId();
			q.each(arrEvents, function () {
				var 
				arrEventNames = this.split(/\./),
				strEventName = arrEventNames[0],
				strEventCategory = arrEventNames[1];
				window.addEventListener
				? node.addEventListener(strEventName, method, true)
				: node.attachEvent(arrAutoBind[strEventName] ? 'on' + strEventName : strEventName, method);
				if (!objEventMomory[intNodeUid])
					objEventMomory[intNodeUid] = {};
				if (!objEventMomory[intNodeUid][strEventName])
					objEventMomory[intNodeUid][strEventName] = {};
				objEventMomory[intNodeUid][strEventName][strEventCategory] = method;
			});
		});
		return that;
	});

	fn('bind', function () {
		return this.on.apply(this,arguments);
	});

	// Add short hand methods that call binders automatically defined by arrAutoBind variable
	for (var intAutoBind in arrAutoBind) {
		var strName = arrAutoBind[intAutoBind];
		fn(strName, (function (strName) {
			return function (fnCallback) {
				if (!fnCallback && (strName == 'focus' || strName == 'blur' || strName == 'select' || strName == 'submit')) {
					if (this[0])
						this[0][strName]();
					return this;
				}
				return this[!fnCallback ? "trigger" : "bind"](strName, fnCallback);
			};
		})(strName));
	}

	// unbinds an event
	fn('unbind', function (strEvents) {
		var that = this;
		if (!prospectQueue.call(that,arguments,'unbind'))
			return that;
		var arrEvents = strEvents.split(/ /);
		iterate(that,function (k,node) {
			if (!node) return;
			var qNodeUid = q(node).uniqueId();
			iterate(arrEvents, function () {
				var 
				arrEventNames = this.split(/\./),
				strEventName = arrEventNames[0],
				strEventCategory = arrEventNames[1];
				if (!objEventMomory[qNodeUid])
					return;
				if (strEventCategory) {
					if (!objEventMomory[qNodeUid][strEventName] || !objEventMomory[qNodeUid][strEventName][strEventCategory])
						return;
					var fnCallback = objEventMomory[qNodeUid][strEventName][strEventCategory];
					window.addEventListener
					? node.removeEventListener(strEventName, fnCallback, true)
					: node.detachEvent(arrAutoBind[strEventName] ? 'on' + strEventName : strEventName, fnCallback);
					delete objEventMomory[qNodeUid][strEventName][strEventCategory];
				} else {
					// remove all event
					var 
					arrCallbacks = objEventMomory[qNodeUid][strEventName];
					
					if (!arrCallbacks)
						return;
					for (var strEventCategory2 in arrCallbacks) {
						var fnCallback = arrCallbacks[strEventCategory2];
						window.addEventListener
						? node.removeEventListener(strEventName, fnCallback, true)
						: node.detachEvent(arrAutoBind[strEventName] ? 'on' + strEventName : strEventName, fnCallback);
						delete objEventMomory[qNodeUid][strEventName][strEventCategory2];
					}
				}
			});
		});
		return that;
	});

	// triggers an event
	fn('trigger', function (strEvent) {
		var that = this;
		if (!prospectQueue.call(that,arguments,'trigger'))
			return that;
		var event = document.createEvent('HTMLEvents');
		event.initEvent(strEvent, true, false);
		iterate(that,function (k,node) {
			node.dispatchEvent(event);
		});
		return that;
	});
	
	// convert an object into a uri string ex: {k:"v"} to /k/v
	fn('serialize', function(delimiter1, delimiter2, boolEncode) {
		var arrOutout = [];
		if (!delimiter1)
			delimiter1 = "=";
		if (!delimiter2)
			delimiter2 = "&";
		if (this[0].tagName == 'FORM') {
			// grabbed from here: https://code.google.com/archive/p/form-serialize/
			// needs improvement
			var 
			form = this[0], 
			i=0, 
			j;
			for (;i < form.elements.length; i++) {
				if (form.elements[i].name === "") {
					continue;
				}
				switch (form.elements[i].nodeName) {
					case 'INPUT':
						switch (form.elements[i].type) {
							case 'text':
							case 'hidden':
							case 'password':
							case 'button':
							case 'reset':
								arrOutout.push(form.elements[i].name + delimiter1 + encodeURIComponent(form.elements[i].value));
								break;
							case 'checkbox':
							case 'radio':
								if (form.elements[i].checked) {
									arrOutout.push(form.elements[i].name + delimiter1 + encodeURIComponent(form.elements[i].value));
								}						
								break;
							case 'file':
								break;
						}
						break;			 
					case 'TEXTAREA':
						arrOutout.push(form.elements[i].name + delimiter1 + encodeURIComponent(form.elements[i].value));
						break;
					case 'SELECT':
						switch (form.elements[i].type) {
							case 'select-one':
								arrOutout.push(form.elements[i].name + delimiter1 + encodeURIComponent(form.elements[i].value));
								break;
							case 'select-multiple':
								for (j = form.elements[i].options.length - 1; j >= 0; j = j - 1) {
									if (form.elements[i].options[j].selected) {
										arrOutout.push(form.elements[i].name + delimiter1 + encodeURIComponent(form.elements[i].options[j].value));
									}
								}
								break;
						}
						break;
				}
			}
		} else {
			for(var p in this[0]) {
				if (this[0].hasOwnProperty(p)) {
					arrOutout.push((boolEncode ? encodeURIComponent(p) : p) + delimiter1 + (boolEncode ? encodeURIComponent(this[0][p]) : this[0][p]));
				}
			}
		}
		return arrOutout.join(delimiter2);
	});

	// replace a node with another node
	fn('replace', function (mixedReplacement) {
		if (typeof mixedReplacement == "string")
			mixedReplacement = q(mixedReplacement);
		var that = this,
		replacement = mixedReplacement.is_qchain ? mixedReplacement[0] : mixedReplacement;
		var parent = that.parent();
		if (!parent.length)
			return null;
		parent[0].replaceChild(replacement, that[0]);
		that[0] = replacement;
		that.length = 1;
		return that;
	});

	// append something to the selection
	fn('append', function (mixedVar, strAlternateMethod) {
		var that = this;
		if (!prospectQueue.call(that,arguments,'append'))
			return that;
		var 
		item = typeof mixedVar == 'string' ? (mixedVar[0] == "<" ? q(mixedVar) : [document.createTextNode(mixedVar)]) : mixedVar,
		strMethod = strAlternateMethod || "appendChild";
		iterate(that,function () {
			var node = this;
			iterate(item,function () {
				node[strMethod](this, node.firstChild);
			});
		});
		return that;
	});

	// Prepend something to the selection
	fn('prepend', function (mixedVar) {
		var that = this;
		if (!prospectQueue.call(that,arguments,'prepend'))
			return that;
		return that.append(mixedVar, "insertBefore",BYPASS_QUEUE);
	});

	// Append self to a node
	fn('prependTo', function (mixedVar) {
		var that = this;
		if (!prospectQueue.call(that,arguments,'prependTo'))
			return that;
		mixedVar = q(mixedVar);
		mixedVar.prepend(that,null,BYPASS_QUEUE);
		return that;
	});

	// Append self to a node
	fn('appendTo', function (mixedVar) {
		var that = this;
		if (!prospectQueue.call(that,arguments,'appendTo'))
			return that;
		mixedVar = q(mixedVar);
		mixedVar.append(that,null,BYPASS_QUEUE);
		return that;
	});

	// Append self after node
	fn('appendAfter', function (mixedVar, boolBefore) {
		var that = this;
		if (!prospectQueue.call(that,arguments,'appendAfter'))
			return that;
		var
		qNode = q(mixedVar),
		objNext = boolBefore ? qNode[0] : qNode.next()[0],
		qParent = qNode.parent();
		if (objNext) {
			qParent[0].insertBefore(that[0], objNext);
		} else {
			qParent[boolBefore ? 'prepend' : 'append'](that, null, BYPASS_QUEUE);
		}
		return that;
	});

	// Append self before a node
	fn('appendBefore', function (mixedVar) {
		return this.appendAfter(mixedVar, 1);
	});

	// Remove node
	fn('remove', function () {
		var that = this;
		if (!prospectQueue.call(that,arguments,'remove'))
			return that;
		iterate(that,function () {
			if (this.parentNode) // make sure its attached to something
				this.parentNode.removeChild(this);
		});
		return that;
	});
	// collect properties of an elements
	fn('prop', function (strType) {
		var qcopy = copy(fun),
		i=0;
		iterate(this,function () {
			if (this[strType])
				qcopy[i++] = this[strType];
		});
		qcopy.length = i;
		return qcopy;
	});
	// Next sibling node
	fn('next', function (selection) {
		var that = this;
		if (typeof selection !== 'undefined') {
			do {
				that = that.next();
			} while (that.length && !that.is(selection));
			return that;
		} else return that.prop("nextElementSibling");
	});

	// Previous sibling node
	fn('prev', function (selection) {
		var that = this;
		if (typeof selection !== 'undefined') {
			do {
				that = that.prev();
			} while (that.length && !that.is(selection));
			return that;
		} else return this.prop("previousElementSibling");
	});
	fn('searchUp', function (selection) {
		var that = this;
		do {
			var before = that;
			that = that.prev();
			var skipNextCheck = false;
			if (!that.length) {
				that = before.parent();
				if (!that[0] || that[0].tagName == 'body' && !that.is(selection))
					return copy(fun); // end reached
			} else if (that.is(selection)) {
				return that;
			} else {
				var found = that.find(selection);
				if (found.length)
					return found.become(-1);
			}
		} while (1);
		return that;
	});

	fn('searchDown', function (selection) {
		var that = this;
		var found = that.find(selection);
		if (found.length)
			return found.become(0);
		do {
			var before = that;
			that = that.next();
			var skipNextCheck = false;
			if (!that.length) {
				that = before.parent();
				if (!that[0] || that[0].tagName == 'body')
					return copy(fun); // end reached
			} else if (that.is(selection)) {
				return that;
			} else {
				var found = that.find(selection);
				if (found.length)
					return found.become(0);
			}
		} while (1);
		return that;
	});


	// Parent node
	fn('parent', function () {
		return this.prop("parentNode");
	});

	// Unix epoch in milliseconds
	q.mstime = function () {
		return (new Date()).getTime();
	};
	// Unix epoch in seconds
	q.time = function () {
		return Math.floor(q.mstime()/1000);
	};

	// Closest parent to the current selection
	fn('closest', function (strQuery) {
		var el = q(this[0]);
		if (el.is(strQuery))
			return el;
		if (el.is("body"))
			return q();
		var parent = el.parent();
		return parent.closest(strQuery);
	});
	
	// creates a unique id that can be used to save or reference to an object using a hash code
	// not to be confused with the setting the ID attribute on the DOM, this function is for internal indexing
	var 
	intUniqueIdIterator = 1,
	objUniqueIdLib = [];
	q.uniqueId = fun.uniqueId = function (strIdToLoad) {
		if (strIdToLoad == undefined) {
			// generate an new ID
			if (!this[0])
				return console.error('Error: The Q selection is empty when it was expected not to be.');
			var 
			node = this[0];
			if (node.__q_uid) {
				return node.__q_uid;
			} else {
				node.__q_uid = intUniqueIdIterator++;
			}
			objUniqueIdLib.push(node);
			return node.__q_uid;
		} else {
			return objUniqueIdLib[strIdToLoad] || undefined;
		}
	};
	
	q.rand = function (min,max) {
		if (typeof max == 'undefined') {
			max=min;
			min=0;
		}
		if (min > max) {
			var mintemp = min;
			min = max;
			max = mintemp;
		}
		var divider = 1;
		while (
			min > 0 && min < 1
		) {
			min*=10;
			max*=10;
			divider*=10;
		}
		var dif = min;
		min = 0;
		max -= dif-1;
		return ((Math.floor(Math.random()*max)+dif)/divider);
	};
	fn('request', function (arrParams) {
		var that = this;
		if (!prospectQueue.call(that,arguments,'request'))
			return that;
		q.request.call(that,arrParams)
		return that;
	});
	// Ajax reqiest
	var arrSyncRequestQueue = {};
	q.request = function (arrParams, boolBypassQueueInjection) {
		function requestProcessingComplete(res, objParams, status) {
			if (objParams.sync) {
				arrSyncRequestQueue[objParams.sync].shift(); // removes itself to continue on
				if (arrSyncRequestQueue[objParams.sync].length) // check if theres more in the queue
					q.request(arrSyncRequestQueue[objParams.sync][0], true); // start the next request while bypassing queue injection
			}
			if (typeof objParams.response == "function")
				objParams.response.call(that, res, objParams, status);
		}
		// queue is a string that can be provided which will serve as the key for a synchronized request queue
		if (arrParams.sync && !boolBypassQueueInjection) {
			if (!arrSyncRequestQueue[arrParams.sync])
				arrSyncRequestQueue[arrParams.sync] = [];
			arrSyncRequestQueue[arrParams.sync].push(arrParams);
			if (arrSyncRequestQueue[arrParams.sync].length > 1) {
				// something already queued wait for it to finish
				return;
			}
		}
		// process post params
		if (arrParams.post) {
			for (var key in arrParams.post) {
				var val = arrParams.post[key];
				if (typeof val == 'function') {
					arrParams.post[key] = val(); 
				}
			}
		}
		var that = this;
		if (typeof XMLHttpRequest === "undefined") {
		  XMLHttpRequest = function () {
		    try { return new ActiveXObject("Msxml2.XMLHTTP.6.0"); }
		    catch (e) {}
		    try { return new ActiveXObject("Msxml2.XMLHTTP.3.0"); }
		    catch (e) {}
		    try { return new ActiveXObject("Microsoft.XMLHTTP"); }
		    catch (e) {}
		    throw new Error("This browser does not support XMLHttpRequest.");
		  };
		}
		var r = new XMLHttpRequest();
		r.open((arrParams.formData || arrParams.post) ? "POST" : "GET", arrParams.url || "");
		if (arrParams.cross)
			r.withCredentials = true;
		if (arrParams.encoding !== false)
			r.setRequestHeader("Content-type", arrParams.encoding ? arrParams.encoding : "application/x-www-form-urlencoded; charset=" + (arrParams.charset || 'UTF-8'));
		r.setRequestHeader("Accept", arrParams.accept || "text/html");
		r.onreadystatechange = function () {
			if (r.readyState == 4 ) {
				if (r.status == 200) {
					var res = r.responseText;
					if (arrParams.json)
						res = JSON.parse(res);
					if (arrParams.success)
						arrParams.success.call(that,res);
					requestProcessingComplete(res, arrParams, r.status);
				} else if (!arrParams.failure) {
					// no failure handle; do nothing
					requestProcessingComplete(null, arrParams, r.status);
				} else {
					if (arrParams.failure)
						arrParams.failure.call(that,r.responseText, r.status);
					requestProcessingComplete(null, arrParams, r.status);
				}
			}
		};
		if (arrParams.preRequest) 
			arrParams.preRequest.call(that, arrParams);
		if (arrParams.formData)
			r.send(arrParams.formData);
		else
			r.send(arrParams.post ? q(arrParams.post).serialize('=', '&', true).replace(/%20/g, '+') : null);
		return r;
	};
	q.dataURLToBlob = function(dataURL) {
	    var BASE64_MARKER = ';base64,';
	    if (dataURL.indexOf(BASE64_MARKER) == -1) {
	        var parts = dataURL.split(',');
	        var contentType = parts[0].split(':')[1];
	        var raw = parts[1];
	
	        return new Blob([raw], {type: contentType});
	    }
	    var parts = dataURL.split(BASE64_MARKER);
	    var contentType = parts[0].split(':')[1];
	    var raw = window.atob(parts[1]);
	    var rawLength = raw.length;
	
	    var uInt8Array = new Uint8Array(rawLength);
	
	    for (var i = 0; i < rawLength; ++i) {
	        uInt8Array[i] = raw.charCodeAt(i);
	    }
	
	    return new Blob([uInt8Array], {type: contentType});
	}
	q.fileUpload = function (arrParams, sourceEvent) {
		var that = this;
		$('._q-file-upload-input').remove();
		var input = q("<input type='file' name='file' class='_q-file-upload-input'>")
		.css({
			display : 'none'
		})
		.change(function (e) {
			var file = e.target.files[0];
			var reader = new FileReader();
			reader.onload = function (readerEvent) {
				if (
					file.type.match(/image.*/)
					&& arrParams.minMaxSize
				) {
					var image = new Image();
					image.onload = function (imageEvent) {
						// Resize the image
						var canvas = document.createElement('canvas'),
						max_size = arrParams.minMaxSize,
						width = image.width,
						height = image.height;
						if (width > height) {
							if (width > max_size) {
								height *= max_size / width;
								width = max_size;
							}
						} else {
							if (height > max_size) {
								width *= max_size / height;
								height = max_size;
							}
						}
						canvas.width = width;
						canvas.height = height;
						canvas.getContext('2d').drawImage(image, 0, 0, width, height);
						var dataUrl = canvas.toDataURL();
						var resizedImage = q.dataURLToBlob(dataUrl);
						do_request(file, resizedImage);
					};
					image.src = readerEvent.target.result;
				} else {
					do_request(file);
				}
			};
			reader.readAsDataURL(file);
		
			function do_request(fileInput, alternateData) {
				var formData = new FormData();
				formData.append("file", alternateData || fileInput);
				if (arrParams.selected)
					arrParams.selected.call(q(sourceEvent.target),fileInput,e);
				if (arrParams.post) {
					for (var strKey in arrParams.post) {
						formData.append(strKey, arrParams.post[strKey]);
					}
				}
				delete arrParams.post;
				var request = {
					url : arrParams.url || "",
					formData : formData,
					encoding : false
				};
				extend(request, arrParams);
				//that && that.request ? that.request(request) : q.request(request); // removed because something is interfearing with it and until thats understood it has been taken out
				q.request.call(that, request);
				input.remove();
			}
		})
		.appendTo('body');
		if (arrParams.accept)
			input.attr('accept', arrParams.accept);
		input[0].click();
	};
	// no compression
	q.fileUpload2 = function (arrParams) {
		var that = this;
		$('._q-file-upload-form').remove();
		var form = q('<form class="_q-file-upload-form">')
		.css({
			display : 'none'
		}).appendTo('body');
		var input = q("<input type='file' name='file'>").appendTo(form);
		var submit = q("<input type='submit'>").appendTo(form);
		if (arrParams.accept)
			input.attr('accept', arrParams.accept);
		form.bind('submit', function (e) {
			e.preventDefault();
			var formData = new FormData(form[0]);
			if (arrParams.selected)
				arrParams.selected.call(that,formData.get('file'),e);
			if (arrParams.post)
				for (var strKey in arrParams.post) {
					formData.append(strKey, arrParams.post[strKey]);
				}
			delete arrParams.post;
			var request = {
				url : arrParams.url || "",
				formData : formData,
				encoding : false
			};
			extend(request, arrParams);
			that && that.request ? that.request(request) : q.request(request);
			form.remove();
		});
		input.change(function (e) {
			submit[0].click();
		});
		input[0].click();
	};
	fn('fileUpload', function (arrParams) {
		var that = this;
		that.click((function (arrParams) {
			return function (e) {
				e.preventDefault();
				q.fileUpload.call(that,copy(arrParams),e);
			};
		})(arrParams));
		return that;
	});
	
	fn('fixedParent', function () {
		var node = this.parent();
		while (node.length) {
			var strPos = node.css("position");
			if (strPos == "fixed")
				return node;
			node = node.parent();
			if (!node.length)
				return copy(fun);
			if (node[0].tagName == "BODY")
				return copy(fun);
		}
		return copy(fun); // empty
	});

	fn('src', function (strUrl) {
		var that = this;
		iterate(that, function (k,el) {
			if (!el) return;
			if (el.tagName.toLowerCase() === 'img')
				q(el).attr('src', strUrl);
			else
				q(el).css({
					'background-image': 'url("' + strUrl + '")'
				});
		});
		return that;
	});
	fn('background', function (strUrl) {
		var that = this;
		that.css({
			'background-image': 'url("' + strUrl + '")'
		});
		return that;
	});

	fn('offsetParent', function () {
		var node = this.parent();
		while (node.length) {
			var strPos = node.css("position");
			if (strPos == "relative" || strPos == "absolute" || strPos == "fixed")
				return node;
			node = node.parent();
			if (!node.length)
				return copy(fun);
			if (node[0].tagName == "BODY")
				return node;
		}
		return copy(fun); // empty
	});

	fn('withoutQueue', function () {
		var that = this;
		that.withoutQueueOn = true;
		return that;
	});
	fn('withQueue', function () {
		var that = this;
		that.withoutQueueOn = false;
		return that;
	});
    
	// turns on or off asynchronous animations and pauses
	fn('queue', function (boolOff) {
		var that = this;
		if (boolOff)
			iterate(that, function (k,el) {
				if (!el) return;
				var intElUid = q(el).uniqueId();
				delete objQueueChain[intElUid];
			});
		else
			iterate(that, function (k,el) {
				if (!el) return;
				var intElUid = q(el).uniqueId();
				if (!objQueueChain[intElUid])
					objQueueChain[intElUid] = {
						on : true,
						sequence : []
					};
			});
		return that;
	});

	// jump to the next item in the queue
	q.queueNext = function (el,boolApplyByPass) {
		var that = this;
		if (that.is_qchain && that.withoutQueueOn)
			return that;
		if (el)
			runNext(el);
		else if (that.length) {
			iterate(that, function (k,el) {
				runNext(el);
			});
		}
		function runNext(el) {
			if (!el) return;
			var intElUid = q(el).uniqueId();
			if (objQueueChain[intElUid]) {
				var objLink = objQueueChain[intElUid];
				if (objLink.sequence.length) {
					var arrParams = objLink.sequence.shift();
					arrParams = Object.values(copy(arrParams));
					var strFnName = arrParams.shift();
					if (boolApplyByPass)
						arrParams.push(undefined,undefined,undefined,undefined,undefined,BYPASS_QUEUE);
					that[strFnName].apply(that, arrParams);
					if (["animate","delay"].indexOf(strFnName)<0) {
						q.queueNext.call(that,el,true);
					}
				} else if (that.loopOn) {
					if (
						Object.keys(that.loopBuffer).length
						&& that.loopOn > that.loopCount+1
					) {
						that.loopCount++;
						objLink.sequence = Object.values(that.loopBuffer);
						q.queueNext.call(that,el,true);
					} else {
						that.loopOn = that.loopCount = 0;
						that.loopBuffer = {};
					}
				}
			}
		}
		return that;
	};
	fn('loop', function () {
		this.queue();
		return q.loop.apply(this,arguments);
	});
	q.loop = function (intAmount) {
		var that = this.is_qchain ? this : q("<div>"); // give the q something if there's nothing 
		that.queue();
		that.loopOn = typeof intAmount == "undefined" ? Infinity : intAmount;
		return that;
	};
	fn(['queueNext','endLoop'], function () {
		return q.queueNext(this, arguments);
	});

	// turn of the animation queue
	fn('dequeue', function () {
		var that = this;
		iterate(that, function (k,el) {
			if (!el) return;
			var intElUid = q(el).uniqueId();
			if (objQueueChain[intElUid])
				objQueueChain[intElUid].sequence = [];
		});
		return that;
	});

	q.clear = function (ref) {
		window.clearTimeout(ref);
	};
	q.delay = function (intMS, fnCallback) {
		var that = this;
		if (!that.is_qchain)
			return window.setTimeout(function () {
				fnCallback();
			},intMS);
		else if (!that.length)
			 q.delay(intMS, function () {
			 	if (fnCallback)
			 		fnCallback();
			 	that.queueNext();
			 });
		else {
			var 
			arrArgs = Array.prototype.slice.call(arguments),
			arrArgsSequence = arrArgs.slice(0),
			boolByPassQueue = arrArgs.includes(BYPASS_QUEUE),
			boolLoopAdded = !that.loopOn;
			arrArgsSequence.unshift("delay");
			iterate(this,function (intItem, el) {
				if (!el) return;
				var 
				intElUid = q(el).uniqueId(),
				objQueueItem = objQueueChain[intElUid];
				if (objQueueItem && !that.withoutQueueOn) {
					if (!boolByPassQueue) {
						if (!boolLoopAdded) {
							addLoopParam.call(that,arrArgsSequence);
							boolLoopAdded = true;
						}
						if (objQueueItem.active) {
							// Add next animation to chain
							objQueueItem.sequence.push(["delay", intMS, fnCallback]);
							return false;
						}
					}
					objQueueItem.active = true;
				}
				q.delay(intMS, function () {
				 	if (fnCallback)
				 		fnCallback.call(that);
				 	if (objQueueItem && !that.withoutQueueOn) {
					 	objQueueItem.active = false;
					 	q.queueNext.call(that,el,true);
					 }
				});
			});
		}
		return this;
	};

	fn('delay', function () {
		this.queue();
		return q.delay.apply(this,arguments);
	});

	// Synchronous run an anonymous callback function
	fn('sync', function () {
		var that = this;
		if (!prospectQueue.call(that,arguments,'sync'))
			return that;
		var arrArgs = Array.prototype.slice.call(arguments),
		fnCallback = arrArgs.shift(),
		mixedResult = fnCallback.apply(that,arrArgs);
		if (mixedResult == false) {
			return copy(fun);
		}
		return that;
	});
	fn('async', function (fnCallback) {
		var that = this;
		if (!prospectQueue.call(that,arguments,'sync'))
			return that;
		return that.delay(0, fnCallback);
	});
	
	q(document).ready(function () {
		checkRoute();
	});

	q.id = q.rand(0,99999999);
})(typeof JAVASCRIPT_Q_HANDLE == "undefined" ? "$" : JAVASCRIPT_Q_HANDLE);
