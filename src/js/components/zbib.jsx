'use strict';

const React = require('react');
const PropTypes = require('prop-types');
const { withRouter } = require('react-router-dom');
const cx = require('classnames');

const Brand = require('./brand');
const BibliographySection = require('./bibliographySection');
const CiteTools = require('./cite-tools');
const ErrorMessage = require('./error-message');
const ExportTools = require('./export-tools');
const PermalinkTools = require('./permalink-tools');
const Spinner = require('zotero-web-library/lib/component/ui/spinner');
const UndoMessage = require('./undo-message');
const UserTypeDetector = require('zotero-web-library/lib/enhancers/user-type-detector');
const MultipleChoiceDialog = require('./multiple-choice-dialog');
const Confirmation = require('./confirmation');
const Editor = require('./editor');
const StyleInstaller = require('./style-installer');

class ZBib extends React.PureComponent {
	render() {
		return (
			typeof this.props.isReadOnly === 'undefined'
				?	<div className="zotero-bib-container loading">
						<Spinner />
					</div>
				:	<div className={ cx('zotero-bib-container', {
						'keyboard-user': this.props.isKeyboardUser,
						'mouse-user': this.props.isMouseUser,
						'touch-user': this.props.isTouchUser,
					}) }>
						<div className="zotero-bib-inner">
							<ErrorMessage
								message={ this.props.errorMessage }
								onDismiss={ this.props.onClearError.bind(this) }
							/>
							<UndoMessage
								message={ this.props.lastDeletedItem ? 'Item deleted' : null }
								onUndo={ this.props.onUndoDelete }
								onDismiss={ this.props.onDismissUndo }
							/>

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
								!this.props.isReadOnly && (
									<section className="section section-export">
										<div className="container">
											<h2>Export</h2>
											<ExportTools { ...this.props } />
										</div>
									</section>
								)
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
		isReadOnly: PropTypes.bool,
		isKeyboardUser: PropTypes.bool,
		isMouseUser: PropTypes.bool,
		isTouchUser: PropTypes.bool,
		errorMessage: PropTypes.string,
		onClearError: PropTypes.func.isRequired,
		lastDeletedItem: PropTypes.object,
		onUndoDelete: PropTypes.func.isRequired,
		onDismissUndo: PropTypes.func.isRequired,
		isConfirmingStyleSwitch: PropTypes.bool,
		onStyleSwitchCancel: PropTypes.func.isRequired,
		onStyleSwitchConfirm: PropTypes.func.isRequired,
	}
}

module.exports = withRouter(UserTypeDetector(ZBib));
