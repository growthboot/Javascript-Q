QueryChain Library
----------------
is a very small JavaScript library intended to reduce the data transfer and memory usage on your websites or apps compared to most standard libraries avialable. Our main goals behind this library is to maintain a very small core library that can be used to build a very dynamic UI easily while maintaining its ability to be expanded on with plugins. In most cases the just QueryChain core should be all that is needed to build a fully dynamic and ajax website UI.

## Setup
Include QueryChain q.js file into the head of your html document.
```html
<script src="q.js"></script>
```

## QueryChain core examples

### Document ready
```javascript
q(function () {
  alert('The document has finished loading.');
})
```

### Access all h3 dom objects and remove them
```javascript
q("h3").remove()
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
