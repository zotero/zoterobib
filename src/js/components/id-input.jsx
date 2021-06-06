import React, { useCallback, useEffect, useRef, useState, memo } from 'react';
import PropTypes from 'prop-types';
import Input from './form/input';
import Button from './ui/button';
import { usePrevious } from '../hooks';

const IdInput = ({ identifier, isTranslating, onTranslationRequest }) => {
	const inputRef = useRef(null);
	const [value, setValue] = useState(identifier);
	const prevIdentifier = usePrevious(identifier);
	const wasTranslating = usePrevious(isTranslating)

	const handleChange = useCallback(newValue => {
		setValue(newValue);
	}, []);

	const handleCite = () => {
		if(value.length > 0 && !isTranslating) {
			onTranslationRequest(value);
		}
	}

	useEffect(() => {
		if(typeof(prevIdentifier !== 'undefined') && identifier !== prevIdentifier) {
			setValue(identifier);
		}
	}, [identifier, prevIdentifier]);

	useEffect(() => {
		if(wasTranslating && !isTranslating) {
			inputRef.current.focus();
		}
	}, [isTranslating, wasTranslating]);

	return (
		<div className="id-input-container">
			<Input
				autoFocus
				className="form-control form-control-lg id-input"
				isBusy={ isTranslating }
				onBlur={ () => true /* do not commit on blur */ }
				onChange={ handleChange }
				onCommit={ handleCite }
				placeholder="Enter a URL, ISBN, DOI, PMID, arXiv ID, or title"
				ref = { inputRef }
				tabIndex={ 0 }
				type="text"
				value={ value }
			/>
			<Button
				className="btn-lg btn-secondary"
				onClick={ handleCite }
			>
				Cite
			</Button>
		</div>
	);
}

IdInput.propTypes = {
	identifier: PropTypes.string,
	isTranslating: PropTypes.bool,
	onTranslationRequest: PropTypes.func.isRequired,
}

export default memo(IdInput);
