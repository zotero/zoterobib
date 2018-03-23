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
const About = require('./about');

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

							{
								!this.props.isReadOnly && (
									<About />
								)
							}

							<Confirmation
								isOpen={ this.props.isConfirmingStyleSwitch }
								onConfirm={ this.props.onStyleSwitchConfirm }
								onCancel={ this.props.onStyleSwitchCancel }
								title="Converting Titles to Sentence Case"
									confirmLabel="OK, I’ll Edit Them"
								>
									<p>APA style requires titles to be in sentence case rather than
									title case. When you use APA style, ZBib will partially
									convert the titles of entries to sentence case for you, but
									you’ll need to manually edit some entries to capitalize proper
									nouns:</p>
									
									<p><b>Title case:</b> <i>Circadian Mood Variations in Twitter Content</i></p>
									<p><b>ZBib conversion:</b> <i>Circadian mood variations in twitter content</i></p>
									<p><b>Sentence case:</b> <i>Circadian mood variations in <span style={{color: 'red', fontWeight: 'bold'}}>T</span>witter content</i></p>
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
