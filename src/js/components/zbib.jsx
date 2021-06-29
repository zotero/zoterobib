import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';
import cx from 'classnames';

import About from './about';
import BibliographySection from './bibliographySection';
import Brand from './brand';
import Button from './ui/button';
import CiteTools from './cite-tools';
import Confirmation from './confirmation';
import CopyCitationDialog from './copy-citation-dialog';
import Editor from './editor';
import ExportTools from './export-tools';
import Icon from './ui/icon';
import Message from './message';
import Modal from './modal';
import MultipleChoiceDialog from './multiple-choice-dialog';
import MultipleItemDialog from './multiple-items-dialog';
import ConfirmAddDialog from './confirm-add-dialog';
import PermalinkTools from './permalink-tools';
import Review from './review';
import StyleInstaller from './style-installer';
import UserTypeDetector from '../enhancers/user-type-detector';
import WhatsThis from './whats-this';
import Footer from './footer';
import { pick } from '../immutable';

class ZBib extends React.PureComponent {
	get className() {
		return {
			'zotero-bib-container': true,
			'keyboard-user': this.props.isKeyboardUser,
			'mouse-user': this.props.isMouseUser,
			'touch-user': this.props.isTouchUser,
			'read-only': this.props.isReadOnly,
			'write': !this.props.isReadOnly,
			'welcome': this.props.messages.some(m => m.kind === 'WELCOME_MESSAGE'),
		};
	}

	render() {
		return (
			<div className={ cx(this.className) }>
				<div className="zotero-bib-inner">
					<div className="messages">
						{ this.props.messages.map(message => (
							<Message
								{ ...message }
								key={ message.id }
								onDismiss = { this.props.onDismiss }
								onUndoDelete = { this.props.onUndoDelete }
								onReadMore = { this.props.onReadMore }
							/>
							))
						}
					</div>

					{
						!this.props.isReadOnly && (
							<section className="section section-cite">
								<nav className="meta-nav">
									<a onClick={ this.props.onHelpClick }>Help</a>
									<a href="https://www.zotero.org">Zotero</a>
								</nav>
								<div className="container">
									<Brand />
									<CiteTools { ...pick(this.props, ['isTranslating', 'onEditorOpen', 'onTranslationRequest', 'identifier']) } />
								</div>
							</section>
						)
					}
					{(this.props.isTranslating || this.props.itemUnderReview) && (
						<Review { ...pick(this.props, ['isTranslating', 'itemUnderReview', 'onReviewEdit', 'onReviewDelete', 'onReviewDismiss', 'styleHasBibliography']) } />
					)}
					<BibliographySection { ...pick(this.props, ['bibliography', 'isReadOnly',
						'isReady', 'localCitationsCount', 'onOverride', 'onTitleChanged', 'title',
						'citationStyle', 'citationStyles', 'onCitationStyleChanged', 'isNoteStyle',
						'isNumericStyle', 'onCitationCopyDialogOpen', 'onDeleteEntry',
						'onDeleteCitations', 'onEditorOpen', 'styleHasBibliography']) }
					/>
					{
						<section className="section section-export">
							<div className="container">
								<h2>Export</h2>
								<ExportTools { ...pick(this.props, ['bibliography', 'getCopyData',
									'getFileData', 'isReadOnly', 'onSaveToZoteroShow']) }
								/>
							</div>
						</section>
					}

					{
						!this.props.isReadOnly && (
							<section className="section section-link">
								<div className="container">
									<h2>
										Link to this version
										<WhatsThis />
									</h2>
									<PermalinkTools { ...pick(this.props, ['bibliography', 'onSave', 'permalink']) } />
								</div>
							</section>
						)
					}

					{
						this.props.isReadOnly && (
							<section className="section section-brand">
								<div className="container">
									<Brand />
								</div>
							</section>
						)
					}

					{
						!this.props.isReadOnly && (
							<About onGetStartedClick={ this.props.onGetStartedClick } />
						)
					}

					<Footer />

					<Confirmation
						isOpen={ this.props.activeDialog === 'CONFIRM_SENTENCE_CASE_STYLE' }
						onConfirm={ this.props.onStyleSwitchConfirm }
						onCancel={ this.props.onStyleSwitchCancel }
						title="Converting Titles to Sentence Case"
						confirmLabel="OK, I’ll Edit Them"
					>
						<p>The style you’ve selected requires titles to be in sentence case
						rather than title case. When you use this style, ZoteroBib will
						convert the titles of entries to sentence case for you, but you’ll
						need to manually edit some entries to capitalize proper nouns:</p>

						<p><b>Title case:</b> <i>Circadian Mood Variations in Twitter Content</i></p>
						<p><b>ZoteroBib conversion:</b> <i>Circadian mood variations in twitter content</i></p>
						<p><b>Sentence case:</b> <i>Circadian mood variations in <span style={{color: '#e52e3d', fontWeight: 'bold'}}>T</span>witter content</i></p>
					</Confirmation>
					<Modal
						isOpen={ this.props.activeDialog === 'SAVE_TO_ZOTERO' }
						onRequestClose={ this.props.onSaveToZoteroHide }
						className={ cx('modal modal-centered') }
					>
						<div className="modal-content" tabIndex={ -1 }>
							<div className="modal-header">
								<h4 className="modal-title text-truncate">
									Save to Zotero
								</h4>
								<Button
									icon
									className="close"
									onClick={ this.props.onSaveToZoteroHide }
								>
									<Icon type={ '24/remove' } width="24" height="24" />
								</Button>
							</div>
							<div className="modal-body">
								<p>Once you’ve <a target="_blank" rel="noopener noreferrer" href="https://www.zotero.org/download/">installed Zotero and the Zotero Connector</a>,
								you can export your bibliography to Zotero by clicking the “Save to Zotero” button in your browser’s toolbar.</p>
							</div>
						</div>
					</Modal>
					<CopyCitationDialog { ...pick(this.props, ['activeDialog', 'citationHtml',
						'citationCopyModifiers', 'isNoteStyle', 'onCitationCopy', 'onCitationCopyDialogClose',
						'onCitationModifierChange']) }
					/>
					<Editor { ...pick(this.props, ['activeDialog', 'editorItem', 'onEditorClose',
						'onError', 'onItemCreated', 'onItemUpdate']) }
					/>
					<MultipleChoiceDialog { ...pick(this.props, ['activeDialog',
						'isTranslatingMore', 'moreItemsLink', 'multipleChoiceItems',
						'onMultipleChoiceCancel', 'onMultipleChoiceMore', 'onMultipleChoiceSelect']) }
					/>
					<StyleInstaller { ...pick(this.props, ['activeDialog', 'citationStyle',
						'citationStyles', 'isStylesDataLoading', 'onStyleInstallerCancel',
						'onStyleInstallerDelete', 'onStyleInstallerSelect', 'stylesData']) } />
					<ConfirmAddDialog { ...pick(this.props, ['activeDialog', 'onConfirmAddCancel',
						'onConfirmAddConfirm', 'itemToConfirm', 'styleHasBibliography']) } />
					<MultipleItemDialog { ...pick(this.props, ['activeDialog', 'multipleItems',
						'multipleChoiceItems', 'onMultipleItemsCancel', 'onMultipleItemsSelect']) } />
				</div>
			</div>
		);
	}

	static propTypes = {
		activeDialog: PropTypes.string,
		citationHtml: PropTypes.string,
		citationToCopy: PropTypes.string,
		errorMessage: PropTypes.string,
		isConfirmingStyleSwitch: PropTypes.bool,
		isKeyboardUser: PropTypes.bool,
		isMouseUser: PropTypes.bool,
		isReadOnly: PropTypes.bool,
		isSaveToZoteroVisible: PropTypes.bool,
		isTouchUser: PropTypes.bool,
		itemUnderReviewBibliography: PropTypes.object,
		lastDeletedItem: PropTypes.object,
		messages: PropTypes.array.isRequired,
		onCitationCopy: PropTypes.func.isRequired,
		onCitationModifierChange: PropTypes.func.isRequired,
		onDismiss: PropTypes.func.isRequired,
		onHelpClick: PropTypes.func.isRequired,
		onReadMore: PropTypes.func.isRequired,
		onSaveToZoteroHide: PropTypes.func.isRequired,
		onStyleSwitchCancel: PropTypes.func.isRequired,
		onStyleSwitchConfirm: PropTypes.func.isRequired,
		onUndoDelete: PropTypes.func.isRequired,
	}
}

export default withRouter(UserTypeDetector(ZBib));
