/**
 * q.js v2.0
 * Javascript Q
 * @author exitget.com
 * Copyright (c) exitget.com
 */

(function() {
	var 

	// Initialize Q
	q = window.$ = function (mixedQuery) {
		var that = copy(fun);
		return that.put(mixedQuery);
	},

	// Duplicates an object
	copy = q.copy = function (obj) {
		return extend({}, obj);
		/*
		//if (null == obj || "object" != typeof obj) return obj;
		var copy = obj.constructor();
		for (var attr in obj) {
			if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
		}
		return copy;
		*/
	},
	
	extend = q.extend = function (obj1, obj2) {
		var keys = Object.keys(obj2);
	    for (var i = 0; i < keys.length; i += 1) {
	      var val = obj2[keys[i]];
	      obj1[keys[i]] = ['object', 'array'].indexOf(typeof val) != -1 ? extend(obj1[keys[i]] || {}, val) : val;
	    }
	    return obj1;
	},

	iterate = function (that, fnCallback) {
		var 
		i=0,
		l;
		if (isNode(that)) {
			l=1;
			if (fnCallback.call(that, i++, that) === false)
				return;
		} else {
			l=that.length;
			while (i<l) {
				if (fnCallback.call(that[i], i, that[i++]) === false)
					return;
			}
		}
		return !!l;
	},

	reverseCamel = function (strInput) {
		return strInput
			.replace(/([a-z])([A-Z])/g, '$1-$2')
			.toLowerCase();
	},

	// Handle DOM ready
	boolReadyEventsOn = false,
	arrReadyPromises = [],
	ready = function () {
		for (var intItr in arrReadyPromises) {
			arrReadyPromises[intItr]();
		}
	},
	completed = function( event ) {
		// readyState === "complete" is good enough for us to call the dom ready in oldIE
		if ( document.addEventListener || event.type === "load" || document.readyState === "complete" ) {
			detach();
			ready();
		}
	},
	detach = function() {
		if ( document.addEventListener ) {
			document.removeEventListener( "DOMContentLoaded", completed, false );
			window.removeEventListener( "load", completed, false );

		} else {
			document.detachEvent( "onreadystatechange", completed );
			window.detachEvent( "onload", completed );
		}
	},

	animations = 0, // the current amount of animations that have been started
	objAnimationInstances = {},
	objTransformHistory = {}, // css transforms are lost in the matrix so we gotta keep track of them
	objTransformDefaults = {
		scale : "1,1",
		scaleX : 1,
		scaleY : 1,
		scaleZ : 1,
		scale3d : "1,1,1",
	},

	objQueueChain = {}, // holds information for queuing animations for asynchronous playback

	// Resource needed for adding px by default to css that doesnt have a prefix provided
	arrExcludePx = {'transform-scaleX':1,'transform-scaleY':1,'transform-scale':1,'column-count': 1,'fill-opacity': 1,'font-weight': 1,'line-height': 1,opacity: 1,orphans: 1,widows: 1,'z-index': 1,zoom: 1,'background-color': 1},

	// create new methods in the q variable that call bind ex: q(mixed).click(function);
	arrAutoBind = ["click","mousedown","mouseup","mouseover","mousemove","mouseleave","mouseenter","change","load","dblclick","focus","focusin","focusout","input","keydown","keypress","keyup","resize","reset","scroll","select","touchcancel","touchend","touchmove","touchstart","transitionend","unload","wheel"],

	// Support for .data
	arrDataMemory = {},
	// Support for: .bind .unbind .trigger
	objEventMomory = {},
	fun = {
		length : 0,
		is_q : 1,
		version : "1.1",
		layers : 0 // how many times has the find function ran
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
	};
	q.prototype = fun;

	// gives a q something to do. used when q is called as a function
	fun.put = function (mixedQuery) {
		var 
		that = this,
		queryType = typeof mixedQuery;
		if (queryType == 'function') {
			// DOM ready
			if ( document.readyState === "complete" ) {
				mixedQuery();
			} else {
				// Create the promise
				arrReadyPromises.push(mixedQuery);
				// Set the even listeners
				if (!boolReadyEventsOn) {
					boolReadyEventsOn = true;
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
		} else if (queryType == 'object') {
			var i=0;
			if (isNode(mixedQuery)) {
				that[i++] = mixedQuery;
			} else if (Array.isArray(mixedQuery)) {
				iterate(mixedQuery,function () {
					that[i++] = this;
				});
			} else {
				that[i++] = mixedQuery;
			}
			that.length = i;
		} else if (queryType == 'array') {
			var i=0,
			l=mixedQuery.length;
			while (i<l)
				that[i] = mixedQuery[i++];
			that.length = i;
		} else if (queryType == 'string' && mixedQuery.charAt(0) === "<" && mixedQuery.charAt( mixedQuery.length - 1 ) === ">" && mixedQuery.length >= 3) {
			var wrapper = document.createElement('div');
			wrapper.innerHTML = mixedQuery;
			var
			children = wrapper.children,
			l = children.length,
			i=0;
			while (i<l)
				that[i] = children[i++];
			that.length = i;
		} else
			return fun.find(mixedQuery);
		return that;
	};

	// Find out if an object is a DOM node
	fun.isNode = isNode = function (o){
		return (
			typeof Node === "object" 
			? o instanceof Node 
			: o && typeof o === "object" && typeof o.nodeType === "number" && typeof o.nodeName==="string"
		);
	};

	// Find elements in dom that matches a CSS selection
	// Adds them as a list to a copy of the q object
	fun.find = function (strQuery) {
		var qcopy = copy(fun), // start with a fresh q handle
		arrResult = [],
		l=this.length,
		i=0;
		if (this.layers!=0 && !l)
			return qcopy;
		qcopy.layers=this.layers+1;
		var arrMatched = strQuery.match(/^ *> *(.+)/);
		if (arrMatched) {
			iterate(this.children(), function (k,el) {
				if (arrMatched[1] == "*" || q(el).is(arrMatched[1]))
					qcopy[i++] = el;
			});
		} else {
			if (!l)
				arrResult = [].slice.call(document.querySelectorAll(strQuery));
			else while (i<l) {
				var arrSubResult = [].slice.call(this[i++].querySelectorAll(strQuery));
				arrResult = arrResult.concat(arrSubResult);
			}
			l = arrResult.length;
			i=0;
			while (i<l)
				qcopy[i] = arrResult[i++];
		}
		qcopy.length = i;
		return qcopy;
	};

	// Check if matches a selection
	fun.is = function (strQuery) {
		var boolIs = true;
		iterate(this,function (k,el) {
			if (!(el.matches || el.matchesSelector || el.msMatchesSelector || el.mozMatchesSelector || el.webkitMatchesSelector || el.oMatchesSelector).call(el, strQuery)) {
				boolIs = false;
				return false;
			}
		});
		return boolIs;
	};

	// Clone a dom node
	fun.clone = function (boolDeep) {
		boolDeep = boolDeep !== false;
		var 
		qcopy = copy(fun),
		intItr=0;
		iterate(this,function () {
			qcopy[intItr] = this.cloneNode(boolDeep)
			intItr++;
		});
		qcopy.length = intItr;
		return qcopy;
	};

	// Store data on a DOM node
	fun.data = function (strKey, strVal) {
		var 
		boolGet = typeof strVal == "undefined",
		arrDataResult = [];
		iterate(this,function (j,el) {
			var that = this,
			intUId = q(el).uniqueId();
			if (boolGet)
				arrDataResult.push(arrDataMemory[intUId][strKey]);
			else {
				if (!arrDataMemory[intUId])
					arrDataMemory[intUId] = {};
				arrDataMemory[intUId][strKey] = strVal;
			}
		});
		if (boolGet)
			return arrDataResult;
		else
			return this;
	};

	// Get all the HTML currently held as nodes in the current query
	fun.html = function (strHTML, strAttrKey) {
		var htmlAttr = strAttrKey || "innerHTML";
		if (strHTML == undefined) {
			strHTML = "";
			iterate(this,function (k,el) {
				strHTML += el[htmlAttr];
			});
			return strHTML;
		}
		iterate(this,function (k,el) {
			el[htmlAttr] = strHTML;
		});
		return this;
	};
	
	fun.children = function () {
		var
		qcopy = copy(fun),
		intNode = 0;
		iterate(this,function (k,el) {
			var 
			nodes = el.childNodes,
			intNodes = nodes.length;
			for (var i=0;i!=intNodes;i++) {
				qcopy[intNode++] = nodes[i];
			}
		});
		qcopy.length = intNode;
		return qcopy;
	};
	
	fun.disableSelect = function () {
		var none = "none";
		iterate(this,function (k,el) {
			q(el).css({
				'-webkit-touch-callout': none, /* iOS Safari */
			    '-webkit-user-select': none, /* Safari */
			     '-khtml-user-select': none, /* Konqueror HTML */
			       '-moz-user-select': none, /* Firefox */
			        '-ms-user-select': none, /* Internet Explorer/Edge */
			            'user-select': none /* Non-prefixed version, currently
			                                  supported by Chrome and Opera */
			})
		});
		return this;
	}

	// Same as .html except with the outer html
	fun.outer = function (strHTML) {
		return this.html(strHTML, "outerHTML");
	};
	
	// Add text to a DOM node
	fun.text = function (strText) {
		return this.html(strText, "textContent");
	};
	
	// set the value of an input
	fun.val = function (strVal) {
		if (!this[0])
			return;
		if (strVal == undefined)
			return this[0].value;
		this[0].value = strVal;
		return this;
	}

	// Find the top left position of an DOM object
	fun.position = function () {
		var el = this[0],
		rect = el.getBoundingClientRect(), 
	    scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
	    scrollTop = window.pageYOffset || document.documentElement.scrollTop;
	    return { 
	    	top: rect.top + scrollTop, 
	    	left: rect.left + scrollLeft 
	    };
	};
	
	fun.scrollTop = function (intTop) {
		var el = this[0];
		if (el == window) {
			return window.pageYOffset || document.documentElement.scrollTop;
		} else {
			return el.scrollTop;
		}
	};

	// DOM width
	fun.width = function () {
		return this[0].innerWidth || this[0].offsetWidth || this[0].clientWidth;
	};
	
	// DOM height
	fun.height = function () {
		return this[0].innerHeight || this[0].offsetHeight || this[0].clientHeight;
	};

	// DOM innerWidth (not counting scrollbars)
	fun.innerWidth = function () {
		if (this[0] == window)
			return document.documentElement.clientWidth || this.width();
		return this[0].clientWidth || this.width();
	};
	// DOM innerHeight (not counting scrollbars)
	fun.innerHeight = function () {
		if (this[0] == window)
			return document.documentElement.clientHeight || this.height();
		return this[0].clientHeight || this.height();
	};

	// Dynamically adds a CSS stylesheet
	q.addCSS = function (strCss, arrCss) {
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
		return this;
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
	fun.css = function (mixedCss) {
		var that = this;
		if (typeof mixedCss == "function") {
			mixedCss = mixedCss.call(that);
		}
		if (typeof mixedCss == 'undefined') {
			return getComputedStyle(that[0]);
		} else if (typeof mixedCss == 'string') {
			var objStyle = getComputedStyle(that[0]);
			return objStyle ? objStyle[reverseCamel(mixedCss)] : 0;
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
			strParam = reverseCamel(strKey),
			strImportant = /!important *$/.test(mixedCss[strKey]) ? 'important' : '';
			if (typeof strValue == 'string')
				strValue = strValue.replace(/ *!important *$/, '');
			if (
				(typeof strValue == "number"
				|| typeof strValue == "float"
				|| (strValue+"").match(/^[0-9\.]+$/)) 
				&& !arrExcludePx[strParam]
			)
				strValue += 'px';
			iterate(that,function (k,el) {
				el.style.setProperty(strParam, strValue, strImportant);
			});
		}
		return that;
	},

	// Check if selection has a class (a bit redundant with .is but should be tested for a performance difference)
	fun.hasClass = function (strClassName) {
		var arrClasses = strClassName.split(/ /),
		boolHas = true,
		l=arrClasses.length;
		iterate(this,function ()  {
			for (var i=0;i!=l;i++) {
				if (!this.classList.contains(strClassName))
					boolHas = false;
			}
		});
		return boolHas;
	};

	// Add a class to the selection
	fun.addClass = function (strClassName, boolRemove) {
		var strEvent = boolRemove ? "remove" : "add";
		iterate(this,function ()  {
			this.classList[strEvent](strClassName);
		});
		return this;
	};

	// Remove a class
	fun.removeClass = function (strClassName) {
		return this.addClass(strClassName, 1);
	};

	// Set an attribute
	fun.attr = function (strKey, strVal, boolRemove) {
		if (!strVal)
			return this[0].getAttribute(strKey);
		iterate(this,function () {
			this.setAttribute(strKey, strVal);
		});
		return this;
	};

	// Remove an attribute
	fun.removeAttr = function (strKey) {
		iterate(this,function () {
			this.removeAttribute(strKey);
		});
		return this;
	};

	// Get a results from the query
	fun.get = function (intIndex) {
		if (typeof intIndex != "undefined") {
			if (this[intIndex])
				return this[intIndex];
		} else {
			var arrResult = [];
			iterate(this,function () {
				arrResult.push(this);
			});
			return arrResult;
		}
	};

	// Loop though a query
	fun.each = function (fnCallback) {
		iterate(this, function (k,v) {
			return fnCallback.call(this,k,v);
		});
	};
	q.each = function (obj, fnCallback) {
		iterate(obj, function (k,v) {
			return fnCallback.call(this,k,v);
		});
	};

	// Bind events
	fun.bind = function (strEvents, fnCallback) {
		var arrEvents = strEvents.split(/ /);
		iterate(this,function (k,node) {
			var method = function (e) {
				e = e || window.event;
				e.target = e.target || e.srcElement;
				// defeat Safari bug
				if (e.target.nodeType == 3)
					e.target = e.target.parentNode;
				fnCallback.call(node, e);
			},
			intNodeUid = q(node).uniqueId();
			q(arrEvents).each(function () {
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
		return this;
	};

	// Add short hand methods that call binders automatically defined by arrAutoBind variable
	for (var intAutoBind in arrAutoBind) {
		var strName = arrAutoBind[intAutoBind];
		fun[strName] = (function (strName) {
			return function (fnCallback) {
				return this[!fnCallback ? "trigger" : "bind"](strName, fnCallback);
			};
		})(strName);
	}

	// unbinds an event
	fun.unbind = function (strEvents) {
		var arrEvents = strEvents.split(/ /);
		iterate(this,function (k,node) {
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
					for (var strEventCategory in arrCallbacks) {
						var fnCallback = arrCallbacks[strEventCategory];
						window.addEventListener
						? node.removeEventListener(strEventName, fnCallback, true)
						: node.detachEvent(arrAutoBind[strEventName] ? 'on' + strEventName : strEventName, fnCallback);
						delete objEventMomory[qNodeUid][strEventName][strEventCategory];
					}
				}
			});
		});
		return this;
	};

	// triggers an event
	fun.trigger = function (strEvent) {
		var 
		event = document.createEvent('HTMLEvents'),
		that = this;
		event.initEvent(strEvent, true, false);
		iterate(this,function (k,node) {
			node.dispatchEvent(event);
		});
		return this;
	};
	
	// convert an object into a uri string ex: {k:"v"} to /k/v
	fun.serialize = function() {
		var str = [];
		for(var p in this[0])
			if (this[0].hasOwnProperty(p)) {
				str.push(encodeURIComponent(p) + "/" + encodeURIComponent(this[0][p]));
			}
		return str.join("/");
	};

	// append something to the selection
	fun.append = function (mixedVar, strAlternateMethod) {
		var 
		item = typeof mixedVar == 'string' ? q(mixedVar) : mixedVar,
		strMethod = strAlternateMethod || "appendChild";
		iterate(this,function () {
			var node = this;
			iterate(item,function () {
				node[strMethod](this, node.firstChild);
			});
		});
		return this;
	};

	// Prepend something to the selection
	fun.prepend = function (mixedVar) {
		return this.append(mixedVar, "insertBefore");
	};

	// Append self to a node
	fun.appendTo = function (mixedVar) {
		return q(mixedVar).append(this);
	};

	// Append self after node
	fun.appendAfter = function (mixedVar, boolBefore) {
		var 
		qNode = q(mixedVar),
		objNext = boolBefore ? qNode[0] : qNode['next']()[0],
		qParent = qNode.parent();
		if (objNext) {
			qParent[0].insertBefore(this[0], objNext);
		} else {
			qParent[boolBefore ? 'prepend' : 'append'](this);
		}
		return this;
	};

	// Append self before a node
	fun.appendBefore = function (mixedVar) {
		return this.appendAfter(mixedVar, 1);
	};

	// Remove node
	fun.remove = function () {
		iterate(this,function () {
			if (this.parentNode) // make sure its attached to something
				this.parentNode.removeChild(this);
		});
		return this;
	};

	// Next sibling node
	fun.next = function (strType) {
		var qcopy = copy(fun),
		i=0;
		iterate(this,function () {
			qcopy[i] = this[strType ? strType : "nextElementSibling"] || false;
			i++;
		});
		qcopy.length = i;
		return qcopy;
	};

	// Previous sibling node
	fun.prev = function () {
		return this.next("previousElementSibling");
	};

	// Parent node
	fun.parent = function () {
		return this.next("parentNode");
	};

	// Unix epoch in MS
	q.mstime = function () {
		return (new Date()).getTime();
	};

	// Closest parent to the current selection
	fun.closest = function (strQuery) {
		var el = q(this[0]);
		if (el.is(strQuery))
			return el;
		if (el.is("body"))
			return {};
		var parent = el.parent();
		return parent.closest(strQuery);
	};
	
	// creates a unique id that can be used to save or reference to an object using a hash code
	// not to be confused with the setting the ID attribute on the DOM, this function is for internal indexing
	var 
	intUniqueIdIterator = 1,
	objUniqueIdLib = [];
	q.uniqueId = fun.uniqueId = function (strIdToLoad) {
		if (strIdToLoad == undefined) {
			// generate an new ID
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
	}

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
		var r = new XMLHttpRequest(),
		strParams = typeof arrParams.post == 'object' ? q(arrParams.post).serialize() : arrParams.post;
		r.open("GET", arrParams.url+'/'+strParams, true);
		r.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		r.onreadystatechange = function () {
			if (r.readyState == 4 ) {
				if (r.status == 200) {
	           		if (arrParams.success)
						arrParams.success(r.responseText);
				} else if (r.status == 400) {
					arrParams.failure(r.responseText);
				} else {
					arrParams.failure(r.responseText);
				}
	        }
		};
		r.send(strParams);
	};

	fun.offsetParent = function () {
		var node = this.parent();
		while (node.length) {
			var strPos = node.css("position");
			if (strPos == "relative" || strPos == "absolute")
				return node;
			node = node.parent();
		};
		return copy(fun); // empty
	};

	// Animation easings
	var easings = q.easings = {};
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
    
	// turns on or off asynchronous animations and pauses
	fun.queue = function (boolOff) {
		if (boolOff)
			iterate(this, function (k,el) {
				var intElUid = q(el).uniqueId();
				delete objQueueChain[intElUid];
			});
		else
			iterate(this, function (k,el) {
				var intElUid = q(el).uniqueId();
				if (!objQueueChain[intElUid])
					objQueueChain[intElUid] = {
						on : true,
						sequence : []
					};
			});
		return this;
	};

	// jump to the next item in the queue
	q.queueNext = fun.queueNext = function (el) {
		var that = this;
		if (el)
			runNext(el);
		else 
			iterate(this, function (k,el) {
				runNext(el);
			});
		function runNext(el) {
			var intElUid = q(el).uniqueId();
			if (objQueueChain[intElUid]) {
				if (objQueueChain[intElUid].sequence.length) {
					var arrParams = objQueueChain[intElUid].sequence.shift();
					that.animate.call(that, arrParams[0], arrParams[1], arrParams[2], arrParams[3], arrParams[4]);
				} else {
					delete objAnimationInstances[intElUid];
				}
			} else if (objAnimationInstances) {
				delete objAnimationInstances[intElUid];
			}
		}
		return that;
	};

	// turn of the animation queue
	fun.dequeue = function () {
		iterate(this, function (k,el) {
			var intElUid = q(el).uniqueId();
			if (objQueueChain[intElUid])
				objQueueChain[intElUid].sequence = [];
		});
		return this;
	};

	fun.pause = function () {
		return this.css({
			"animation-play-state" : "paused"
		});
	};

	fun.play = function () {
		return this.css({
			"animation-play-state" : "running"
		});
	};

	fun.stop = function () {
		var that = this;
		iterate(this, function (k,el) {
			var 
			objAI = objAnimationInstances,
			intElUid = q(el).uniqueId();
			if (objAI[intElUid]) {
				objAI[intElUid].stop();
				delete objAI[intElUid];
			}
		});
		return this.css({
			"animation-play-state" : "paused"
		}).dequeue();
	};

	q.delay = fun.delay = function (intMS, fnCallback) {
		var that = this;
		if (!that.length)
			 window.setTimeout(function () {
			 	if (fnCallback)
			 		fnCallback();
			 	that.queueNext();
			 }, intMS);
		else
			iterate(this,function (intItem, el) {
				var intElUid = q(el).uniqueId();
				if (objQueueChain[intElUid]) {
					if (objQueueChain[intElUid].active) {
						// Add next animation to chain
						objQueueChain[intElUid].sequence.push(["delay", intMS, fnCallback]);
						return false;
					}
					objQueueChain[intElUid].active = true;
				}
			});
		return this;
	};

    // Animation Created: Apr 13, 2018
    fun.animationSettings = {};
    fun.boolDebugMode = false;
    fun.debug = function (boolOn) {
    	this.boolDebugMode = boolOn == undefined || !!boolOn;
    	return this;
    };
	fun.animate = function (objCssTo) {
		if (typeof objCssTo == "string") {
			if (objCssTo == "delay") {
				var fnCallback = arguments[2];
				var fnDone = function () {
					fnCallback();
				};
				q.delay(arguments[1], fnDone);
			} else {
				this.animationSettings[objCssTo] = arguments[1];
			}
			return this;
		}
		var 
		that = this,
		intArgs = arguments.length,
		intDuration = 750,
		fnEasing = easings.linear,
		strEasing = "linear",
		objOptions = {
			stopped : function () {}, // the animation was stopped without finishing
			finished : function () {}, // redundant function works just like 
			ended : function () {} // called when an animation is stopped or finishes on its own
		},
		fnCallback = function () {};
		for (var intArg=1;intArg<intArgs;intArg++) {
			var 
			mixedValue = arguments[intArg],
			strType = typeof mixedValue;
			if (strType == "number" || strType == "float") {
				intDuration = mixedValue;
			} else if (strType == "string") {
				strEasing = mixedValue;
				fnEasing = easings[mixedValue] || easings.linear;
			} else if (strType == "function") {
				fnCallback = mixedValue;
			} else if (strType == "object") {
				extend(objOptions, mixedValue);
			}
		}
		var 
		intIterations = Math.ceil(intDuration/10),
		regMatchNumbers = /(\-?[0-9]+(?:\.[0-9]+)?(?:[a-z]{2}?|%)?)/gi,
		regSplitNumbers = /\-?[0-9]+(?:\.[0-9]+)?(?:[a-z]{2}?|%)?/gi,
		boolAccelerate = this.animationSettings.accelerate; // Match measurement units
		iterate(this,function (intItem, el) {
			var intElUid = q(el).uniqueId();
			if (objQueueChain[intElUid]) {
				if (objQueueChain[intElUid].active) {
					// Add next animation to chain
					objQueueChain[intElUid].sequence.push([objCssTo, intDuration, strEasing, fnCallback, objOptions]);
					return;
				}
				objQueueChain[intElUid].active = true;
			}
			if (typeof objCssTo == "function") {
				objCssTo = objCssTo.call(that);
			}
			var 
			objHistory = objTransformHistory[intElUid],
			objCssFrom = {},
			arrOutput = [],
			strCurrentKey,
			objStartStyles = getComputedStyle(el),
			boolTransformsUsed = false;
			if (!objHistory) {
				objTransformHistory[intElUid] = {};
				objHistory = objTransformHistory[intElUid];
			}
			for (var strCssToKey in objCssTo) {
				var 
				to = objCssTo[strCssToKey],
				toRC = reverseCamel(strCssToKey);
				// iterate the tranform in a slightly different way
				if (toRC == "transform") {
					if (objHistory)
						objCssTo[strCssToKey] = to = q.extend(copy(objHistory),to);
					boolTransformsUsed = true;
					for (var strTransform in to) {
						var 
						strTransformTo = to[strTransform],
						strTransformFrom = objHistory && typeof objHistory[strTransform] != "undefined" ? objHistory[strTransform] : (objTransformDefaults[strTransform] || 0);
						tweenString(toRC+"-"+strTransform, toRC+"-"+strTransform, parseFloat(strTransformFrom), parseFloat(strTransformTo));
					}
				} else {
					var
					change = to - from,
					from = objStartStyles[reverseCamel(strCssToKey)] || 0;
					tweenString(strCssToKey, toRC, from, to);
				}
			}
			function tweenString(strCssToKey, toRC,from,to) {
				var 
				intToValues = 1,
				intDefaultFrom = toRC == "rgba" || toRC == "opacity" || toRC == "background-color" ? 1 : 0,
				strOutput = '',
				arrToValues = [to],
				arrFromValues = [from],
				arrToWrappers = [];
			    if (typeof from == "string") {
					arrFromValues = from.match(regMatchNumbers);
				}
				if (!arrFromValues) {
					arrFromValues = [intDefaultFrom];
				}
				if (to[0] == "#") {
					to = hexToRgb(to);
				} else if (typeof to == "string") {
					arrToWrappers = to.split(regSplitNumbers);
					arrToValues = to.match(regMatchNumbers);
					intToValues = arrToValues.length;
				}
				// itarete to values
				if (intToValues == 3 && toRC == "background-color") {
					intToValues++;
					arrToValues[3] = 1;
					arrToWrappers[3] = ", ";
					arrToWrappers[4] = ")";
					arrToWrappers[0] = "rgba(";
				}
				for (var intItem=0;intItem!=intToValues;intItem++) {
					var
					// unit conversinos will not be handled (might be too much code needed)
					mixedFromValue = ((arrFromValues[intItem] || intDefaultFrom)+'').replace(/[a-z%]+/, '')*1,
					mixedToValue = arrToValues[intItem],
					matchToSuffix = typeof mixedToValue == 'string' ? mixedToValue.match(/([a-z%]+)/) : "",
					strToSuffix = matchToSuffix ? matchToSuffix[1] : (typeof mixedToValue == 'string' || arrExcludePx[toRC] ? '' : 'px');
					if (typeof mixedToValue == 'string')
						mixedToValue = mixedToValue.replace(/[a-z%]+/, '')*1;
					var mixedChange = mixedToValue - mixedFromValue;
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
			// reprocess transforms into proper CSS
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
			strKeyFrameName = "qStepAnim" + q.mstime() + (animations++), // generate an ID
			strAnimation = "@keyframes " + strKeyFrameName + " {" + arrOutput.join("}\n") + "}",
			style = document.createElement('style');
			style.type = 'text/css';
			style.innerHTML = strAnimation,
			boolNewInstance = !objAnimationInstances[intElUid];
			if (boolNewInstance)
				objAnimationInstances[intElUid] = {
					animationAttributes : {}
				};
			var objAI = objAnimationInstances[intElUid];
			document.getElementsByTagName('body')[0].appendChild(style);
			var 
			// finalize an animation once its complete
			fnDone = objAI.done = function () {
				return (function (strKeyFrameName, objCssTo, el, toRC, fnDone, objAI, style, intElUid, objOptions) {
					return (function () {
						// reprocess transforms into proper CSS
						if (objCssTo.transform) {
							objTransformHistory[intElUid] = objCssTo.transform;
							objCssTo.transform = stringifyTransformData(objCssTo.transform);
						}
						q(el).css(objCssTo);
						cleanUp(el,fnDone,style,intElUid);
						fnCallback();
						strCurrentKey = toRC;
						q.queueNext.call(that,el);
						objOptions.ended();
						objOptions.finished();
					})();
				})(strKeyFrameName, objCssTo, el, toRC, fnDone, objAI, style, intElUid, objOptions);
			};
			// stop an animation before complete
			objAI.stop = function () {
				return (function (that, objAI, intDuration, arrOutput, fnDone, el, style, intElUid, objOptions) {
					return (function () {
						if (that.boolDebugMode)
							bark(['stop', that]);
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
						cleanUp(el,fnDone,style, intElUid);
						objOptions.ended();
						objOptions.stopped();
					})();
				})(that, objAI, intDuration, arrOutput, fnDone, el, style, intElUid, objOptions);
			};
			var strAnimationEndEvent = 'animationend webkitAnimationEnd oanimationend MSAnimationEnd';
			function cleanUp(el,fnDone,style, intElUid) {
				if (objQueueChain[intElUid])
					objQueueChain[intElUid].active = false;
				el.style.setProperty("animation", "none");
				//el.offsetHeight; // Trigger a reflow, flushing the CSS changes
				q(style).remove();
				delete style;
				delete objAnimationInstances[intElUid];
			}
			objAI.startTime = q.mstime();
			var strPrefix = boolNewInstance ? "" : Object.keys(objAI.animationAttributes).join(",") + ",";
			var strAnimationAtrribute = strKeyFrameName + " " + intDuration + "ms forwards";
			objAI.animationAttributes[strAnimationAtrribute] = 1;
			el.style.setProperty("animation", strPrefix + strAnimationAtrribute);
			q(el)
			.play(); // make sure its unpaused
			objAI.timeout = window.setTimeout(fnDone, intDuration);
			//.bind(strAnimationEndEvent, fnDone);

		});

		return this;
	};
})();
