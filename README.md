# keyEvent+

Key listener that returns all keys, including special characters, solves international keyboards compatibility in some scenarios.

## How to use

### Installing
```
npm install key-event-plus
```

### Function
`keyEventListener(ms, callback)`

*ms* is the millisseconds between each update

*callback* is the callback function

### Using
```
var keyEventListener = require('key-event-plus');

window.onload = function() {
	keyEventListener(20, key => console.log(key));
}
```
