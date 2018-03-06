'use strict';

const React = require('react');
const PropTypes = require('prop-types');
const { withRouter } = require('react-router-dom');
const cx = require('classnames');

const Brand = require('./brand');
const Bibliography = require('./bibliography');
const CiteTools = require('./cite-tools');
const Confirmation = require('./confirmation');
const DeleteAllButton = require('./delete-all-button');
const Editor = require('./editor');
const ErrorMessage = require('./error-message');
const ExportTools = require('./export-tools');
const MultipleChoiceDialog = require('./multiple-choice-dialog');
const PermalinkTools = require('./permalink-tools');
const Spinner = require('zotero-web-library/lib/component/ui/spinner');
const StyleInstaller = require('./style-installer');
const StyleSelector = require('./style-selector');
const UndoMessage = require('./undo-message');
const Editable = require('zotero-web-library/lib/component/editable');
const UserTypeDetector = require('zotero-web-library/lib/enhancers/user-type-detector');
const Icon = require('zotero-web-library/lib/component/ui/icon');
const Button = require('zotero-web-library/lib/component/ui/button');

class ZBib extends React.PureComponent {
	handleEditInput() {
		this.editable.edit();
	}

	renderBibliography() {
		if (Object.keys(this.props.citations).length === 0) {
			return (
				<React.Fragment>
					<img className="empty-bibliography" src="static/images/empty-bibliography.svg" width="320" height="200" />
					<h2 className="bibliography-title">Your bibliography is empty.</h2>
					<p className="lead">To add your sources simply enter an URL, ISBN, DOI, or PMID in the search box above. Of course you can add them manually too.</p>
				</React.Fragment>
			);
		} else {
			return (
				<React.Fragment>
					{
						this.props.isReadOnly ? (
							<h1>
								{ this.props.title || 'Untitled' }
							</h1>
						) : (
							<h2>
								<Editable
									ref={ editable => this.editable = editable }
									name="title"
									processing={ false }
									value={ this.props.title || 'Untitled' }
									editOnClick = { true }
									onSave={ newTitle => this.props.onTitleChanged(newTitle) }
								/>
								<Button onClick={ this.handleEditInput.bind(this) }>
									<Icon type={ '28/pencil' } width="28" height="28" />
								</Button>
							</h2>
						)
					}
					<StyleSelector { ...this.props } />
					{
						this.props.isLoadingCitations ? (
							<div className="zotero-citations-loading hidden-xs-down">
								<Spinner />
							</div>
						) : <Bibliography { ...this.props } />
					}
					{
						!this.props.isReadOnly && <DeleteAllButton { ...this.props } />
					}
				</React.Fragment>
			);
		}
	}

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

							<section className="section section-bibliography">
								<div className="container">
									{ this.renderBibliography() }
								</div>
							</section>

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

	static defaultProps = {
		citations: {},
	}

	static propTypes = {
		citations: PropTypes.object,
		citationStyle: PropTypes.string,
		citationStyles: PropTypes.array,
		error: PropTypes.string,
		errorMessage: PropTypes.string,
		getCopyData: PropTypes.func.isRequired,
		getFileData: PropTypes.func.isRequired,
		history: PropTypes.object,
		isConfirmingStyleSwitch: PropTypes.bool,
		isKeyboardUser: PropTypes.bool,
		isLoading: PropTypes.bool,
		isLoadingCitations: PropTypes.bool,
		isMouseUser: PropTypes.bool,
		isPickingItem: PropTypes.bool,
		isReadOnly: PropTypes.bool,
		isSaving: PropTypes.bool,
		isTouchUser: PropTypes.bool,
		isTranslating: PropTypes.bool,
		items: PropTypes.array,
		itemsCount: PropTypes.number,
		lastDeletedItem: PropTypes.object,
		match: PropTypes.object,
		multipleChoiceItems: PropTypes.array,
		onCitationStyleChanged: PropTypes.func.isRequired,
		onClearError: PropTypes.func.isRequired,
		onDeleteCitations: PropTypes.func.isRequired,
		onDismissUndo: PropTypes.func.isRequired,
		onError: PropTypes.func.isRequired,
		onItemCreated: PropTypes.func.isRequired,
		onItemUpdate: PropTypes.func.isRequired,
		onMultipleChoiceCancel: PropTypes.func.isRequired,
		onMultipleChoiceSelect: PropTypes.func.isRequired,
		onOverride: PropTypes.func.isRequired,
		onSave: PropTypes.func.isRequired,
		onStyleSwitchCancel: PropTypes.func.isRequired,
		onStyleSwitchConfirm: PropTypes.func.isRequired,
		onTitleChanged: PropTypes.func.isRequired,
		onTranslationRequest: PropTypes.func.isRequired,
		onUndoDelete: PropTypes.func.isRequired,
		permalink: PropTypes.string,
		title: PropTypes.string,
		url: PropTypes.string,
	}
}

module.exports = withRouter(UserTypeDetector(ZBib));
