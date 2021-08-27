import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import { useIntl, FormattedMessage } from 'react-intl';

import About from './about';
import BibliographySection from './bibliographySection';
import Brand from './brand';
import Button from './ui/button';
import CiteTools from './cite-tools';
import ConfirmAddDialog from './confirm-add-dialog';
import Confirmation from './confirmation';
import CopyCitationDialog from './copy-citation-dialog';
import Editor from './editor';
import ExportTools from './export-tools';
import Footer from './footer';
import Icon from './ui/icon';
import Message from './message';
import Modal from './modal';
import MultipleChoiceDialog from './multiple-choice-dialog';
import MultipleItemDialog from './multiple-items-dialog';
import PermalinkTools from './permalink-tools';
import Review from './review';
import StyleInstaller from './style-installer';
import WhatsThis from './whats-this';
import { pick } from '../immutable';

const commonFormats = {
	b: (chunks) => <b>{chunks}</b>, //eslint-disable-line react/display-name
	i: (chunks) => <i>{chunks}</i>, //eslint-disable-line react/display-name
};

const ZBib = props => {
	const [userType, setUserType] = useState({
		isKeyboardUser: false,
		isMouseUser: true,
		isTouchUser: false
	});
	const lastTouchStartEvent = useRef(0);
	const intl = useIntl();

	const className = {
		'zotero-bib-container': true,
		'keyboard-user': userType.isKeyboardUser,
		'mouse-user': userType.isMouseUser,
		'touch-user': userType.isTouchUser,
		'read-only': props.isReadOnly,
		'write': !props.isReadOnly,
		'welcome': props.messages.some(m => m.kind === 'WELCOME_MESSAGE'),
	};

	const handleKeyboard = useCallback(ev => {
		if(ev.key === 'Tab') {
			setUserType({ isKeyboardUser: true, isMouseUser: false, isTouchUser: false });
		}
	}, []);

	const handleMouse = useCallback(ev => {
		// prevent simulated mouse events triggering mouse user
		if(ev.timeStamp - lastTouchStartEvent.current > 300) {
			setUserType({ isKeyboardUser: false, isMouseUser: true, isTouchUser: false });
		}
	}, []);

	const handleTouch = useCallback(ev => {
		lastTouchStartEvent.current = ev.timeStamp;
		setUserType({ isKeyboardUser: false, isMouseUser: false, isTouchUser: true });
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
	}, []); //eslint-disable-line react-hooks/exhaustive-deps

	return (
		<div className={ cx(className) }>
			<div className="zotero-bib-inner">
				<div className="messages">
					{ props.messages.map(message => (
						<Message
							{ ...message }
							{ ...pick(props, ['onDismiss', 'onUndoDelete', 'onReadMore', 'onShowDuplicate'])}
							key={ message.id }
						/>
						))
					}
				</div>

				{
					!props.isReadOnly && (
						<section className="section section-cite">
							<nav className="meta-nav">
								<a onClick={ props.onHelpClick }>
									<FormattedMessage id="zbib.help" defaultMessage="Help" />
								</a>
								<a href="https://www.zotero.org">Zotero</a>
							</nav>
							<div className="container">
								<Brand />
								<CiteTools { ...pick(props, ['isTranslating', 'onEditorOpen', 'onTranslationCancel', 'onTranslationRequest', 'identifier']) } />
							</div>
						</section>
					)
				}
				{(!props.isReadOnly && (props.isTranslating || props.itemUnderReview)) && (
					<Review { ...pick(props, ['isTranslating', 'itemUnderReview', 'onReviewEdit', 'onReviewDelete', 'onReviewDismiss', 'styleHasBibliography']) } />
				)}
				<BibliographySection { ...pick(props, ['bibliography', 'isReadOnly', 'isReady',
					'localCitationsCount', 'onOverride', 'onTitleChanged', 'title', 'citationStyle',
					'citationStyles', 'onCitationStyleChanged', 'isPrintMode', 'isHydrated',
					'isNoteStyle', 'isNumericStyle', 'onCitationCopyDialogOpen', 'onDeleteEntry',
					'onDeleteCitations', 'onEditorOpen', 'onCancelPrintMode', 'styleHasBibliography']) }
				/>
				{
					<section className="section section-export">
						<div className="container">
							<h2>
								<FormattedMessage id="zbib.export" defaultMessage="Export" />
							</h2>
							<ExportTools { ...pick(props, ['bibliography', 'getCopyData',
								'onDownloadFile', 'isReadOnly', 'onSaveToZoteroShow']) }
							/>
						</div>
					</section>
				}

				{
					!props.isReadOnly && (
						<section className="section section-link">
							<div className="container">
								<h2>
									<FormattedMessage id="zbib.linkToThis" defaultMessage="Link to this version" />
									<WhatsThis />
								</h2>
								<PermalinkTools { ...pick(props, ['bibliography', 'onSave', 'permalink']) } />
							</div>
						</section>
					)
				}

				{
					props.isReadOnly && (
						<section className="section section-brand">
							<div className="container">
								<Brand />
							</div>
						</section>
					)
				}

				{
					!props.isReadOnly && (
						<About onGetStartedClick={ props.onGetStartedClick } />
					)
				}

				<Footer />

				<Confirmation
					isOpen={ props.activeDialog === 'CONFIRM_SENTENCE_CASE_STYLE' }
					onConfirm={ props.onStyleSwitchConfirm }
					onCancel={ props.onStyleSwitchCancel }
					title={ intl.formatMessage({ id: 'zbib.confirmCase.title', defaultMessage:'Converting Titles to Sentence Case' }) }
					confirmLabel={ intl.formatMessage({ id: 'zbib.confirmCase.confirm', defaultMessage: 'OK, I’ll Edit Them' }) }
				>
					<p>
						<FormattedMessage id="zbib.confirmCase.explanation" defaultMessage="The
						style you’ve selected requires titles to be in sentence case rather than
						title case. When you use this style, ZoteroBib will convert the titles of
						entries to sentence case for you, but you’ll need to manually edit some
						entries to capitalize proper nouns:" />
					</p>

					<p>
						<FormattedMessage
							id="zbib.confirmCase.titleCaseExample"
							defaultMessage="<b>Title case:</b> <i>Circadian Mood Variations in Twitter Content</i>"
							values={ commonFormats }
						/>
					</p>
					<p>
						<FormattedMessage
							id="zbib.confirmCase.conversionExample"
							defaultMessage="<b>ZoteroBib conversion:</b> <i>Circadian mood variations in twitter content</i>"
							values={ commonFormats }
						/>
					</p>
					<p>
						<FormattedMessage
							id="zbib.confirmCase.sentenceCaseExample"
							defaultMessage="<b>Sentence case:</b> <i>Circadian mood variations in <r>T</r>witter content</i>"
							values={ { ...commonFormats, r: chunk => <span style={{color: '#e52e3d', fontWeight: 'bold'}}>{ chunk }</span> } } //eslint-disable-line react/display-name
						/>
					</p>
				</Confirmation>
				<Modal
					isOpen={ props.activeDialog === 'SAVE_TO_ZOTERO' }
					onRequestClose={ props.onSaveToZoteroHide }
					className={ cx('modal modal-centered') }
				>
					<div className="modal-content" tabIndex={ -1 }>
						<div className="modal-header">
							<h4 className="modal-title text-truncate">
								<FormattedMessage id="zbib.saveToZotero.title" defaultMessage="Save to Zotero" />
							</h4>
							<Button
								icon
								className="close"
								onClick={ props.onSaveToZoteroHide }
							>
								<Icon type={ '24/remove' } width="24" height="24" />
							</Button>
						</div>
						<div className="modal-body">
							<p>
								<FormattedMessage
								id="zbib.saveToZotero.message"
								defaultMessage="Once you’ve <a>installed Zotero and the Zotero
								Connector</a>, you can export your bibliography to Zotero by
								clicking the “Save to Zotero” button in your browser’s toolbar."
								values= { {
									a: chunk => <a target="_blank" rel="noopener noreferrer" href="https://www.zotero.org/download/">{ chunk }</a> //eslint-disable-line react/display-name
								} }
							/>
							</p>
						</div>
					</div>
				</Modal>
				<CopyCitationDialog { ...pick(props, ['activeDialog', 'citationHtml',
					'citationCopyModifiers', 'isNoteStyle', 'onCitationCopy', 'onCitationCopyDialogClose',
					'onCitationModifierChange']) }
				/>
				<Editor { ...pick(props, ['activeDialog', 'editorItem', 'onEditorClose',
					'onError', 'onItemCreated', 'onItemUpdate']) }
				/>
				<MultipleChoiceDialog { ...pick(props, ['activeDialog',
					'isTranslatingMore', 'moreItemsLink', 'multipleChoiceItems',
					'onMultipleChoiceCancel', 'onMultipleChoiceMore', 'onMultipleChoiceSelect']) }
				/>
				<StyleInstaller { ...pick(props, ['activeDialog', 'citationStyle',
					'citationStyles', 'isStylesDataLoading', 'onStyleInstallerCancel',
					'onStyleInstallerDelete', 'onStyleInstallerSelect', 'stylesData']) } />
				<ConfirmAddDialog { ...pick(props, ['activeDialog', 'onConfirmAddCancel',
					'onConfirmAddConfirm', 'itemToConfirm', 'styleHasBibliography']) } />
				<MultipleItemDialog { ...pick(props, ['activeDialog', 'multipleItems',
					'multipleChoiceItems', 'onMultipleItemsCancel', 'onMultipleItemsSelect']) } />
			</div>
		</div>
	);
}

ZBib.propTypes = {
	activeDialog: PropTypes.string,
	citationHtml: PropTypes.string,
	citationToCopy: PropTypes.string,
	errorMessage: PropTypes.string,
	isConfirmingStyleSwitch: PropTypes.bool,
	isReadOnly: PropTypes.bool,
	isSaveToZoteroVisible: PropTypes.bool,
	isTranslating: PropTypes.bool,
	itemUnderReview: PropTypes.object,
	itemUnderReviewBibliography: PropTypes.object,
	lastDeletedItem: PropTypes.object,
	messages: PropTypes.array.isRequired,
	onCitationCopy: PropTypes.func.isRequired,
	onCitationModifierChange: PropTypes.func.isRequired,
	onDismiss: PropTypes.func.isRequired,
	onGetStartedClick: PropTypes.func,
	onHelpClick: PropTypes.func.isRequired,
	onReadMore: PropTypes.func.isRequired,
	onSaveToZoteroHide: PropTypes.func.isRequired,
	onStyleSwitchCancel: PropTypes.func.isRequired,
	onStyleSwitchConfirm: PropTypes.func.isRequired,
	onUndoDelete: PropTypes.func.isRequired,
}

export default memo(ZBib);
