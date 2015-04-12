QueryChain Library
----------------
is a very small JavaScript library intended to reduce the data transfer and memory usage on your websites or apps compared to most standard libraries avialable. Our main goals behind this library is to maintain a very small core that can be used to build a dynamic UI easily while maintaining its ability to be expanded on with plugins. In most cases the just QueryChain core should be all that is needed to build a fully dynamic and ajax website UI.

## Setup
Include QueryChain q.js file into the head of your html document.
```html
<script src="q.js"></script>
```

## QueryChain q.js Examples

### Document ready
```javascript
q(function () {
  console.log('The document has finished loading.');
})
```

### Access all h3 dom objects and remove them
```javascript
q("h3").remove();
```

### Iterate each dom object found and change their color
```javascript
q("h3").each(function () {
  q(this).css({
    "background-color" : "#000",
    "color" : "#fff"
  });
});
```

### Get the dimentions of an object
```html
<div id="my_div01" style="width:20px;height:25px"></div>
```
```javascript
q("#my_div01").width(); // returns: 20px
q("#my_div01").height(); // returns: 25px
```

### Get the position of an object
```javascript
q("#my_div01").top(); // returns how many pixels there are from the top of the document
q("#my_div01").left(); // returns how many pixels there are from the left of the document
q("#my_div01").bottom(); // returns the top position + the element height
q("#my_div01").right(); // returns the left position + the element width
```


### Find all checkboxes from a specific point inside the dom
```javascript
var container =  q("#my_container01");
var allDivs = container.find("input[type='checkbox']");
```

### Search backwords up the dom tree for the closest element that matches a selection
```javascript
var container =  q("#my_container01");
var closeestTable = container.closest("table");
```

### Check if a specific element matches a selection
```html
<div id="my_div01" class="some_class"></div>
```
```javascript
var container =  q("#my_div01");
if (container.is('div.some_class')) {
  // Returns true because the element has the class some_class and is a DIV
}
```

### Set / get attributes on elements
Set a signle attribute
```javascript
q("#my_div01").attr('any_attribute', 'any_value');
```
Set multipule attributes
```javascript
q("#my_div01").attr({
  'multiple_attrs' : 'can_be_set',
  'some_key' : 'some_value'
});
```
Get the value of an attribute
```javascript
console.log("Some key: " + q("#my_div01").attr("some_key")); // outputs: Some key: some_value
```

### Set / get css on elements
Set a signle style on an element
```javascript
q("#my_div01").css('color', '#000');
```
Set multipule styles on multiple elements
```javascript
q("#my_div01 h3").css({
  'color' : '#fff',
  'background-color' : '#000'
});
```
Get the value of a style on an element
```javascript
console.log("Color: " + q("#my_div01").css("color")); // outputs: Color: #000
```

### Make an ajax get request
```javascript
q.request({
	url : 'test-ajax.php',
	success : function (strResponse) {
		console.log('Response: ' + strResponse);
	}
});
```
### Make an ajax post request
```javascript
q.request({
	url : 'test-ajax.php',
	post : {
		'test_key' : 'test_value'
	},
	success : function (strResponse) {
		console.log('Response: ' + strResponse);
	}
});
```
### Create a post using form feilds from a specific part of the dom tree
```html
<form>
	<input type="hidden" name="test1" value="value1" />
	<input type="button" name="test2" value="value2" />
	<input type="text" name="test3" value="value3" />
	<input type="checkbox" checked="checked" name="test4" value="value4" />
	<input type="checkbox" name="test5" value="value5" />
	<input type="radio" name="test6" value="value6_1" />
	<input type="radio" name="test6" checked="checked" value="value6_2" />
	<input type="radio" name="test6" value="value6_3" />
	<input type="text" name="test7" value="value7_1" />
	<input type="text" name="test7" value="value7_2" />
	<input type="submit" name="test8" value="value8" />
	<input type="text" name="test10" value="" />
	<textarea name="test11">value11</textarea>
	<button>test button 1</button>
	<button name="test9">test button 2</button>
</form>
```
```javascript
q.request({
	url : 'test-ajax.php',
	post : q('form').serialize(), // serialization response: test1=value1&test3=value3&test4=value4&test6=value6_2&test7=value7_1&test7=value7_2&test10=&test11=value11
	success : function (strResponse) {
	  
	}
});
```

### List of methods
- **css**: Add styles on any selection `q("p").css("padding":"5px")` or `q("p").css({"paddding","5px","color","#333"})`.
- **each**: Iterate a selection from the DOM `q("p").each(function () {...})`, iterate an object `q.each(obj,function (k,v) {...})`.
- **closest**: Search up the DOM tree until a selection is reached `q(".headline").closest(".section")`.
- **extend**: Combine an object into another object combining their keys and values `q.extend({123:321},{abc:"cba"})` results in `{123:321,abc:"cba"}`.
- **trim**: Remove any spaces from the start and end of a string `q.trim(" abc  ")` results in "abc".
- **ltrim**: Remove any spaces from the start of a string `q.trim(" abc  ")` results in "abc  ".
- **rtrim**: Remove any spaces from the end of a string `q.trim(" abc  ")` results in " abc".
- **functionTrim**: Remove all items from a specific point on function index. For example  `q('div').functionTrim(0)` would empty the QueryChain selection. 
