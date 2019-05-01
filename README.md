## VERSION
2.048

JavaScript Q Library
----------------
This is a small JavaScript library intended to reduce the data transfer and memory usage on your websites or apps by reducing redundant and repetitive coding. The library takes advantage of HTML5 functionality in Javascript since it became standard to keep it's size small. The idea is websites that want to service customers using pre HTML5 browsers can do so using vanilla HTML since they make up a very small portion of the market.

## Features
 - Ultra lightweight
 - Cross browser compliant
 - GPU optimized animations
 - AJAX support
 - Traverse and manipulate the DOM
 - Event handling
 - Data to DOM storage
 - Object dimension and position processing
 - Added general functionality (rand, extend, mstime, etc...)

## Disadvantages
 - Only supported by HTML5 compliant browsers

## CDN
https://cdn.jsdelivr.net/gh/AugmentLogic/Javascript-Q@latest/q.js

## Setup
Include the library q.js file into the head of your html document.
```html
<script src="https://cdn.jsdelivr.net/gh/AugmentLogic/Javascript-Q@latest/q.js"></script>
```

## The library handle
The library is used and controlled using the $ variable by default. If you're using another library that uses the same handle there could be a conflict. You can choose to customize the handle variable name by setting a variable called JAVASCRIPT_Q_HANDLE before the q.js is loaded.

Example:
```html
<script>
	var JAVASCRIPT_Q_HANDLE = "q";
</script>
<script src="https://cdn.jsdelivr.net/gh/AugmentLogic/Javascript-Q@master/q.js"></script>
<script>
	q(function () {
		alert("I'm alive!");
	});
</script>
```

## q.js Examples

### Document ready
```javascript
$(function () {
  console.log('The document has finished loading.');
})
```

### Access all h3 DOM objects and remove them
```javascript
$("h3").remove();
```

### Iterate each DOM object found and change their color
```javascript
$("h3").each(function () {
  $(this).css({
    "background-color" : "#000",
    "color" : "#fff"
  });
});
```

### Get the dimensions of an object
```html
<div id="my_div01" style="width:20px;height:25px"></div>
```
```javascript
$("#my_div01").width(); // returns: 20px
$("#my_div01").height(); // returns: 25px
```

### Get the position of an object
```javascript
$("#my_div01").top(); // returns how many pixels there are from the top of the document
$("#my_div01").left(); // returns how many pixels there are from the left of the document
$("#my_div01").bottom(); // returns the top position + the element height
$("#my_div01").right(); // returns the left position + the element width
```


### Find all checkboxes from a specific point inside the DOM
```javascript
var container =  $("#my_container01");
var allDivs = container.find("input[type='checkbox']");
```

### Search backwords up the dom tree for the closest element that matches a selection
```javascript
var container =  $("#my_container01");
var closeestTable = container.closest("table");
```

### Check if a specific element matches a selection
```html
<div id="my_div01" class="some_class"></div>
```
```javascript
var container =  $("#my_div01");
if (container.is('div.some_class')) {
  // Returns true because the element has the class some_class and is a DIV
}
```

### Set / get attributes on elements
Set a single attribute
```javascript
$("#my_div01").attr('any_attribute', 'any_value');
```
Set multiple attributes
```javascript
$("#my_div01").attr({
  'multiple_attrs' : 'can_be_set',
  'some_key' : 'some_value'
});
```
Get the value of an attribute
```javascript
console.log("Some key: " + $("#my_div01").attr("some_key")); // outputs: Some key: some_value
```

### Set / get css on elements
Set a single style on an element
```javascript
$("#my_div01").css('color', '#000');
```
Set multiple styles on multiple elements
```javascript
$("#my_div01 h3").css({
  'color' : '#fff',
  'background-color' : '#000'
});
```
Get the value of a style on an element
```javascript
console.log("Color: " + $("#my_div01").css("color")); // outputs: Color: #000
```

### Make an ajax get request
```javascript
$.request({
	url : 'test-ajax.php',
	success : function (strResponse) {
		console.log('Response: ' + strResponse);
	}
});
```
### Make an ajax post request
```javascript
$.request({
	url : 'test-ajax.php',
	post : {
		'test_key' : 'test_value'
	},
	success : function (strResponse) {
		console.log('Response: ' + strResponse);
	}
});
```
### Get or set the scrollTop location
Get the scroll location of an object
```javascript
$("#idoftag").scrollTop()
```
Get the scroll location of the window
```javascript
$("body").scrollTop()
```
Set the scroll location of the window
```javascript
$("body").scrollTop(123)
```
Set the scroll location of the window based on the location of an object
```javascript
$("body").scrollTop("#idoftag");
```
Make the scrolling animate using the smooth scrolling effect provided by the browser
```javascript
$("body").scrollTop("#idoftag", "smooth");
```
Make the scrolling animate using a custom easing function and call a function when done
```javascript
$("body").scrollTop("#idoftag", 2000, 'easeOutExpo', fnDone);
```
### Create a post using form fields from a specific part of the DOM tree
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
$.request({
	url : 'test-ajax.php',
	post : $('form').serialize(), // serialization response: test1=value1&test3=value3&test4=value4&test6=value6_2&test7=value7_1&test7=value7_2&test10=&test11=value11
	success : function (strResponse) {
	  
	}
});
```

### List of methods
- **uniqueId**: Get a unique ID that represents a specific DOM element
- **find**: Search from any point in the DOM tree for a selection `some_element.find(".some_class")`.
- **get**: Get a specific item from the selection using its index `$(".sometags").get(2)`. Get the last time of the index `.get(-1)`.
- **become**: Simular functionality to get except it returns a new q selection rather than just the value. `$(".sometags").become(-1).remove()`
- **parent**: Get the parent of an element `$("...").parent()`.
- **children**: Get the children of the objects in the selection
- **next**: Get the next sibling of an element on the DOM tree `$("...").next()`.
- **prev**: Get the previous sibling of an element on the DOM tree `$("...").prev()`.
- **is**: Check if elements match a selection `some_elements.is(".some_class")` returns true if it matches the selection.
- **css**: Add styles on any selection `$("p").css("padding":"5px")` or `$("p").css({"paddding","5px","color","#333"})`. Get a specific style from an element `$('#my_element').css("width")`.
- **disableSelect**: Sets the CSS to disable text selection of the selected elements
- **html**: Change the inner HTML of any element `$("#my_element").html("<b>Some html</b>")` or get the inner HTML of an element `$("#my_element").html()`.
- **outer**: Change the outer HTML of any element `$("#my_element").outer("<b>Some html</b>")` or get the outer HTML of an element `$("#my_element").outer()`.
- **val**: Get the value of an input `$("#my_input").val()`.
- **text**: Change the inner text of any element `$("#my_element").text("Some text")`.
- **replaceWith**: Replace an element either some html `$("#my_element").html("<b>Some html</b>")`.
- **hasClass**: Check if elements has a specific css class attached to it
- **addClass**: Add a style sheet class to an element `$('h1').addClass("headline")`. Add multiple classes by separating them by spaces. Inject a CSS class into the DOM `$.addClass(".headline", {position:"absolute",top:0,left:0})`.
- **removeClass**: Remove a style sheet class from dom elements `$('h1').removeClass("headline")`.
- **attr**: Add an attribute to elements `$("#headline").attr("more_data", "value")`. Get the value of an attribute `$("#headline").attr("more_data")` returns `"value"`.
- **removeAttr**: Remove an attribute from elements `$("h3").removeAttr("more_data")`.
- **data**: Get and set any type of data from any dom element
- **bind**: Bind events to elements `$("body").bind("mouseover mouseout", function () {...})`.
- **on**: Shorthand for bind
- **unbind**: Unbind an event from elements `$("body").unbind("mouseover mouseout")`.
- **trigger**: Fire an event that was bund to an element `$("body").trigger("mouseover")`.
- **each**: Iterate a selection from the DOM `$("p").each(function () {...})`, iterate an object `$.each(obj,function (k,v) {...})`.
- **closest**: Search up the DOM tree until a selection is reached `$(".headline").closest(".section")`.
- **extend**: Combine an object into another object combining their keys and values `$.extend({123:321},{abc:"cba"})` results in `{123:321,abc:"cba"}`.
- **clone**: Clone a DOM element `$("#my_element").clone()`.
- **make**: Convert a string of html into a DOM object `$.make("<div><b>testing</b></div>")`. Another way to do the same thing `$("<div><b>testing</b></div>")`.
- **append**: Add elements on to the end of an element on the DOM tree `$("body").append("<div>testing</div>")`.
- **prepend**: Add elements on to the beginning of an element on the DOM tree `$("body").prepend("<div>testing</div>")`.
- **appendTo**: Append html to a selected element `$("<div>test</div>").appendTo("#tagtoappendto")`.
- **appendAfter**: Append html after a selected element `$("<div>test</div>").appendAfter("#foo")`.
- **appendBefore**: Append html before a selected element `$("<div>test</div>").appendBefore("#foo")`.
- **remove**: Remove elements from the the DOM tree `$("#my_element").remove()`.
- **position**: Return an object with the top and left position of an element `$("#my_element").pos()` example returns `{top:15px,left:15px}`.
- **offset**: Return an object with the top and left position of an element `$("#my_element").offset()` relative to the nearest `relative`, `absolute`, or `fixed` position.
- **offsetParent**: Find the nearest object with a `relative`, `absolute`, or `fixed` position.
- **scrollTop**: Get and set the scrolltop location
- **inViewY**: Get the amount of pixels of the object that are currently in view on the Y axis
- **left**: Returns the left position of an object and stores the top position in memory encase you need it `$("#my_element").left()`.
- **top**: Returns the top position of an object and stores the left position in memory encase you need it `$("#my_element").top()`.
- **right**: Combines left + width methods `$("#my_element").right()`.
- **bottom**: Combines top + height methods `$("#my_element").bottom()`.
- **width**: Get the width of an element `$("#my_element").width()`.
- **innerWidth**: Get the inner width of an element
- **height**: Get the height of an element `$("#my_element").height()`.
- **innerHeight**: Get the inner height of an element
- **trim**: Remove any spaces from the start and end of a string `$.trim(" abc  ")` results in "abc".
- **ltrim**: Remove any spaces from the start of a string `$.trim(" abc  ")` results in "abc  ".
- **rtrim**: Remove any spaces from the end of a string `$.trim(" abc  ")` results in " abc".
- **functionTrim**: Remove all items from a specific point on function index. For example  `$('div').functionTrim(0)` would empty the Q selection. 
- **mstime**: Get the current unix timestamp in milliseconds `$.mstime()`.
- **request**: Make an AJAX GET request `$.request({url:"...",success:function() {...}})` or a POST request `$.request({url:"...",post:{some_key:"some_value"},success:function() {...}})`.
- **serialize**: Serialize an array for a post string `$.serialize({some_key1:"some_value1",some_key2:"some_value2"})` returns `"some_key1=some_value1&some_key2=some_value2"`. Serialize all form elements from a specific point in the DOM tree `$("#some_element").serialize()`.
- **type**: Return what type an element is `$.type(some_variable)` could possibly return an one of these values `null, window, document, event, array, boolean, date, object, regexp, error, domelement, string or Unknown`
- **queue**: Turns on or off asynchronous animations and pauses (default off) `$("#foo").queue(true).animate(...).animate(...);
- **queueNext**: Jump to the next item in the queue
- **dequeue**: Turn of the animation queue
- **pause**: Pause the animation
- **play**: Resume the animation
- **stop**: Stop and reset the animation
- **delay**: Create a delay before the next animation sequence
- **animate**: CSS based Animation `$("#foo").animate({left:100})`

### List of tools
- **$.copy(obj)**: Copy an object
- **$.extend(obj1, obj2)**: Extend an object
- **$.hexToRgb(hexString)**: Change HAX to RGB `#0000FF` -> `0,0,255`
- **$.easing**: Access to the object with all easing functions `linear`, `easeInQuad`, `easeOutQuad`, `easeInOutQuad`, `easeInCubic`, `easeOutCubic`, `easeInOutCubic`, `easeInQuart`, `easeOutQuart`, `easeInOutQuart`, `easeInQuint`, `easeOutQuint`, `easeInOutQuint`, `easeInSine`, `easeOutSine`, `easeInOutSine`, `easeInExpo`, `easeOutExpo`, `easeInOutExpo`, `easeInCirc`, `easeOutCirc`, `easeInOutCirc`, `easeInElastic`, `easeOutElastic`, `easeInOutElastic`, `easeInBack`, `easeOutBack`, `easeInOutBack`, `easeInBounce`, `easeOutBounce`, `easeInOutBounce`
- **$.addCSS(name, obj)**: Add some CSS to the dom.
- **$.mstime()**: Get the current time in milliseconds
- **$.rand(min,max)**: Get a random number between to numbers
- **$.request(obj)**: Perform an AJAX request
- **$.delay(msTime, callbackFunction)**: perform a delay just like setTimeout

## FINAL NOTES
This library was created [for the Exitget platform](https://exitget.com/) because of the need for an ultra light weight library to use that also has super fast animation capabilities. It was needed to help bring down the code size for the customer facing resource that's used to generate popups on their client's sites. Exitget has been using and evolving this code for over 5 years now.
