# keyEvent+
<p>
  <img src="https://img.shields.io/npm/v/key-event-plus.svg?orange=blue" />
  <a href="https://github.com/jeeanribeiro/key-event-plus/blob/master/LICENSE" target="_blank">
    <img alt="License: MIT" src="https://img.shields.io/github/license/jeeanribeiro/key-event-plus" />
  </a>
  <a href="https://twitter.com/jeeanribeiro" target="_blank">
    <img alt="Twitter: jeeanribeiro" src="https://img.shields.io/twitter/follow/jeeanribeiro.svg?style=social" />
  </a>
</p>

Key listener that returns all keys, including special characters, solves international keyboards compatibility in some scenarios.

## How to use

### Installing
```
npm install key-event-plus
```

### Function
`keyEventListener(ms, callback)`

`ms` is the millisseconds between each update

`callback` is the callback function

The returned object in callback function has the `key` attribute and the `state` attribute that can have the `down` or `up` value

### Using
```
var keyEventListener = require('key-event-plus');

window.onload = function() {
	keyEventListener(20, key => console.log(key));
}
```
