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
import Spinner from './ui/spinner';
import StyleInstaller from './style-installer';
import UserTypeDetector from '../enhancers/user-type-detector';
import WhatsThis from './whats-this';
import Footer from './footer';

class ZBib extends React.PureComponent {
	get className() {
		return {
			'zotero-bib-container': true,
			'loading': typeof this.props.isReadOnly === 'undefined',
			'keyboard-user': this.props.isKeyboardUser,
			'mouse-user': this.props.isMouseUser,
			'touch-user': this.props.isTouchUser,
			'read-only': this.props.isReadOnly,
			'write': !this.props.isReadOnly,
			'welcome': this.props.messages.some(m => m.isWelcomeMessage),
		};
	}

	handleClearMessage(message) {
		this.props.onClearMessage(message);
	}

	handleHelp(event) {
		this.props.onHelpClick(event);
	}

	render() {
		return (
			!this.props.isReady
				?	<div className={ cx(this.className) }>
						<Spinner />
					</div>
				:	<div className={ cx(this.className) }>
						<div className="zotero-bib-inner">
							<div className="messages">
								{ this.props.messages.map(message => (
									<Message
										key={ message.id }
										onDismiss={ this.handleClearMessage.bind(this, message) }
										{ ...message }
									/>
									))
								}
							</div>

							{
								!this.props.isReadOnly && (
									<section className="section section-cite">
										<nav className="meta-nav">
											<a onClick={ this.handleHelp.bind(this) }>Help</a>
											<a href="https://www.zotero.org">Zotero</a>
										</nav>
										<div className="container">
											<Brand />
											<CiteTools { ...this.props } />
										</div>
									</section>
								)
							}
							<Review { ...this.props} />
							<BibliographySection { ...this.props} />

							{
								<section className="section section-export">
									<div className="container">
										<h2>Export</h2>
										<ExportTools { ...this.props } />
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
											<PermalinkTools { ...this.props } />
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
									<About { ...this.props } />
								)
							}

							<Footer />

							<Confirmation
								isOpen={ this.props.isConfirmingStyleSwitch }
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
								isOpen={ this.props.isSaveToZoteroVisible }
								onRequestClose={ () => this.props.onSaveToZoteroHide() }
								className={ cx('modal modal-centered') }
							>
								<div className="modal-content" tabIndex={ -1 }>
									<div className="modal-header">
										<h4 className="modal-title text-truncate">
											Save to Zotero
										</h4>
										<Button
											className="close"
											onClick={ this.props.onSaveToZoteroHide.bind(this) }
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
							<CopyCitationDialog { ...this.props} />
							<Editor { ...this.props } />
							<MultipleChoiceDialog { ...this.props } />
							<StyleInstaller { ...this.props } />
							<ConfirmAddDialog { ...this.props } />
							<MultipleItemDialog { ...this.props } />
						</div>
					</div>
		);
	}

	static propTypes = {
		citationHtml: PropTypes.string,
		citationToCopy: PropTypes.string,
		errorMessage: PropTypes.string,
		isConfirmingStyleSwitch: PropTypes.bool,
		isKeyboardUser: PropTypes.bool,
		isMouseUser: PropTypes.bool,
		isReadOnly: PropTypes.bool,
		isReady: PropTypes.bool,
		isSaveToZoteroVisible: PropTypes.bool,
		isTouchUser: PropTypes.bool,
		itemUnderReviewBibliography: PropTypes.object,
		lastDeletedItem: PropTypes.object,
		messages: PropTypes.array.isRequired,
		onCitationCopy: PropTypes.func.isRequired,
		onCitationModifierChange: PropTypes.func.isRequired,
		onClearMessage: PropTypes.func.isRequired,
		onDismissUndo: PropTypes.func.isRequired,
		onHelpClick: PropTypes.func.isRequired,
		onSaveToZoteroHide: PropTypes.func.isRequired,
		onStyleSwitchCancel: PropTypes.func.isRequired,
		onStyleSwitchConfirm: PropTypes.func.isRequired,
		onUndoDelete: PropTypes.func.isRequired,
	}
}

export default withRouter(UserTypeDetector(ZBib));
