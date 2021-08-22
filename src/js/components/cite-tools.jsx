import React, { useCallback, useEffect, useRef, useState, memo } from 'react';
import PropTypes from 'prop-types';
import { useIntl, FormattedMessage } from 'react-intl';

import Input from './form/input';
import Button from './ui/button';
import { usePrevious } from '../hooks';

const canCancel = typeof(AbortController) === 'function';

const CiteTools = ({ identifier, isTranslating, onEditorOpen, onTranslationCancel, onTranslationRequest }) => {
	const inputRef = useRef(null);
	const [entry, setEntry] = useState(identifier);
	const prevIdentifier = usePrevious(identifier);
	const wasTranslating = usePrevious(isTranslating)
	const intl = useIntl();

	const handleChange = useCallback(newValue => {
		setEntry(newValue);
	}, []);

	const handleCiteOrCancel = useCallback(() => {
		if(isTranslating) {
			onTranslationCancel();
		} else if(entry.length > 0 && !isTranslating) {
			onTranslationRequest(entry);
		}
	}, [entry, isTranslating, onTranslationCancel, onTranslationRequest]);

	const handlePaste = useCallback((ev) => {
		const clipboardData = ev.clipboardData || window.clipboardData;
		const pastedData = clipboardData.getData('Text');

		if(!pastedData.includes('\n')) {
			return;
		}

		ev.preventDefault();
		setEntry(pastedData);
		onTranslationRequest(pastedData, null, false, true);

	}, [onTranslationRequest]);

	useEffect(() => {
		if(typeof(prevIdentifier !== 'undefined') && identifier !== prevIdentifier) {
			setEntry(identifier);
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
					isReadOnly={ isTranslating }
					onBlur={ () => true /* do not commit on blur */ }
					onChange={ handleChange }
					onCommit={ handleCiteOrCancel }
					onPaste={ handlePaste }
					placeholder={ intl.formatMessage({ id: 'zbib.citePrompt' , defaultMessage: 'Enter a URL, ISBN, DOI, PMID, arXiv ID, or title' })}
					ref = { inputRef }
					tabIndex={ 0 }
					type="text"
					value={ entry }
				/>
				<Button
					className="btn-lg btn-secondary"
					onClick={ handleCiteOrCancel }
				>
					{ (isTranslating && canCancel) ?
						<FormattedMessage id="zbib.general.cancel" defaultMessage="Cancel" /> :
						<FormattedMessage id="zbib.general.cite" defaultMessage="Cite" />
					}
				</Button>
			</div>
			<Button onClick={ onEditorOpen }
				className="btn-sm btn-outline-secondary"
			>
				<FormattedMessage id="zbib.manualEntry" defaultMessage="Manual Entry" />
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
