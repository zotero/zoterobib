import { useCallback, useEffect, useRef, useState } from 'react';

const keysToTriggerKeyboardMode = ['Tab', 'ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp'];
const isInitiallyMouse = typeof (matchMedia) === 'function' ? matchMedia('(pointer:fine)').matches : null;
const isInitiallyTouch = typeof (matchMedia) === 'function' ? matchMedia('(pointer:coarse)').matches : null;

const useUserTypeDetector = () => {
	const lastTouchStartEvent = useRef(0);
	const [userType, setUserType] = useState({ mouse: isInitiallyMouse, touch: isInitiallyTouch, keyboard: false});

	const handleKeyboard = useCallback(ev => {
		if (keysToTriggerKeyboardMode.includes(ev.key)) {
			if(ev.target.nodeName.toLowerCase() === 'input' && ev.key !== 'Tab') {
				// also ignore key strokes other than tab on input fields
				return;
			}
			setUserType(state => state.keyboard ? state : { ...state, keyboard: true });
		}
	}, []);

	const handleMouse = useCallback(ev => {
		// prevent simulated mouse events triggering mouse user
		if (!lastTouchStartEvent.current || ev.timeStamp - lastTouchStartEvent.current > 500) {
			setUserType(state => (state.mouse && !state.touch) ? state : { ...state, mouse: true, touch: false });
		}
	}, []);

	const handleTouch = useCallback(ev => {
		lastTouchStartEvent.current = ev.timeStamp;
		setUserType(state => (!state.mouse && state.touch) ? state : { ...state, mouse: false, touch: true });
	}, []);

	useEffect(() => {
		document.addEventListener('keyup', handleKeyboard);
		document.addEventListener('mousedown', handleMouse);
		document.addEventListener('touchstart', handleTouch);

		return () => {
			document.removeEventListener('keyup', handleKeyboard);
			document.removeEventListener('mousedown', handleMouse);
			document.removeEventListener('touchstart', handleTouch);
		}
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	return userType;
}

export { useUserTypeDetector };
