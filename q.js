/*
 * JavascriptQ v1.02
 * https://github.com/AugmentLogic/JavascriptQ
 */
// - start of core dependencies
var q = function (mixedQuery) {
	// Variable chain contains information that can be gathered but is forgotten
	// each time a new query starts.
	// This is different from the traditional array chain in that its as an
	// assoicative array designed to keep track of things temporarily.
	q.chain = {};
	// Start handling requests that come directly from a q session initiation.
	// If a function is passed in it will launch right away if the dom is ready
	// or wait if it is not.
	if (typeof mixedQuery == 'function') {
		if (q.domIsLoaded)
			mixedQuery.call(q);
		else
			q.load_promises.push(mixedQuery);
		window.onload = function () {
			q.domIsLoaded = true;
			var len = q.load_promises.length;
			for (var intItr=0;intItr!=len;intItr++) {
				q.load_promises[intItr].call(q);
			}
		};
		return q;
	// If an object is passed in add it to the array chain and as always trim
	// anything off the remainder incase there was a previous chain, since array
	// chains are never purged until a new chian is created.
	} else if (typeof mixedQuery == 'object') {
		q[0] = mixedQuery;
		q.functionTrim(1);
		return q;
	// Pass an entire array into the q array chain.
	} else if (typeof mixedQuery == 'array') {
		var len = mixedQuery.length;
		for (var i=0; i!=len; i++) {
			q[i] = mixedQuery[i];
		}
		q.functionTrim(i);
		return q;
	// Html detected, build the html then load all it's nodes into the array
	// chain for further use.
	} else if (/<[a-z][\s\S]*>/i.test(mixedQuery)) {
		var children = q.make(mixedQuery);
		var len = children.length
		for (var i=0;i!=len;i++) {
			q[i] = children[i];
		}
		q.functionTrim(i);
		return q;
	// When anything else besides the above things is found q assumes that the
	// query variable must contain css so it searches the dom from the dom
	// element in the array chian or if the is empty form the start of the
	// document.
	} else {
		q.functionTrim(0);
		return q.find(mixedQuery);
	}
	return q;
};
q.v = 1.02;
q.isJavascriptQ = q.is_q = true;
// requied variables
q.domIsLoaded = false;
q.load_promises = [];
q.pixel_items = {
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
// Search the dom from the array chain or if there is nothing in chain from
// the start of the document.
q.find = function (strQuery) {
	var arrResult = [];
	if (this[0]) {
		q.each(function () {
			var arrSubResult = [].slice.call(this.querySelectorAll(strQuery));
			arrResult = arrResult.concat(arrSubResult);
		});
	} else {
		arrResult = [].slice.call(document.querySelectorAll(strQuery));
	}
	var i=0;
	var len = arrResult.length;
	if (len) {
		for (; i!=len; i++) {
			q[i] = arrResult[i];
		}
	}
	q.functionTrim(i);
	return q;
};
// Iterate arrays, objects and fake function arrays
q.each = function (mixedParam1, fnCallback) {
	if (typeof mixedParam1 == 'function') {
		if (typeof fnCallback != 'function') {
			fnCallback = mixedParam1;
			mixedParam1 = this;
		}
		if (typeof mixedParam1[0] != 'undefined') {
			for (var i=0;mixedParam1[i];i++) {
				var res = mixedParam1.call(mixedParam1[i]);
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
	return q;
};
// Remove all items from a fake function array
q.functionTrim = function (intIndex) {
	for (var intItr=intIndex;q[intItr];intItr++) {
		delete q[intItr];
	}
};
q.copy = function (obj) {
	if (null == obj || "object" != typeof obj) return obj;
	var copy = obj.constructor();
	for (var attr in obj) {
		if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
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
		return obj.style.cssText;
	} else {
		if (typeof mixedCss == 'string')
			return getComputedStyle(this[0])[mixedCss];
		q.each(function () {
			for (var strKey in mixedCss) {
				var strImportant = /!important *$/.test(mixedCss[strKey]) ? 'important' : undefined;
				var strValue = typeof mixedCss[strKey] == 'string' ? mixedCss[strKey].replace(/ *!important *$/, '') : mixedCss[strKey];
				this.style.setProperty(strKey, strValue);
			}
		});
		return q;
	}
};
// - end of debug dependencies
// - start of dom manipulation dependencies
q.html = function (strHTML) {
	if (strHTML == undefined)
		return q[0].innerHTML;
	q.each(function () {
		this.innerHTML = strHTML;
	});
	return q;
};
q.replaceWith = function (strHTML) {
	this[0].outerHTML = strHTML;
};
q.clone = function () {
	return this[0].cloneNode(true);
};
// Use only one parameter to add a class to an element in the chain. Use two
// parameters to inject a class with css into a document head stylesheet.
q.addClass = function (strClassName, arrCss) {
	if (!arrCss) {
		q.each(function () {
			this.classList.add(strClassName);
		});
		return q;
	} else if (typeof arrCss == 'object') {
		var strTempCss = strClassName + ' {';
		for (var strName in arrCss) {
			strTempCss += strName + ':' + arrCss[strName] + ';';
		}
		strTempCss += '}';
		strClassName = strTempCss;
	}
	var all = document.styleSheets;
	if (typeof all[all.length - 1] == 'undefined') {
		document.head.appendChild(document.createElement('style'));
		all = document.styleSheets;
	}
	var s = all[all.length - 1];
	var l = s.cssRules.length;
	var boolIE=!s.insertRule;
	s[boolIE?'addRule':'insertRule'](strClassName, boolIE?-1:l);
};
q.removeClass = function (strClassName) {
	q.each(function () {
		this.classList.remove(strClassName);
	});
};
q.attr = function (strKey, strVal) {
	if (!strVal)
		return this[0].getAttribute(strKey);
	q.each(function () {
		this.setAttribute(strKey, strVal!=0 && q.pixel_items[strKey] && typeof strVal != 'string' ? strVal+'px' : strVal);
	});
	return q;
};
q.removeAttr = function (strKey, strVal) {
	q.each(function () {
		this.removeAttribute(strKey, strVal);
	});
	return q;
};
q.bind = function (strEvents, fnCallback) {
	q.each(function () {
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
	return q;
};
q.unbind = function (strEvents) {
	q.each(function () {
		var node = this;
		q.each(strEvents.split(/ /),function () {
			node.removeEventListener('on' + this);
		});
	});
	return q;
};
q.make = function (strHtml) {
	var wrapper = document.createElement('div');
	wrapper.innerHTML = strHtml;
	return wrapper.children;
};
q.append = function (mixedVar) {
	var item = typeof mixedVar == 'string' ? q.make(mixedVar) : mixedVar;
	q.each(function () {
		var node = this;
		q.each(item,function () {
			node.appendChild(this);
		});
	});
	return q;
};
q.prepend = function (mixedVar) {
	var item = typeof mixedVar == 'string' ? q.make(mixedVar) : mixedVar;
	res.iterate.call(this,function () {
		var node = this;
		res.iterate.call(item,function () {
			node.insertBefore(this, node.firstChild);
		});
	});
	return q;
};
q.remove = function () {
	this[0].parentNode.removeChild(this[0]);
};
q.text = function (strText) {
	if (strText == undefined)
		return this[0].textContent;
	this[0].textContent = strText;
	return this;
};
q.trigger = function (strEvent) {
	var event = document.createEvent('HTMLEvents');
	event.initEvent(strEvent, true, false);
	this[0].dispatchEvent(event);
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
	q.chain.pos = {
		top: top,
		left: left
	};
	return q.chain.pos;
};
q.left = function () {
	return q.chain.pos ? q.chain.pos.left : q.pos().left;
};
q.top = function () {
	return q.chain.top ? q.chain.pos.top : q.pos().top;
};
q.right = function () {
	return q.left()+q.width();
};
q.bottom = function () {
	return q.top()+q.height();
};
q.is = function (strQuery) {
	q.each(function () {
		var el = this;
		return (el.matches || el.matchesSelector || el.msMatchesSelector || el.mozMatchesSelector || el.webkitMatchesSelector || el.oMatchesSelector).call(el, strQuery);
	});
};
q.hasClass = function (strClassName) {
	var boolHas = false;
	q.each(strClassName.split(/ /), function (k) {
		var name = this;
		q.each(function () {
			if (this.classList.contains(name)) {
				boolHas = true;
				return false;
			}
		});
		if (boolHas)
			return false;
	});
	return boolHas;
};
q.next = function () {
	return this[0].nextElementSibling;
};
q.prev = function () {
	return this[0].previousElementSibling;
};
q.parent = function () {
	return this[0].parentNode;
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
