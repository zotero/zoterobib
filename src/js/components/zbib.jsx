'use strict';

const React = require('react');
const PropTypes = require('prop-types');
const { withRouter } = require('react-router-dom');
const cx = require('classnames');

const Brand = require('./brand');
const BibliographySection = require('./bibliographySection');
const CiteTools = require('./cite-tools');
const Message = require('./message');
const ExportTools = require('./export-tools');
const PermalinkTools = require('./permalink-tools');
const Spinner = require('zotero-web-library/lib/component/ui/spinner');
const UserTypeDetector = require('zotero-web-library/lib/enhancers/user-type-detector');
const MultipleChoiceDialog = require('./multiple-choice-dialog');
const Confirmation = require('./confirmation');
const Editor = require('./editor');
const StyleInstaller = require('./style-installer');

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

	render() {
		return (
			typeof this.props.isReadOnly === 'undefined'
				?	<div className={ cx(this.className) }>
						<Spinner />
					</div>
				:	<div className={ cx(this.className) }>
						<div className="zotero-bib-inner">
							<div className="messages">
								{ this.props.messages.map(message => (
									<Message
										key={ message.message }
										onDismiss={ this.handleClearMessage.bind(this, message) }
										{ ...message }
									/>
									))
								}
							</div>

							{
								!this.props.isReadOnly && (
									<section className="section section-cite">
										<div className="container">
											<Brand />
											<CiteTools { ...this.props } />
										</div>
									</section>
								)
							}

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
											<h2>Link to this version</h2>
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

							<Confirmation
								isOpen={ this.props.isConfirmingStyleSwitch }
								onConfirm={ this.props.onStyleSwitchConfirm }
								onCancel={ this.props.onStyleSwitchCancel }
								title="Converting Titles to Sentence Case"
									confirmLabel="Continue"
								>
									<p>The selected citation style requires titles to be in sentence case rather
									than title case (e.g., “Circadian mood variations in Twitter content” rather
									than “Circadian Mood Variations in Twitter Content”). ZBib partially
									automates this for you by converting the titles of entries to sentence case.
									You will need to manually adjust your entries to capitalize proper nouns
									(e.g., “Twitter” in the above example) and, if the style requires it, the
									first word after the colon in subtitles.</p>

									<p>If you later switch to a citation style that requires title case, ZBib
									can automatically generate title-cased titles without changing your stored
									entries.</p>
							</Confirmation>
							<MultipleChoiceDialog { ...this.props } />
							<StyleInstaller { ...this.props } />
							<Editor { ...this.props } />
						</div>
					</div>
		);
	}

	static propTypes = {
		errorMessage: PropTypes.string,
		isConfirmingStyleSwitch: PropTypes.bool,
		isKeyboardUser: PropTypes.bool,
		isMouseUser: PropTypes.bool,
		isReadOnly: PropTypes.bool,
		isTouchUser: PropTypes.bool,
		lastDeletedItem: PropTypes.object,
		messages: PropTypes.array.isRequired,
		onClearMessage: PropTypes.func.isRequired,
		onDismissUndo: PropTypes.func.isRequired,
		onStyleSwitchCancel: PropTypes.func.isRequired,
		onStyleSwitchConfirm: PropTypes.func.isRequired,
		onUndoDelete: PropTypes.func.isRequired,
	}
}

module.exports = withRouter(UserTypeDetector(ZBib));
