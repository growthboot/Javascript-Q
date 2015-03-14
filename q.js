var q = function (strQuery) {
	var queries = {
		// first function call when q variable is called
		init : function (mixedQuery) {
			delete queries.init;
			if (typeof mixedQuery == 'object') {
				var qcopy = queries.copy(queries);
				qcopy[0] = mixedQuery;
				return qcopy;
			} else if (typeof mixedQuery == 'array') {
				var qcopy = queries.copy(queries);
				for (var i=0; i!=mixedQuery.length; i++) {
					qcopy[i] = mixedQuery[i];
				}
				return qcopy;
			} else if (/<[a-z][\s\S]*>/i.test(mixedQuery)) {
				var qcopy = queries.copy(queries);
				var wrapper = document.createElement('div');
				wrapper.innerHTML = mixedQuery;
				var children = wrapper.children;
				for (var i=0;i!=children.length;i++) {
					qcopy[i] = children[i];
				}
				return qcopy;
			} else
				return queries.find(mixedQuery);
		},
		// Iterate up the index of a q object
		iterate : function (fnCallback) {
			var boolFound = false;
			if (typeof this[0] != 'undefined') {
				for (var i=0;;i++) {
					if (typeof this[i] == 'undefined')
						break;
					fnCallback.call(this[i]);
					boolFound = true;
				}
			}
			return boolFound;
		},
		// Uses querySelectorAll to find elements in dom tree
		// and adds them as a list to a copy of the q object
		find : function (strQuery) {
			var qcopy = queries.copy(queries);
			var arrResult = [];
			queries.iterate.call(this,function () {
				var arrSubResult = [].slice.call(this.querySelectorAll(strQuery));
				arrResult = arrResult.concat(arrSubResult);
			});
			if (!arrResult.length)
				arrResult = [].slice.call(document.querySelectorAll(strQuery));
			if (arrResult.length) {
				for (var i=0; i!=arrResult.length; i++) {
					qcopy[i] = arrResult[i];
				}
			}
			return qcopy;
		},
		// Duplicates an object ( Workin progress )
		copy : function (obj) {
			if (null == obj || "object" != typeof obj) return obj;
			var copy = obj.constructor();
			for (var attr in obj) {
				if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
			}
			return copy;
		},
		// Finds the top left position of a dom object
		pos : function () {
			var element = this[0];
			var top = 0, left = 0;
			do {
				top += element.offsetTop  || 0;
				left += element.offsetLeft || 0;
				element = element.offsetParent;
			} while(element);
			return {
				top: top,
				left: left
			};
		},
		css : function (objCss) {
			queries.iterate.call(this,function () {
				for (var strKey in objCss) {
					this.style[strKey] = objCss[strKey];
				}
			});
			return this;
		},
		attr : function (strKey, strVal) {
			if (!strVal)
				return this[0][strKey];
			queries.iterate.call(this,function () {
				this.setAttribute(strKey, strVal);
			});
			return this;
		},
		removeAttr : function (strKey, strVal) {
			queries.iterate.call(this,function () {
				this.removeAttribute(strKey, strVal);
			});
			return this;
		},
		bind : function (strEvents, fnCallback) {
			var arrEvents = strEvents.split(/ /);
			queries.iterate.call(this,function () {
				var node = this;
				q(arrEvents).each(function () {
					node['on' + this] = fnCallback;
				});
			});
			return this;
		},
		each : function (fnCallback) {
			queries.iterate.call(this,function () {
				fnCallback.call(this);
			});
			return this;
		},
		append : function (mixedVar) {
			var item = typeof mixedVar == 'string' ? q(mixedVar) : mixedVar;
			queries.iterate.call(this,function () {
				var node = this;
				queries.iterate.call(item,function () {
					node.appendChild(this);
				});
			});
			return this;
		}
	};
	return queries.init(strQuery);
};
