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
  alert('The document has finished loading.');
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
