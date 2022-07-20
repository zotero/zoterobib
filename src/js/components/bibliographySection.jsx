import cx from 'classnames';
import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useRef, useState, memo } from 'react';
import { FormattedMessage } from 'react-intl';

import Bibliography from './bibliography';
import Button from './ui/button';
import Confirmation from './confirmation';
import DeleteAllButton from './delete-all-button';
import Editable from './ui/editable';
import Icon from './ui/icon';
import PlaceholderBibliography from './placeholder-bibliography';
import Spinner from './ui/spinner';
import StyleSelector from './style-selector';
import { pick } from '../immutable'
import { usePrevious } from '../hooks';

const BibliographySection = props => {
	const { isPrintMode, isReadOnly, isReady, isHydrated, localCitationsCount, onOverride,
	onCancelPrintMode, onTitleChanged, title } = props;
	const shouldOverrideWhenReady = useRef(false);
	const [isConfirmingOverride, setIsConfirmingOverride] = useState(false);
	const [isEditingTitle, setIsEditingTitle] = useState(false);
	const wasReady = usePrevious(isReady);

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

	const handleOverride = useCallback(() => {
		if(isReady) {
			onOverride();
		} else if(isHydrated) {
			shouldOverrideWhenReady.current = true;
		}
	}, [isReady, isHydrated, onOverride]);


	const handleEditBibliography = useCallback(() => {
		if(isPrintMode) {
			onCancelPrintMode();
		} else {
			if(localCitationsCount > 0) {
				setIsConfirmingOverride(true);
			} else {
				handleOverride();
			}
		}
	}, [isPrintMode, handleOverride, localCitationsCount, onCancelPrintMode]);

	const handleCancel = useCallback(() => {
		setIsConfirmingOverride(false);
	}, []);

	useEffect(() => {
		if(isReady && !wasReady && shouldOverrideWhenReady.current) {
			shouldOverrideWhenReady.current = false;
			onOverride();
		}
	}, [isReady, wasReady, onOverride]);

	return (
		<section
			className={ cx('section', 'section-bibliography',
				{ 'loading': !isReady && !isHydrated, 'empty': !isReadOnly && localCitationsCount === 0 })
			}
		>
			<div className="container" suppressHydrationWarning={ true }>
				{ (!isReadOnly && localCitationsCount === 0) ? (
					<React.Fragment>
						<img className="empty-bibliography" src="static/images/empty-bibliography.svg" width="320" height="200" />
						<h2 className="empty-title">
							<FormattedMessage
								wrapRichTextChunksInFragment={ true }
								id="zbib.bibliography.emptyTitle"
								defaultMessage='<i>Y</i>our bibliography is empty.'
								values={ {
									i: chunks => <span style={{ 'letterSpacing': '-0.092em' }}>{chunks}</span>, //eslint-disable-line react/display-name
								}}
							/>
						</h2>
						<p className="lead empty-lead">
							<FormattedMessage
								wrapRichTextChunksInFragment={ true }
								id="zbib.bibliography.emptyLead"
								defaultMessage='<i>T</i>o add a source, paste or type its URL, ISBN, DOI, PMID, arXiv ID, or title into the search box above'
								values={ {
									i: chunks => <span style={{ 'letterSpacing': '-0.111em' }}>{chunks}</span>, //eslint-disable-line react/display-name
								}}
							/>
						</p>
					</React.Fragment>
				) : (
					<React.Fragment>
						{
							isReadOnly ? (
								title && (
									<h1 className="h2 bibliography-title">
										{ title }
									</h1>
								)
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
							!isReadOnly && <StyleSelector { ...pick(props, ['citationStyle', 'citationStyles', 'onCitationStyleChanged']) } />
						}
						{ (isHydrated && !isReady) ? (
							<PlaceholderBibliography itemCount={ props.hydrateItemsCount } />
						) : isReady ? (
							<Bibliography { ...pick(props, ['isNoteStyle', 'isNumericStyle',
							'hydrateItemsCount', 'isSortedStyle', 'isReadOnly', 'bibliography',
							'onCitationCopyDialogOpen', 'onDeleteEntry', 'onEditorOpen',
							'onReorderCitations', 'styleHasBibliography'])} />
						) : (
							<div className="spinner-container">
								<Spinner />
							</div>
						) }
						{
							!isReadOnly && (isReady || isHydrated) && (
								<DeleteAllButton
									bibliographyCount={ props.bibliography.items.length }
									{ ...pick(props, ['onDeleteCitations']) }
								/>
							)
						}
						<Confirmation
							isOpen={ isReadOnly && isConfirmingOverride }
							onConfirm={ handleOverride }
							onCancel={ handleCancel }
							title="Clear existing bibliography?"
							confirmLabel="Continue"
							>
								<p>
									<FormattedMessage
										id="zbib.bibliography.override"
										defaultMessage="There is an existing bibliography with {localCitationsCount, plural,
											one {# entry}
											other {# entries}
											} in the editor. If you continue, the existing bibliography will be replaced with this one."
										values={ { localCitationsCount } }
									/>
								</p>
						</Confirmation>
					</React.Fragment>
				)
			}
			{ ((isReady || isHydrated) && isReadOnly) && (
				<Button
					onClick={ handleEditBibliography }
					className="btn-sm btn-outline-secondary btn-edit-bibliography">
					<FormattedMessage id="zbib.bibliography.edit" defaultMessage="Edit Bibliography" />
				</Button>
			) }
			</div>
		</section>
	);
}


BibliographySection.propTypes = {
	bibliography: PropTypes.object,
	isHydrated: PropTypes.bool,
	isPrintMode: PropTypes.bool,
	isReadOnly: PropTypes.bool,
	isReady: PropTypes.bool,
	localCitationsCount: PropTypes.number,
	onOverride: PropTypes.func.isRequired,
	onCancelPrintMode: PropTypes.func.isRequired,
	onTitleChanged: PropTypes.func.isRequired,
	title: PropTypes.string,
}

export default memo(BibliographySection);
