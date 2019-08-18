/**
 * Javascript Q
 * GitHub: https://github.com/AugmentLogic/Javascript-Q
 * CDN: https://cdn.jsdelivr.net/gh/AugmentLogic/Javascript-Q@latest/q.js
 */

(function(JavascriptQ) {
	var 
	version = 2.305,

	// Initialize Q
	q = window[JavascriptQ] = function (mixedQuery) {
		var that = copy(fun);
		return that.put(mixedQuery);
	},
	
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
	// Animation easings
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
		if (queryType == 'undefined') {
			return that;
		} else if (queryType == 'function') {
			return that.ready(mixedQuery); // DOM ready
		} else if (queryType == 'object') {
			var i=0;
			if (isNode(mixedQuery)) {
				that[i++] = mixedQuery;
			} else if (mixedQuery.is_q) {
				return mixedQuery;
			} else if (Array.isArray(mixedQuery)) {
				iterate(mixedQuery,function () {
					that[i++] = this;
				});
			} else {
				that[i++] = mixedQuery;
			}
			fnTrimQueue.call(that,i);
		} else if (queryType == 'string' && mixedQuery.charAt(0) === "<" && mixedQuery.charAt( mixedQuery.length - 1 ) === ">" && mixedQuery.length >= 3) {
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
	
	// Find out if something has scrolled into the visible range of the screen
	fn('inViewY', function () {
		var 
		intTop = this.scrollTop(),
		intHeight = this.height(),
		intAmount = Math.max(0, Math.min(intHeight, intTop + intHeight));
		intAmount -= Math.max(0, Math.min(intHeight, intTop - q.height() + intHeight));
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
			return window.pageYOffset || document.documentElement.scrollTop;
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
					left: destinationOffset
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
			return window.pageYOffset || document.documentElement.scrollLeft;
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

	// DOM width
	fn('width', function (mixedValue) {
		if (typeof mixedValue != 'undefined')
			return this.css('width',mixedValue);
		else
			return getWidthHeight.call(this,"Width");
	});
	q.width = function () {
		return q(window).width();
	};
	
	// DOM height
	fn('height', function (mixedValue) {
		if (typeof mixedValue != 'undefined')
			return this.css('height',mixedValue);
		else
			return getWidthHeight.call(this,"Height");
	});
	q.height = function () {
		return q(window).height();
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
			var method = function (e) {
				e = e || window.event;
				e.target = e.target || e.srcElement;
				// defeat Safari bug
				if (e.target.nodeType == 3)
					e.target = e.target.parentNode;
				fnCallback.call(node, e);
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
			var qNodeUid = q(node).uniqueId();
			iterate(arrEvents, function () {
				var 
				arrEventNames = this.split(/\./),
				strEventName = arrEventNames[0],
				strEventCategory = arrEventNames[1];
				if (!objEventMomory[qNodeUid])
					return;
				if (strEventCategory) {
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
							case 'submit':
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
					case 'BUTTON':
						switch (form.elements[i].type) {
							case 'reset':
							case 'submit':
							case 'button':
								arrOutout.push(form.elements[i].name + delimiter1 + encodeURIComponent(form.elements[i].value));
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
		replacement = mixedReplacement.is_q ? mixedReplacement[0] : mixedReplacement;
		that.parent()[0].replaceChild(replacement, that[0]);
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

	// Unix epoch in MS
	q.mstime = function () {
		return (new Date()).getTime();
	};
	q.time = function () {
		return Math.floor(q.mstime()/1000);
	};

	// Closest parent to the current selection
	fn('closest', function (strQuery) {
		var el = q(this[0]);
		if (el.is(strQuery))
			return el;
		if (el.is("body"))
			return {};
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

	// Ajax reqiest
	q.request = function (arrParams) {
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
		r.open(arrParams.post ? "POST" : "GET", arrParams.url);
		if (arrParams.cross)
			r.withCredentials = true;
		r.setRequestHeader("Content-type", "application/x-www-form-urlencoded; charset=" + (arrParams.charset || 'UTF-8'));
		r.setRequestHeader("Accept", arrParams.accept || "text/html");
		r.onreadystatechange = function () {
			if (r.readyState == 4 ) {
				if (r.status == 200) {
					if (arrParams.success) {
						var res = r.responseText;
						if (arrParams.response == "JSON")
							res = JSON.parse(res);
						arrParams.success(res);
					}
				} else if (!arrParams.failure) {
					// no failure handle; do nothing
				} else {
					arrParams.failure(r.responseText);
				}
			}
		};
		r.send(arrParams.post ? q(arrParams.post).serialize('=', '&', true).replace(/%20/g, '+') : null);
		return r;
	};

	fn('offsetParent', function () {
		var node = this.parent();
		while (node.length) {
			var strPos = node.css("position");
			if (strPos == "relative" || strPos == "absolute" || strPos == "fixed")
				return node;
			node = node.parent();
			if (!node.length)
				return;
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
				var intElUid = q(el).uniqueId();
				delete objQueueChain[intElUid];
			});
		else
			iterate(that, function (k,el) {
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
		if (that.is_q && that.withoutQueueOn)
			return that;
		if (el)
			runNext(el);
		else if (that.length) {
			iterate(that, function (k,el) {
				runNext(el);
			});
		}
		function runNext(el) {
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
		var that = this.is_q ? this : q("<div>"); // give the q something if there's nothing 
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
			var intElUid = q(el).uniqueId();
			if (objQueueChain[intElUid])
				objQueueChain[intElUid].sequence = [];
		});
		return that;
	});

	fn('pause', function () {
		var that = this;
		if (!prospectQueue.call(that,arguments,'pause'))
			return that;
		return that.css({
			"animation-play-state" : "paused"
		},undefined,undefined,undefined,BYPASS_QUEUE);
	});

	fn('play', function () {
		var that = this;
		if (!prospectQueue.call(that,arguments,'play'))
			return that;
		return that.css({
			"animation-play-state" : "running"
		},undefined,undefined,undefined,BYPASS_QUEUE);
	});

	// stop all animation sequences for the selected object
	fn('stop', function () {
		var that = this;
		if (!prospectQueue.call(that,arguments,'stop'))
			return that;
		iterate(this, function (k,el) {
			var 
			objAI = objAnimationInstances,
			intElUid = q(el).uniqueId();
			if (objAI[intElUid]) {
				objAI[intElUid].stop();
			}
		});
		return this.css({
			"animation-play-state" : "paused"
		},undefined,undefined,undefined,BYPASS_QUEUE).dequeue();
	});

	q.delay = function (intMS, fnCallback) {
		var that = this;
		if (!that.is_q)
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
	// GPU Optimized Animations Started: Apr 13, 2018
	var addAnimationInstances = function (intElUid, strKeyFrameName, objCssTo) {
		var arrInstanceNameList = [];
		if (!objAnimationInstances[intElUid])
			objAnimationInstances[intElUid] = {
				animationAttributes : {},
				arrInstanceNameList : arrInstanceNameList,
				getAnimationAttributes : function () {
					var arrAnimationAttributes = [];
					for (var intINL in arrInstanceNameList) {
						var strName = arrInstanceNameList[intINL],
						objAI = objAnimationInstances[intElUid][strName];
						if (objAI.strAnimationAtrribute)
							arrAnimationAttributes.push(objAI.strAnimationAtrribute);
					}
					return arrAnimationAttributes;
				},
				stop : function (optionalStrKeyFrameName) {
					if (optionalStrKeyFrameName) {
						arrInstanceNameList.splice(arrInstanceNameList.indexOf(optionalStrKeyFrameName),1);
						objAnimationInstances[intElUid][optionalStrKeyFrameName].stop();
						delete objAnimationInstances[intElUid][optionalStrKeyFrameName];
						if (!arrInstanceNameList.length && objAnimationInstances[intElUid])
							delete objAnimationInstances[intElUid];
					} else {
						for (var intINL in arrInstanceNameList) {
							var strName = arrInstanceNameList[intINL];
							objAnimationInstances[intElUid].stop(strName);
						}
						delete objAnimationInstances[intElUid];
					}
				}
			};
		arrInstanceNameList = objAnimationInstances[intElUid].arrInstanceNameList;
		arrInstanceNameList.push(strKeyFrameName);
		var objResult = {
			objCssTo : objCssTo,
			strKeyFrameName : strKeyFrameName
		};
		objAnimationInstances[intElUid][strKeyFrameName] = objResult;
		return objResult;
	};
	fn('animate', function (mixedCssTo) {
		var that = this,
		intArgs = arguments.length,
		intDuration = 750,
		fnEasing = easings.linear,
		strEasing = "linear",
		boolLoopAdded = !that.loopOn,
		objCallbacks = {
			stopped : function () {}, // the animation was stopped without finishing
			finished : function () {}, // redundant function works just like 
			ended : function () {} // called when an animation is stopped or finishes on its own
		},
		fnCallback = function () {},
		arrArgs = Array.prototype.slice.call(arguments),
		boolBypassQueue = arrArgs.includes(BYPASS_QUEUE);
		if (boolBypassQueue)
			delete arrArgs[arrArgs.indexOf(BYPASS_QUEUE)];
		if (that.loopOn === 0)
			return that;
		for (var intArg=1;intArg<intArgs;intArg++) {
			var 
			mixedValue = arrArgs[intArg],
			strType = typeof mixedValue;
			if (strType == "number" || strType == "float") {
				intDuration = mixedValue;
			} else if (strType == "string") {
				strEasing = mixedValue;
				fnEasing = easings[mixedValue] || easings.linear;
			} else if (strType == "function") {
				fnCallback = mixedValue;
			} else if (strType == "object") {
				extend(objCallbacks, mixedValue);
			}
		}
		mixedCssTo = fnResolve.call(that, mixedCssTo);
		var arrArgsSequence = arrArgs.slice(0),
		intIterations = Math.ceil(intDuration/10),
		regMatchNumbers = /(\-?[0-9]+(?:\.[0-9]+)?(?:[a-z]{2}?|%)?)/gi,
		regSplitNumbers = /\-?[0-9]+(?:\.[0-9]+)?(?:[a-z]{2}?|%)?/gi;
		arrArgsSequence.unshift("animate")
		iterate(that,function (intItem, el) {
			var intElUid = q(el).uniqueId();
			if (objQueueChain[intElUid] && !that.withoutQueueOn) {
				if (!boolBypassQueue) {
					if (!boolLoopAdded) {
						addLoopParam.call(that,arrArgsSequence);
						boolLoopAdded = true;
					}
					if (objQueueChain[intElUid].active) {
						objQueueChain[intElUid].sequence.push(arrArgsSequence);
						return;
					}
				}
				objQueueChain[intElUid].active = true;
			}
			var 
			strKeyFrameName = "qStepAnim" + q.id + 'n' + (animations++), // generate an ID
			objHistory = objTransformHistory[intElUid],
			arrOutput = [],
			strCurrentKey,
			objStartStyles = getComputedStyle(el),
			boolTransformsUsed = false;
			if (!objHistory) {
				objTransformHistory[intElUid] = {};
				objHistory = objTransformHistory[intElUid];
			}
			// loop through parameter
			// extend transform history to applicable params,
			// process and store instructions in arrOutput
			for (var strCssToKey in mixedCssTo) {
				var 
				to = mixedCssTo[strCssToKey],
				toRC = camelToDash(strCssToKey);
				// iterate the tranform in a slightly different way
				if (toRC == "transform") {
					if (objHistory)
						mixedCssTo[strCssToKey] = to = q.extend(copy(objHistory),to);
					boolTransformsUsed = true;
					for (var strTransform in to) {
						var 
						strTransformTo = to[strTransform],
						strTransformFrom = objHistory && typeof objHistory[strTransform] != "undefined" ? objHistory[strTransform] : (objTransformDefaults[strTransform] || 0);
						tweenString(toRC+"-"+strTransform, toRC+"-"+strTransform, parseFloat(strTransformFrom), parseFloat(strTransformTo));
					}
				} else {
					var from = objStartStyles[camelToDash(strCssToKey)] || 0;
					tweenString(strCssToKey, toRC, from, to);
				}
			}
			function tweenString(strCssToKey, toRC,from,to) {
				var 
				intToValues = 1,
				intDefaultFrom = toRC == "rgba" || toRC == "opacity" || toRC == "background-color" ? 1 : 0,
				arrToValues = [to],
				arrFromValues = [from],
				arrToWrappers = [],
				arrFromWrappers = [];
				if (typeof from == "string") {
					arrFromWrappers = from.split(regMatchNumbers);
					arrFromValues = from.match(regMatchNumbers);
				}
				if (!arrFromValues) {
					arrFromValues = [intDefaultFrom];
				}
				// Convert hax to rgb
				if (to[0] == "#") {
					to = hexToRgb(to);
				} else if (typeof to == "string") {
					arrToWrappers = to.split(regSplitNumbers);
					arrToValues = to.match(regMatchNumbers);
					intToValues = arrToValues.length;
				}
				// convert rgb to rbba for simplicity
				if (intToValues == 3 && toRC == "background-color") {
					intToValues++;
					arrToValues[3] = 1;
					arrToWrappers[3] = ", ";
					arrToWrappers[4] = ")";
					arrToWrappers[0] = "rgba(";
				}
				if (toRC == "box-shadow") {
					// from: 0 0 10px 0 rgba(222,33,24,0.5)
					// to: rgba(2, 3, 4, 1) 0px 0px 40px 0px
					var newCss = 
					arrFromWrappers[4].replace(/^ /, '')
					+ arrFromValues[4] // red
					+ arrFromWrappers[5]
					+ arrFromValues[5] // green
					+ arrFromWrappers[6]
					+ arrFromValues[6] // blue
					+ arrFromWrappers[7]
					+ arrFromValues[7] // alpha
					+ arrFromWrappers[8]
					+ " "
					+ arrFromValues[0] // left
					+ arrFromWrappers[1]
					+ arrFromValues[1] // right
					+ arrFromWrappers[2]
					+ arrFromValues[1] // blur
					+ arrFromWrappers[2]
					+ arrFromValues[2] // spread
					+ arrFromWrappers[3].replace(/ $/, '');
					arrFromWrappers = newCss.split(regSplitNumbers);
					arrFromValues = newCss.match(regMatchNumbers);
				}
				// itarete to values
				for (var intItem=0;intItem!=intToValues;intItem++) {
					var
					// unit conversions will not be handled yet
					mixedFromValue = ((arrFromValues[intItem] || intDefaultFrom)+'').replace(/[a-z%]+/, ''),
					mixedToValue = arrToValues[intItem],
					matchToSuffix = typeof mixedToValue == 'string' ? mixedToValue.match(/([a-z%]+)/) : "",
					strToSuffix = matchToSuffix ? matchToSuffix[1] : (typeof mixedToValue == 'string' || arrExcludePx[toRC] ? '' : 'px');
					var mixedChange=0;
					if (mixedFromValue*1==mixedFromValue) {
						mixedFromValue*=1;
						if (typeof mixedToValue == 'string')
							mixedToValue = mixedToValue.replace(/[a-z%]+/, '')*1;
						mixedChange = mixedToValue - mixedFromValue;
					}
					// loop through time
					for (var intItr=0;intItr!=intIterations;intItr++) {
						if (intItem == 0) {
							if (!arrOutput[intItr])
								arrOutput[intItr] = Math.round(((intItr+1) / intIterations)*10000)/100 + "% {" + toRC + ":";
							else if (strCurrentKey != toRC) {
								arrOutput[intItr] += ";" + toRC + ":";
							}
						}
						var pos = !mixedChange ? mixedFromValue : Math.floor(fnEasing(intItr+1, mixedFromValue, mixedChange, intIterations)*10000)/10000;
						if (arrToWrappers[intItem])
							arrOutput[intItr] += arrToWrappers[intItem];
						arrOutput[intItr] += pos + strToSuffix;
						if (intItem==intToValues-1 && arrToWrappers[intItem+1]) 
							arrOutput[intItr] += arrToWrappers[intItem+1];
					}
				}
			}
			// reprocess transform params into a keyframe animation
			if (boolTransformsUsed) {
				var regTransform = /transform\-([a-z]+):([^;]+)(;?)/i;
				for (var intOutput in arrOutput) {
					var 
					strLine = arrOutput[intOutput],
					boolChange = false,
					arrMatched;
					while ((arrMatched = strLine.match(regTransform))) {
						strLine = strLine.replace(regTransform, (!boolChange ? "transform:" : "") + arrMatched[1]+"(" + arrMatched[2] + ")" + (arrMatched[3] == ";" ? " " : ""));
						boolChange = true;
					}
					if (boolChange) {
						strLine = strLine.replace(/(transform:.+?) ([a-z]+:)/i, '$1;$2');
						arrOutput[intOutput] = strLine;
					}
				}
			}
			var 
			strAnimation = "@keyframes " + strKeyFrameName + " {" + arrOutput.join("}\n") + "}",
			style = document.createElement('style');
			style.type = 'text/css';
			style.innerHTML = strAnimation;
			document.getElementsByTagName('body')[0].appendChild(style);
			var 
			objAI = addAnimationInstances(intElUid, strKeyFrameName, mixedCssTo),
			objAIParent = objAnimationInstances[intElUid],
			// finalize an animation once its complete
			fnDone = objAI.done = function () {
				return (function (strKeyFrameName, mixedCssTo, el, toRC, fnDone, objAI, style, intElUid, objCallbacks) {
					return (function () {
						// reprocess transforms into proper CSS
						if (mixedCssTo.transform) {
							objTransformHistory[intElUid] = mixedCssTo.transform;
							mixedCssTo.transform = stringifyTransformData(mixedCssTo.transform);
						}
						q(el).css(mixedCssTo, undefined,undefined,undefined, BYPASS_QUEUE);
						cleanUp(el,fnDone,style,intElUid,strKeyFrameName);// remove the animation css
						fnCallback();
						strCurrentKey = toRC;
						q.queueNext.call(that,el,true);
						objCallbacks.ended();
						objCallbacks.finished();
					})();
				})(strKeyFrameName, mixedCssTo, el, toRC, fnDone, objAI, style, intElUid, objCallbacks);
			};
			// stop an animation before complete
			objAI.stop = function () {
				return (function (that, objAI, intDuration, arrOutput, fnDone, el, style, intElUid, objCallbacks, strKeyFrameName) {
					return (function () {
						window.clearTimeout(objAI.timeout);
						var 
						intElapsed = q.mstime() - objAI.startTime,
						intPercentage = 0,
						intElapsedPercentage = (intElapsed / intDuration) * 100,
						strMatched = "";
						// fetch the position out of the raw output data
						for (var intOutput in arrOutput) {
							var 
							strOutput = arrOutput[intOutput],
							arrMatchedPecenteage = strOutput.match(/^([0-9\.]+)/);
							intPercentage = arrMatchedPecenteage[1];
							if (intPercentage > intElapsedPercentage) {
								strMatched = strOutput.replace(/^[^\{]+\{/, '');
								break;
							}
						}
						var arrUnits = strMatched.split(/;/);
						for (var intUnit in arrUnits) {
							var 
							arrKeyVal = arrUnits[intUnit].split(/:/),
							strKey = arrKeyVal[0],
							strValue = arrKeyVal[1];
							if (strKey == "transform") {
								objTransformHistory[intElUid] = parseTransformData(strValue);
							}
							el.style.setProperty(strKey, strValue);
						}
						cleanUp(el,fnDone,style, intElUid,strKeyFrameName,1);
						objCallbacks.ended();
						objCallbacks.stopped();
					})();
				})(that, objAI, intDuration, arrOutput, fnDone, el, style, intElUid, objCallbacks, strKeyFrameName);
			};
			function cleanUp(el,fnDone,style, intElUid,strKeyFrameName,boolStopping) {
				if (objQueueChain[intElUid])
					objQueueChain[intElUid].active = false;
				if (!boolStopping)
					objAnimationInstances[intElUid].stop(strKeyFrameName);
				el.style.setProperty("animation", objAnimationInstances[intElUid] ? objAnimationInstances[intElUid].getAnimationAttributes().join(",") : 'none');
				q(style).remove(BYPASS_QUEUE);
				style = undefined;
			}
			objAI.startTime = q.mstime();
			var strPrefix = objAIParent.getAnimationAttributes().join(",");
			strPrefix = strPrefix.length ? strPrefix + "," : "";
			var strAnimationAtrribute = strKeyFrameName + " " + intDuration + "ms forwards linear";
			objAI.strAnimationAtrribute = strAnimationAtrribute;
			el.style.setProperty("animation", strPrefix + strAnimationAtrribute);
			q(el).play(BYPASS_QUEUE); // make sure its unpaused
			objAI.timeout = q.delay(intDuration, fnDone);
		});

		return this;
	});
	q.id = q.rand(0,99999999);
})(typeof JAVASCRIPT_Q_HANDLE == "undefined" ? "$" : JAVASCRIPT_Q_HANDLE);
