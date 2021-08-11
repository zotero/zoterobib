import React, { useCallback, useEffect, useRef, useState, memo } from 'react';
import PropTypes from 'prop-types';

import Input from './form/input';
import Button from './ui/button';
import { usePrevious } from '../hooks';

const canCancel = typeof(AbortController) === 'function';

const CiteTools = ({ identifier, isTranslating, onEditorOpen, onTranslationCancel, onTranslationRequest }) => {
	const inputRef = useRef(null);
	const [value, setValue] = useState(identifier);
	const prevIdentifier = usePrevious(identifier);
	const wasTranslating = usePrevious(isTranslating)

	const handleChange = useCallback(newValue => {
		setValue(newValue);
	}, []);

	const handleCiteOrCancel = useCallback(() => {
		if(isTranslating) {
			onTranslationCancel();
		} else if(value.length > 0 && !isTranslating) {
			onTranslationRequest(value);
		}
	}, [value, isTranslating, onTranslationCancel, onTranslationRequest]);

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
		<div className="cite-tools">
			<div className="id-input-container">
				<Input
					autoFocus
					className="form-control form-control-lg id-input"
					isBusy={ isTranslating }
					onBlur={ () => true /* do not commit on blur */ }
					onChange={ handleChange }
					onCommit={ handleCiteOrCancel }
					placeholder="Enter a URL, ISBN, DOI, PMID, arXiv ID, or title"
					ref = { inputRef }
					tabIndex={ 0 }
					type="text"
					value={ value }
				/>
				<Button
					className="btn-lg btn-secondary"
					onClick={ handleCiteOrCancel }
				>
					{ (isTranslating && canCancel) ? 'Cancel' : 'Cite' }
				</Button>
			</div>
			<Button onClick={ onEditorOpen }
				className="btn-sm btn-outline-secondary"
			>
				Manual Entry
			</Button>
		</div>
	);
}

CiteTools.propTypes = {
	identifier: PropTypes.string,
	isTranslating: PropTypes.bool,
	onEditorOpen: PropTypes.func.isRequired,
	onTranslationCancel: PropTypes.func.isRequired,
	onTranslationRequest: PropTypes.func.isRequired,
}


export default memo(CiteTools);
