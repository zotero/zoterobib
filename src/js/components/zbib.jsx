'use strict';

const React = require('react');
const PropTypes = require('prop-types');
const { withRouter } = require('react-router-dom');
const cx = require('classnames');

const About = require('./about');
const BibliographySection = require('./bibliographySection');
const Brand = require('./brand');
const Button = require('zotero-web-library/src/js/component/ui/button');
const CiteTools = require('./cite-tools');
const Confirmation = require('./confirmation');
const CopyCitationDialog = require('./copy-citation-dialog');
const Editor = require('./editor');
const ExportTools = require('./export-tools');
const Icon = require('zotero-web-library/src/js/component/ui/icon');
const Message = require('./message');
const Modal = require('./modal');
const MultipleChoiceDialog = require('./multiple-choice-dialog');
const MultipleItemDialog = require('./multiple-items-dialog');
const ConfirmAddDialog = require('./confirm-add-dialog');
const PermalinkTools = require('./permalink-tools');
const Review = require('./review');
const Spinner = require('zotero-web-library/src/js/component/ui/spinner');
const StyleInstaller = require('./style-installer');
const UserTypeDetector = require('zotero-web-library/src/js/enhancers/user-type-detector');
const WhatsThis = require('./whats-this');
const Footer = require('./footer');
const StyleSelector = require('./style-selector');
const AdvertisementAlpha = require('./advertisement-alpha');


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
			typeof this.props.isReadOnly === 'undefined'
				? <div className={cx(this.className)}>
					<Spinner />
				</div>
				: <div className={cx(this.className)}>
					<div className="zotero-bib-inner">
						<div className="messages">
							{this.props.messages.map(message => (
								<Message
									key={message.id}
									onDismiss={this.handleClearMessage.bind(this, message)}
									{...message}
								/>
							))
							}
						</div>
						<div className="fullwidth-container">
							<div className="row">
								<div className="col content">
									{
										!this.props.isReadOnly && (
											<section className="section section-cite">
														
												<div className="container">
													<Brand />
													<h3>Citation style</h3>
													<StyleSelector {...this.props} />
													<h3>Enter query</h3>
													<CiteTools {...this.props} />
													<Review {...this.props} />
												</div>
											</section>
										)
									}
								</div>
								<div className="col ad">
									<aside>
										<div className="billboard">
											<AdvertisementAlpha {...this.props} />
										</div>
									</aside>
								</div>
								<div className="col bibl">
									<BibliographySection {...this.props} />
									<section className="section section-export">
										<div className="container">
											<h2>Export</h2>
											<ExportTools {...this.props} />
										</div>
									</section>
								</div>
							</div>
						</div>
						<div className="container">

															
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
							
						</div>
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
								<About {...this.props} />
							)
						}

						<Footer />

						<Confirmation
							isOpen={this.props.isConfirmingStyleSwitch}
							onConfirm={this.props.onStyleSwitchConfirm}
							onCancel={this.props.onStyleSwitchCancel}
							title="Converting Titles to Sentence Case"
							confirmLabel="OK, I’ll Edit Them"
						>
							<p>The style you’ve selected requires titles to be in sentence case
							rather than title case. When you use this style, it will
							convert the titles of entries to sentence case for you, but you’ll
								need to manually edit some entries to capitalize proper nouns:</p>

							<p><b>Title case:</b> <i>Circadian Mood Variations in Twitter Content</i></p>
							<p><b>Conversion:</b> <i>Circadian mood variations in twitter content</i></p>
							<p><b>Sentence case:</b> <i>Circadian mood variations in <span style={{ color: '#e52e3d', fontWeight: 'bold' }}>T</span>witter content</i></p>
						</Confirmation>
						<Modal
							isOpen={this.props.isSaveToZoteroVisible}
							onRequestClose={() => this.props.onSaveToZoteroHide()}
							className={cx('modal modal-centered')}
						>
							<div className="modal-content" tabIndex={-1}>
								<div className="modal-header">
									<h4 className="modal-title text-truncate">
										Save to Zotero
										</h4>
									<Button
										className="close"
										onClick={this.props.onSaveToZoteroHide.bind(this)}
									>
										<Icon type={'24/remove'} width="24" height="24" />
									</Button>
								</div>
								<div className="modal-body">
									<p>Once you’ve <a target="_blank" rel="noopener noreferrer" href="https://www.zotero.org/download/">installed Zotero and the Zotero Connector</a>,
										you can export your bibliography to Zotero by clicking the “Save to Zotero” button in your browser’s toolbar.</p>
								</div>
							</div>
						</Modal>
						<CopyCitationDialog {...this.props} />
						<Editor {...this.props} />
						<MultipleChoiceDialog {...this.props} />
						<StyleInstaller {...this.props} />
						<ConfirmAddDialog {...this.props} />
						<MultipleItemDialog {...this.props} />
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
		isSaveToZoteroVisible: PropTypes.bool,
		isTouchUser: PropTypes.bool,
		itemUnderReviewBibliography: PropTypes.object,
		lastDeletedItem: PropTypes.object,
		messages: PropTypes.array.isRequired,
		onCitationCopy: PropTypes.func.isRequired,
		onCitationCopyCancel: PropTypes.func.isRequired,
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

module.exports = withRouter(UserTypeDetector(ZBib));
