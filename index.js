module.exports = (ms, callback) => {

	let keyPress = {}, keyUpDown = {}, keyPlus = {}, isUpdatable = false;

	const keyPressListener = () => {
		document.addEventListener('keypress', event => {
			keyPress = {
				key: event.key,
				code: event.code,
			}
		})
	}
	keyPressListener();

	const keyDownListener = () => {
		document.addEventListener('keydown', event => {
			keyUpDown = {
				key: event.key,
				code: event.code,
				state: 'down',
			}
		})
	}
	keyDownListener();

	const keyUpListener = () => {
		document.addEventListener('keyup', event => {
			keyUpDown = {
				key: event.key,
				code: event.code,
				state: 'up',
			}
		})
	}
	keyUpListener();

	const updateKeyPlus = () => {
		if (keyPress.code === keyUpDown.code) {
			keyPlus.key = keyPress.key;
			keyPlus.state = keyUpDown.state;
		} else {
			keyPlus.key = keyUpDown.key;
			keyPlus.state = keyUpDown.state;
		}
		return keyPlus;
	}

	const keyListenerLoop = () => {
		const hasKeyChanged = keyPlus.key !== keyPress.key && keyPlus.key !== keyUpDown.key;
		const hasStateChanged = keyPlus.state !== keyUpDown.state;

		if (hasKeyChanged || hasStateChanged) {
			callback(updateKeyPlus());
		}
		setTimeout(keyListenerLoop, ms);
	}
	keyListenerLoop();
};
