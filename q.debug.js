q.type = function (mixedVar) {
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
	if(mixedVar.jquery) {
		return 'jquery';
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
}
q.alert = function (mixedValue) {
	if (this.isJavascriptQ && !mixedValue)
		mixedValue = this[0];
	var recursion = function(obj, level) {
		var strDel = "\t";
		if(!level) level = 0;
		var dump = '', p = '';
		for(i = 0; i < level; i++) p += strDel;
		t = q.type(obj);
		switch(t) {
			 case "string":
				return '"' + obj + '"';
				break;
			 case "number":
				return obj.toString();
				break;
			 case "boolean":
				return obj ? 'true' : 'false';
			 case "date":
				return "Date: " + obj.toLocaleString();
			 case "array":
				dump += 'Array[' + obj.length + '] ( \n';
				q.each(obj, function(k,v) {
				   dump += p + strDel + k + ' => ' + recursion(v, level + 1) + '\n';
				});
				dump += p + ')';
				break;
			 case "object":
				dump += 'Object [' + Object.keys(obj).length + '] { \n';
				q.each(obj, function(k,v) {
				   dump += p + strDel + k + ': ' + recursion(v, level + 1) + '\n';
				});
				dump += p + '}';
				break;
			 case "jquery":
				dump += 'jQuery Object [' + Object.keys(obj).length + '] { \n';
				q.each(obj, function(k,v) {
				   dump += p + strDel + k + ' = ' + recursion(v, level + 1) + '\n';
				});
				dump += p + '}';
				break;
			 case "regexp":
				return "RegExp: " + obj.toString();
			 case "error":
				return obj.toString();
			 case "document":
			 case "domelement":
				dump += 'DOMElement [ \n';
				var arrSimpleItems = ['id','src','nodeName','type','className','name','value','checked','action','method','target'];
				for (intKey in arrSimpleItems)
				{
					if (obj[arrSimpleItems[intKey]])
						dump += p + strDel + arrSimpleItems[intKey] + ': ' + obj[arrSimpleItems[intKey]] + '\n';
				}
				var strCSS = q.css.call(obj);
				if (strCSS.length)
					dump += p + strDel + 'style: ' + q.css.call(obj) + '\n';
				if (obj.childNodes.length)
				{
					dump += p + strDel + 'innerHTML [' + obj.childNodes.length + ']: [ \n';
					var offset = 0;
					for (i3 in obj.childNodes)
					{
						var v = obj.childNodes[i3];
						if(q.type(v) == "string") {
							if(v.textContent.match(/[^\s]/))
								dump += p + strDel + strDel + (i3-offset) + ' = String: ' + q.trim(v.textContent) + '\n';
							else
								offset++;
						} else {
							dump += p + strDel + strDel + (i3-offset) + ' = ' + recursion(v, level + 2) + '\n';
						}
					}
					dump += p + strDel + ']\n';
				}
				dump += p + ']';
				break;
			 case "function":
				var match = obj.toString().match(/^(.*)\(([^\)]*)\)/im);
				match[1] = q.trim(match[1].replace(new RegExp("[\\s]+", "g"), " "));
				match[2] = q.trim(match[2].replace(new RegExp("[\\s]+", "g"), " "));
				return match[1] + "(" + match[2] + ")";
			 case "window":
			 default:
				dump += 'N/A: ' + t;
				break;
		}

		return dump;
	};
	alert(recursion(mixedValue));
};
