import cx from 'classnames';
import PropTypes from 'prop-types';
import React, { useCallback, useState, memo } from 'react';

import Bibliography from './bibliography';
import Button from './ui/button';
import Confirmation from './confirmation';
import DeleteAllButton from './delete-all-button';
import Editable from './ui/editable';
import Icon from './ui/icon';
import Spinner from './ui/spinner';
import StyleSelector from './style-selector';
import { pick } from '../immutable'

const BibliographySection = props => {
	const { bibliography, isReadOnly, isReady, localCitationsCount, onOverride, onTitleChanged, title } = props;
	const [isConfirmingOverride, setIsConfirmingOverride] = useState(false);
	const [isEditingTitle, setIsEditingTitle] = useState(false);

	const handleTitleEdit = useCallback(() => {
		setIsEditingTitle(true);
	}, []);

	const handleTitleCommit = useCallback((newValue, hasChanged) => {
		if(hasChanged) {
			onTitleChanged(newValue);
		}
		setIsEditingTitle(false);
	}, [onTitleChanged]);

	const handleTitleCancel = useCallback(() => {
		setIsEditingTitle(false);
	}, []);

	const handleEditBibliography = useCallback(() => {
		if(localCitationsCount > 0) {
			setIsConfirmingOverride(true);
		} else {
			onOverride();
		}
	}, [localCitationsCount, onOverride]);

	const handleOverride = useCallback(() => {
		onOverride();
	}, [onOverride]);

	const handleCancel = useCallback(() => {
		setIsConfirmingOverride(false);
	}, []);

	return (
		<section
			className={ cx('section', 'section-bibliography',
				{ 'loading': !isReady, 'empty': isReady && bibliography.items.length === 0 })
			}
		>
			<div className="container">
				{ (isReady && bibliography.items.length === 0) ? (
					<React.Fragment>
						<img className="empty-bibliography" src="static/images/empty-bibliography.svg" width="320" height="200" />
						<h2 className="empty-title"><span style={{ 'letterSpacing': '-0.092em' }}>Y</span>our bibliography is empty.</h2>
						<p className="lead empty-lead"><span style={{ 'letterSpacing': '-0.111em' }}>T</span>o add a source, paste or type its URL, ISBN, DOI, PMID, arXiv ID, or title into the search box above.</p>
					</React.Fragment>
				) : (
					<React.Fragment>
						{
							isReadOnly ? (
								<h1 className="h2 bibliography-title">
									{ title || 'Bibliography' }
								</h1>
							) : (
								<h2 onClick={ handleTitleEdit }
									onFocus={ handleTitleEdit }
									tabIndex={ isEditingTitle ? null : 0 }
									className="bibliography-title"
								>
									<Editable
										placeholder="Bibliography"
										value={ title || '' }
										isActive={ isEditingTitle }
										onCommit={ handleTitleCommit }
										onCancel={ handleTitleCancel }
										autoFocus
										selectOnFocus
									/>
									<Button icon>
										<Icon type={ '28/pencil' } width="28" height="28" />
									</Button>
								</h2>
							)
						}
						{
							!isReadOnly && <StyleSelector { ...props } />
						}
						{
							isReady ? <Bibliography { ...pick(props, ['isNoteStyle',
							'isNumericStyle', 'isReadOnly', 'bibliography',
							'onCitationCopyDialogOpen', 'onDeleteEntry', 'onEditorOpen',
							'styleHasBibliography'])} /> : (
								<div className="spinner-container">
									<Spinner />
								</div>
							)
						}
						{
							!isReadOnly && isReady && <DeleteAllButton { ...props } />
						}
						<Confirmation
							isOpen={ isReadOnly && isConfirmingOverride }
							onConfirm={ handleOverride }
							onCancel={ handleCancel }
							title="Clear existing bibliography?"
							confirmLabel="Continue"
							>
								<p>
									There is an existing bibliography with { localCitationsCount } { localCitationsCount > 1 ? 'entries' : 'entry' } in the editor. If you continue, the existing bibliography will be replaced with this one.
								</p>
						</Confirmation>
					</React.Fragment>
				)
			}
			{ (isReady && isReadOnly) && (
				<Button
					onClick={ handleEditBibliography }
					className="btn-sm btn-outline-secondary">
					Edit Bibliography
				</Button>
			) }
			</div>
		</section>
	);
}


BibliographySection.propTypes = {
	bibliography: PropTypes.object,
	isReadOnly: PropTypes.bool,
	isReady: PropTypes.bool,
	localCitationsCount: PropTypes.number,
	onOverride: PropTypes.func.isRequired,
	onTitleChanged: PropTypes.func.isRequired,
	title: PropTypes.string,
}

export default memo(BibliographySection);
