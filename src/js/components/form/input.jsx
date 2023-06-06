import cx from 'classnames';
import PropTypes from 'prop-types';
import React, { forwardRef, memo, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { noop, pick } from 'web-common/utils';
import { usePrevious } from 'web-common/hooks';
import { Spinner } from 'web-common/components';


const NATIVE_INPUT_PROPS = ['autoFocus', 'form', 'id', 'inputMode', 'max', 'maxLength',
'min', 'minLength', 'name', 'placeholder', 'type', 'spellCheck', 'step', 'tabIndex'];

const Input = memo(forwardRef((props, ref) => {
	const { className = 'form-control', inputGroupClassName, isBusy, isDisabled, isReadOnly,
	isRequired, onBlur = noop, onCancel = noop, onCommit = noop, onChange = noop, onFocus = noop,
	onKeyDown = noop, selectOnFocus, validationError, value: initialValue, ...rest } = props;
	const [value, setValue] = useState(initialValue || '');
	const input = useRef(null);
	const prevInitialValue = usePrevious(initialValue);
	const prevValidationError = usePrevious(validationError);

	const hasBeenCancelled = useRef(false);
	const hasBeenCommitted = useRef(false);

	//reset on every render
	hasBeenCancelled.current = false;
	hasBeenCommitted.current = false;

	const groupClassName = cx({
		'input-group': true,
		'input': true,
		'busy': isBusy
	}, inputGroupClassName);

	useImperativeHandle(ref, () => ({
		focus: () => {
			input.current.focus();
			if(selectOnFocus) {
				input.current.select();
			}
		}
	}));

	const handleChange = useCallback(ev => {
		setValue(ev.currentTarget.value);
		onChange(ev.currentTarget.value);
	}, [onChange]);

	const handleBlur = useCallback(ev => {
		if(ev.relatedTarget && ev.relatedTarget?.dataset?.suggestion) {
			return;
		}
		if (hasBeenCancelled.current || hasBeenCommitted.current) {
			return;
		}
		const shouldCancel = onBlur(event);
		if(shouldCancel) {
			onCancel(value !== initialValue, ev);
			input.current.blur();
		} else {
			onCommit(value, value !== initialValue, ev);
		}
	}, [initialValue, onBlur, onCancel, onCommit, value]);

	const handleFocus = useCallback(ev => {
		if(selectOnFocus) {
			ev.currentTarget.select();
		}
		onFocus(ev);
	}, [onFocus, selectOnFocus]);

	const handleKeyDown = useCallback(ev => {
		switch (event.key) {
			case 'Escape':
				onCancel(ev, value !== initialValue, ev);
				input.current.blur();
			break;
			case 'Enter':
				onCommit(value, value !== initialValue, ev);
			break;
		}
		onKeyDown(ev);
	}, [initialValue, onCancel, onCommit, onKeyDown, value])

	useEffect(() => {
		if(initialValue !== prevInitialValue) {
			setValue(initialValue);
		}
	}, [initialValue, prevInitialValue]);

	useEffect(() => {
		if(validationError !== prevValidationError && input.current.setCustomValidity) {
			input.current.setCustomValidity(validationError ? validationError : '');
		}
	}, [validationError, prevValidationError]);

	const inputProps = {
		className,
		disabled: isDisabled,
		onBlur: handleBlur,
		onChange: handleChange,
		onFocus: handleFocus,
		onKeyDown: handleKeyDown,
		readOnly: isReadOnly,
		ref: input,
		required: isRequired,
		value,
		...pick(rest, NATIVE_INPUT_PROPS),
		...pick(rest, key => key.match(/^(aria-|data-|on[A-Z]).*/))
	};

	var inputComponent = <input { ...inputProps } />;

	return (
		<div className={ groupClassName }>
			{ inputComponent }
			{ isBusy ? <Spinner /> : null }
		</div>
	);
}));

Input.displayName = 'Input';

Input.propTypes = {
	className: PropTypes.string,
	inputGroupClassName: PropTypes.string,
	isBusy: PropTypes.bool,
	isDisabled: PropTypes.bool,
	isReadOnly: PropTypes.bool,
	isRequired: PropTypes.bool,
	onBlur: PropTypes.func,
	onCancel: PropTypes.func,
	onChange: PropTypes.func,
	onCommit: PropTypes.func,
	onFocus: PropTypes.func,
	onKeyDown: PropTypes.func,
	selectOnFocus: PropTypes.bool,
	validationError: PropTypes.string,
	value: PropTypes.string,
};

export default Input;
