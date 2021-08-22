import cx from 'classnames';
import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useRef, useState, memo } from 'react';
import { useIntl, FormattedMessage } from 'react-intl';

import Button from './ui/button';
import Input from './form/input';
import Modal from './modal';
import Select from './form/select';
import Spinner from './ui/spinner';

const locators = [
	'page', 'book', 'chapter', 'column', 'figure', 'folio', 'issue', 'line', 'note', 'opus',
	'paragraph', 'part', 'section', 'sub verbo', 'verse', 'volume'
].map(locator => ({
	value: locator,
	label: locator[0].toUpperCase() + locator.slice(1)
}));

const CopyCitationDialog = props => {
	const { activeDialog, citationHtml, citationCopyModifiers, isNoteStyle, onCitationCopy,
	onCitationCopyDialogClose, onCitationModifierChange } = props;
	const [isCopied, setIsCopied] = useState(false);
	const timeout = useRef(null);
	const intl = useIntl();
	const title = isNoteStyle ?
		intl.formatMessage({ id: 'zbib.citation.copyNote' , defaultMessage: 'Copy Note' }) :
		intl.formatMessage({ id: 'zbib.citation.copyCitation', defaultMessage: 'Copy Citation' });

	let isCitationEmpty = false;

	if(typeof citationHtml === 'string') {
		isCitationEmpty = citationHtml
			.replace(/<[^>]*>/g, '')
			.trim()
			.length === 0;
	}

	const handleLabelChange = useCallback(
		newValue => onCitationModifierChange({ ...citationCopyModifiers, label: newValue }),
	[citationCopyModifiers, onCitationModifierChange]);

	const handleLocatorChange = useCallback(
		newValue => onCitationModifierChange({ ...citationCopyModifiers, locator: newValue }),
	[citationCopyModifiers, onCitationModifierChange]);

	const handleSuppressAuthorChange = useCallback(
		ev => onCitationModifierChange({ ...citationCopyModifiers, mode: ev.currentTarget.checked ? 'SuppressAuthor' : undefined }),
	[citationCopyModifiers, onCitationModifierChange]);

	const handleCancel = useCallback(() => {
		if(timeout.current) {
			clearTimeout(timeout.current);
			timeout.current = null;
		}
		onCitationCopyDialogClose();
	}, [onCitationCopyDialogClose]);

	const handleConfirm = useCallback(() => {
		if(onCitationCopy()) {
			setIsCopied(true);
			timeout.current = setTimeout(() => {
				onCitationCopyDialogClose();
				setIsCopied(false);
			}, 1000);
		}
	}, [onCitationCopy, onCitationCopyDialogClose]);

	const handleInputCommit = useCallback((_val, _hasChanged, ev) => {
		if(ev.type === 'keydown') {
			handleConfirm();
			ev.preventDefault();
		}
	}, [handleConfirm]);

	useEffect(() => {
		setIsCopied(false);
	}, [activeDialog]);

	useEffect(() => {
		return () => {
			if(timeout.current) {
				clearTimeout(timeout.current);
				timeout.current = null;
			}
		}
	}, []);

	return (
		<Modal
			className={ cx('modal modal-centered copy-citation-dialog', { loading: !citationHtml }) }
			isOpen={ activeDialog === 'COPY_CITATION' }
			contentLabel={ title }
			onRequestClose={ onCitationCopyDialogClose }
		>
			{ citationHtml ? (
				<div className="modal-content" tabIndex={ -1 }>
				<div className="modal-body">
					<div className="form-row form-group">
						<div className="col-xs-6">
							<Select
								name="label"
								clearable={ false }
								isDisabled={ isCopied }
								onChange={ () => true }
								onCommit={ handleLabelChange }
								options={ locators }
								searchable={ false}
								tabIndex={ 0 }
								value={ citationCopyModifiers.label || 'page' }
								className="form-control form-control-sm"
							/>
							</div>
						<div className="col-xs-6">
							<Input
								name="locator"
								autoFocus
								isDisabled={ isCopied }
								onChange={ handleLocatorChange }
								onCommit={ handleInputCommit }
								tabIndex={ 0 }
								value={ citationCopyModifiers.locator }
								className="form-control form-control-sm"
								placeholder="Number"
							/>
						</div>
					</div>
					{ !isNoteStyle && (
						<div className="form-group">
							<div className="checkbox">
								<label>
									<input
										disabled={ isCopied }
										type="checkbox"
										checked={ citationCopyModifiers.mode === 'SuppressAuthor' }
										onChange={ handleSuppressAuthorChange }
									/>
									<FormattedMessage id="zbib.citation.omitAuthor" defaultMessage="Omit Author" />
								</label>
							</div>
						</div>
					) }
					<div>
						<h5>
							<FormattedMessage id="zbib.citation.preview" defaultMessage="Preview:" />
						</h5>
						<p
							className="preview"
							dangerouslySetInnerHTML={ { __html: citationHtml } }
						/>
					</div>
				</div>
				<div className="modal-footer">
					<div className="buttons">
						<Button
							className="btn-outline-secondary"
							onClick={ handleCancel }
						>
							<FormattedMessage id="zbib.general.cancel" defaultMessage="Cancel" />
						</Button>
						<Button
							disabled={ isCitationEmpty }
							className={ cx('btn-secondary', { 'success': isCopied}) }
							onClick={ handleConfirm }
						>
							<span className={ cx('inline-feedback', { 'active': isCopied }) }>
								<span className="default-text" aria-hidden={ !isCopied }>
								{ title }
								</span>
								<span className="shorter feedback" aria-hidden={ isCopied }>
									<FormattedMessage id="zbib.citation.copiedFeedback" defaultMessage="Copied!" />
									Copied!
								</span>
							</span>
						</Button>
					</div>
				</div>
				</div>
			) : <Spinner /> }
		</Modal>
	);
}

CopyCitationDialog.propTypes = {
	citationCopyModifiers: PropTypes.object,
	citationHtml: PropTypes.string,
	activeDialog: PropTypes.string,
	isNoteStyle: PropTypes.bool,
	onCitationCopy: PropTypes.func.isRequired,
	onCitationCopyDialogClose: PropTypes.func.isRequired,
	onCitationModifierChange: PropTypes.func.isRequired,
}

export default memo(CopyCitationDialog);
