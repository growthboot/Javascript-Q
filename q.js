// - start of core dependencies
var q = function (query) {
	/*
	 * QueryChain Library v1.031
	 * Tutorial available at:
	 * https://github.com/AugmentLogic/QueryChain
	 */
	return q.r.init(query);
};
q.v = 1.031;
q.isJavascriptQ = q.is_q = true;
// requied variables
q.count = 0;
q.r = {};
q.r.domIsLoaded = false;
q.r.load_promises = [];
q.r.pixel_items = {
	width:1,
	height:1,
	top:1,
	left:1,
	margin:1,
	padding:1,
	'margin-top':1,
	'margin-bottom':1,
	'margin-left':1,
	'margin-right':1,
	'padding-top':1,
	'padding-bottom':1,
	'padding-left':1,
	'padding-right':1,
	'border-width':1,
	'line-height':1
};
q.r.init = function (mixedQuery) {
	var qcopy = q.extend({},q);
	qcopy.isCopy = true;
	// don't extend resources to save memory
	delete qcopy.r;
	// Variable chain contains information that can be gathered but is forgotten
	// each time a new query starts.
	// This is different from the traditional array chain in that its as an
	// assoicative array designed to keep track of things temporarily.
	qcopy.chain = {};
	// Start handling requests that come directly from a q session initiation.
	// If a function is passed in it will launch right away if the dom is ready
	// or wait if it is not.
	if (typeof mixedQuery == 'function') {
		if (q.r.domIsLoaded)
			mixedQuery.call(qcopy);
		else
			q.r.load_promises.push(mixedQuery);
		window.onload = function () {
			q.r.domIsLoaded = true;
			var len = q.r.load_promises.length;
			for (var intItr=0;intItr!=len;intItr++) {
				q.r.load_promises[intItr].call(qcopy);
			}
		};
		qcopy[0] = document;
		return qcopy;
	// Pass an entire array into the q array chain.
	} else if (mixedQuery instanceof Array) {
		var len = qcopy.count = mixedQuery.length;
		for (var i=0; i!=len; i++) {
			qcopy[i] = mixedQuery[i];
		}
		qcopy.functionTrim(i);
		return qcopy;
	// If an object is passed in add it to the array chain and as always trim
	// anything off the remainder incase there was a previous chain, since array
	// chains are never purged until a new chian is created.
	} else if (mixedQuery instanceof Object) {
		qcopy[0] = mixedQuery;
		qcopy.count = 1;
		qcopy.functionTrim(1);
		return qcopy;
	// Html detected, build the html then load all it's nodes into the array
	// chain for further use.
	} else if (/<[a-z][\s\S]*>/i.test(mixedQuery)) {
		var children = qcopy.make(mixedQuery);
		var len = qcopy.count = children.length
		for (var i=0;i!=len;i++) {
			qcopy[i] = children[i];
		}
		qcopy.functionTrim(i);
		return qcopy;
		// When anything else besides the above things is found q assumes that the
		// query variable must contain css so it searches the dom from the dom
		// element in the array chian or if the is empty form the start of the
		// document.
	} else {
		qcopy[0] = document;
		qcopy.functionTrim(1);
		return qcopy.find.call(qcopy,mixedQuery);
	}
	return qcopy;
};
// Search down the dom from the array chain or if there is nothing in chain from
// the start of the document.
q.find = function (strQuery) {
	var arrResult = [];
	this.each(function () {
		var arrSubResult = [].slice.call(this.querySelectorAll(strQuery));
		arrResult = arrResult.concat(arrSubResult);
	});
	this.functionTrim(0);
	var i=0;
	var len = this.count = arrResult.length;
	if (len) {
		for (; i!=len; i++) {
			this[i] = arrResult[i];
		}
	}
	return this;
};
// Search up the dom for the closest object that matches a selector
q.closest = function (strQuery) {
	var node = q.parent(this[0]);
	while (!q(node).is(strQuery)) {
		node = q.parent(node);
	}
	this[0] = node;
	return this;
};
// Iterate arrays, objects and fake function arrays
q.each = function (mixedParam1, fnCallback) {
	if (typeof mixedParam1 == 'function') {
		if (typeof this[0] != 'undefined') {
			for (var i=0;this[i];i++) {
				var res = mixedParam1.call(this[i]);
				if (res === false)
					break;
			}
		}
	} else {
		for (var k in mixedParam1) {
			var v = mixedParam1[k];
			var res = fnCallback.call(v, k, v);
			if (res === false)
				break;
		}
	}
	return this;
};
// Remove all items from a fake function array
q.functionTrim = function (intIndex) {
	for (var intItr=intIndex;this[intItr];intItr++) {
		delete this[intItr];
	}
};
q.extend = function (objSource,objExtend) {
	var copy = objSource;
	for (var attr in objExtend) {
		if (objExtend.hasOwnProperty(attr)) copy[attr] = objExtend[attr];
	}
	return copy;
};
// - end of core dependencies
// - start of debug dependencies
q.trim = function (str) {
   return q.ltrim(q.rtrim(str));
};
q.ltrim = function (str) {
   return str.replace(new RegExp("^[\\s]+", "g"), "");
};
q.rtrim = function (str) {
   return str.replace(new RegExp("[\\s]+$", "g"), "");
};
q.css = function (mixedCss) {
	if (!mixedCss) {
		var obj = this.isJavascriptQ ? this[0] : this;
		return obj && obj.style ? obj.style.cssText : "";
	} else {
		if (typeof mixedCss == 'string') {
			return getComputedStyle(this[0],null).getPropertyValue(mixedCss);
		}
		this.each(function () {
			for (var strKey in mixedCss) {
				var strImportant = /!important *$/.test(mixedCss[strKey]) ? 'important' : undefined;
				var strVal = mixedCss[strKey];
				strVal = strVal!=0 && q.r.pixel_items[strKey] && typeof strVal != 'string' ? strVal+'px' : strVal;
				var strValue = typeof strVal == 'string' ? strVal.replace(/ *!important *$/, '') : strVal;
				this.style.setProperty(strKey, strValue);
			}
		});
		return this;
	}
};
// - end of debug dependencies
// - start of dom manipulation dependencies
q.html = function (strHTML) {
	if (strHTML == undefined)
		return this[0].innerHTML;
	this.each(function () {
		this.innerHTML = strHTML;
	});
	return this;
};
q.replaceWith = function (strHTML) {
	this.each(function () {
		this.outerHTML = strHTML;
	});
};
q.clone = function () {
	return this[0].cloneNode(true);
};
// Use only one parameter to add a class to an element in the chain. Use two
// parameters to inject a class with css into a document head stylesheet.
q.addClass = function (strClassName, arrCss) {
	if (!arrCss) {
		this.each(function () {
			var node = this;
			q.each(strClassName.split(/ /), function () {
				node.classList.add(this);
			});
		});
	} else if (typeof arrCss == 'object') {
		var strTempCss = strClassName + ' {';
		for (var strName in arrCss) {
			strTempCss += strName + ':' + arrCss[strName] + ';';
		}
		strTempCss += '}';
		strClassName = strTempCss;
		var all = document.styleSheets;
		if (typeof all[all.length - 1] == 'undefined') {
			document.head.appendChild(document.createElement('style'));
			all = document.styleSheets;
		}
		var s = all[all.length - 1];
		var l = s.cssRules.length;
		var boolIE=!s.insertRule;
		s[boolIE?'addRule':'insertRule'](strClassName, boolIE?-1:l);
	}
	return this;
};
q.removeClass = function (strClassName) {
	this.each(function () {
		var node = this;
		q.each(strClassName.split(/ /), function () {
			node.classList.remove(this);
		});
	});
};
q.attr = function (strKey, strVal) {
	if (!strVal)
		return this[0].getAttribute(strKey);
	this.each(function () {
		this.setAttribute(strKey, strVal);
	});
	return this;
};
q.removeAttr = function (strKey, strVal) {
	this.each(function () {
		this.removeAttribute(strKey, strVal);
	});
	return this;
};
q.bind = function (strEvents, fnCallback) {
	this.each(function () {
		var node = this;
		q.each(strEvents.split(/ /),function () {
			var method = function (e) {
				e = e || window.event;
				e.target = e.target || e.srcElement;
				// defeat Safari bug
				if (e.target.nodeType == 3)
					e.target = e.target.parentNode;
				fnCallback.call(node, e);
			};
			window.addEventListener ?
				node.addEventListener(this, method, true)
			 :
				node.attachEvent('on' + this, method);
		});
	});
	return this;
};
q.unbind = function (strEvents) {
	this.each(function () {
		var node = this;
		q.each(strEvents.split(/ /),function () {
			node.removeEventListener('on' + this);
		});
	});
	return this;
};
q.make = function (strHtml) {
	var wrapper = document.createElement('div');
	wrapper.innerHTML = strHtml;
	return wrapper.children;
};
q.append = function (mixedVar) {
	var item = typeof mixedVar == 'string' ? q.make(mixedVar) : mixedVar;
	this.each(function () {
		var node = this;
		q.each(item,function () {
			node.appendChild(this);
		});
	});
	return this;
};
q.prepend = function (mixedVar) {
	var item = typeof mixedVar == 'string' ? q.make(mixedVar) : mixedVar;
	this.each(function () {
		var node = this;
		q.each(item,function () {
			node.insertBefore(this, node.firstChild);
		});
	});
	return this;
};
q.remove = function () {
	this.each(function () {
		this.parentNode.removeChild(this);
	});
};
q.text = function (strText) {
	if (strText == undefined)
		return this[0].textContent;
	this.each(function () {
		this.textContent = strText;
	});
	return this;
};
q.trigger = function (strEvent) {
	var event = document.createEvent('HTMLEvents');
	event.initEvent(strEvent, true, false);
	this.each(function () {
		this.dispatchEvent(event);
	});
};
// - end of dom manipulation dependencies
// - start of dom information dependencies
q.mstime = function () {
	return (new Date()).getTime();
};
q.pos = function () {
	var element = this[0];
	var top = 0, left = 0;
	do {
		top += element.offsetTop  || 0;
		left += element.offsetLeft || 0;
		element = element.offsetParent;
	} while(element);
	this.chain.pos = {
		top: top,
		left: left
	};
	return this.chain.pos;
};
q.left = function () {
	return this.chain.pos ? this.chain.pos.left : this.pos().left;
};
q.top = function () {
	return this.chain.top ? this.chain.pos.top : this.pos().top;
};
q.right = function () {
	return this.left()+this.width();
};
q.bottom = function () {
	return this.top()+this.height();
};
q.is = function (strQuery) {
	var boolIs = false;
	var boolIsNot = false;
	this.each(function () {
		var el = this;
		var res = (el.matches || el.matchesSelector || el.msMatchesSelector || el.mozMatchesSelector || el.webkitMatchesSelector || el.oMatchesSelector).call(el, strQuery);
		if (res)
			boolIs = true;
		else
			boolIsNot = true;
	});
	return boolIs && !boolIsNot;
};
q.hasClass = function (strClassName) {
	var boolHas = false;
	var boolDoesntHave = false;
	this.each(function () {
		var node = this
		q.each(strClassName.split(/ /), function (k) {
			if (node.classList.contains(this)) {
				boolHas = true;
			} else {
				boolDoesntHave = true;
			}
		});
	});
	return boolHas && !boolDoesntHave;
};
q.next = function () {
	return this[0].nextElementSibling;
};
q.prev = function () {
	return this[0].previousElementSibling;
};
q.parent = function (node) {
	var boolNode = !!node;
	if (!boolNode)
		node = this[0];
	node = node.parentNode;
	if (!boolNode)
		this[0] = node;
	return boolNode ? node : this;
};
q.width = function () {
	return this[0].innerWidth;
};
q.height = function () {
	return this[0].innerHeight;
};
// - end of dom information dependencies
// - start of ajax dependencies
q.request = function (arrParams) {
	var r = new XMLHttpRequest();
	r.open("POST", arrParams.url, true);
	var strParams = typeof arrParams.post == 'object' ? q.serialize(arrParams.post) : arrParams.post;
	r.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	r.setRequestHeader("Content-length", strParams.length);
	r.setRequestHeader("Connection", "close");
	r.onreadystatechange = function () {
		if (r.readyState != 4 || r.status != 200) return;
		if (arrParams.success)
			arrParams.success(r.responseText);
	};
	r.send(strParams);
};
q.serialize = function(node) {
	if (!node)
		node = this[0];
	var str = [];
	for(var p in node)
		if (node.hasOwnProperty(p)) {
			str.push(encodeURIComponent(p) + "=" + encodeURIComponent(node[p]));
		}
	return str.join("&");
};
