'use strict';

const React = require('react');
const PropTypes = require('prop-types');
const { Route, withRouter } = require('react-router-dom');
const TouchNavigation = require('zotero-web-library/lib/component/touch-navigation');
const Controls = require('./controls');
const ReadOnlyControls = require('./read-only-controls');
const Spinner = require('zotero-web-library/lib/component/ui/spinner');
const Citations = require('./citations');
const ErrorMessage = require('./error-message');
const UndoMessage = require('./undo-message');
const Confirmation = require('./confirmation');

const Editor = require('./editor');
const { CSSTransitionGroup } = require('react-transition-group');
const StyleSelector = require('./style-selector');
const ExportDialog = require('./export-dialog');
const MultipleChoiceDialog = require('./multiple-choice-dialog');
const StyleInstaller = require('./style-installer');

function firstChild(props) {
	const childrenArray = React.Children.toArray(props.children);
	return childrenArray[0] || null;
}

class ZBib extends React.PureComponent {
	get currentPath() {
		const viewPathMap = {
			'style-selector': [{
				key: 'style-selector',
				label: 'Select Citation Style'
			}],
			'export-dialog': [{
				key: 'export',
				label: 'Export'
			}],
			'editor': [{
				key: 'editor',
				label: 'Editor'
			}]
		};

		return this.currentView in viewPathMap ? viewPathMap[this.currentView] : [];
	}

	get currentView() {
		let currentView = this.props.match.params.active ? this.props.match.params.active : 'citations';
		return currentView;
	}

	handleNavigation(key) {
		const baseUrl = this.props.match.params.id ? `/${this.props.match.params.id}` : '/';
		this.props.history.push(key ? baseUrl + key : baseUrl);
	}

	render() {
		return (
			typeof this.props.isReadOnly === 'undefined' ?
			<div className="zotero-bib-wrap zotero-bib-loading">
				<div className="zotero-bib loading">
					<Spinner />
				</div>
			</div>
			: <div className="zotero-bib-wrap">
				<header className="touch-header hidden-sm-up">
					<TouchNavigation
						root="Citations"
						path={ this.currentPath }
						onNavigation={ this.handleNavigation.bind(this) }
					/>
				</header>
				<div className="zotero-bib">
					<ErrorMessage
						error={ this.props.errorMessage }
						onDismiss={ this.props.onClearError.bind(this) }
					/>
					<UndoMessage
						message={ this.props.lastDeletedItem ? 'Item deleted' : null }
						onUndo={ this.props.onUndoDelete }
						onDismiss={ this.props.onDismissUndo }
					/>
					<main className={ `${this.currentView}-active` }>
						<div className="citations-tool scroll-container">
							{
								this.props.isReadOnly ?
								<ReadOnlyControls
									localCitationsCount={ this.props.itemsCount }
									citations={ this.props.citations }
									onOverride={ this.props.onOverride }
									getCopyData = { this.props.getCopyData }
									getFileData = { this.props.getFileData }
								/> :
								<Controls
									citations={ this.props.citations }
									permalink={ this.props.permalink }
									url={ this.props.url }
									citationStyle={ this.props.citationStyle }
									citationStyles={ this.props.citationStyles }
									getCopyData = { this.props.getCopyData }
									getFileData = { this.props.getFileData }
									isSaving={ this.props.isSaving }
									onSave={ this.props.onSave }
									isTranslating={ this.props.isTranslating }
									onCitationStyleChanged={ this.props.onCitationStyleChanged }
									onTranslationRequest={ this.props.onTranslationRequest }
									onDeleteCitations={ this.props.onDeleteCitations }
								/> 
							}
							{
								this.props.isLoadingCitations ? (
									<div className="zotero-citations-loading hidden-xs-down">
										<Spinner />
									</div>
								) : <Citations
									onDeleteEntry={ this.onDeleteEntry }
									{ ...this.props }
								/>
							}
						</div>
						<ExportDialog
							className="hidden-sm-up"
							permalink={ this.props.permalink }
							isReadOnly={ this.props.isReadOnly }
							onSave={ this.props.onSave }
							getCopyData = { this.props.getCopyData }
							getFileData = { this.props.getFileData }
						/>
						<StyleSelector
							className="hidden-sm-up"
							citationStyle={ this.props.citationStyle }
							citationStyles= { this.props.citationStyles }
							onCitationStyleChanged={ this.props.onCitationStyleChanged }
						/>
						<CSSTransitionGroup
							component={ firstChild }
							transitionName="slide"
							transitionEnterTimeout={600}
							transitionLeaveTimeout={600}
						>
							{ this.currentView == 'editor' &&
								<Route path={ `${this.props.match.url}/:item?` }>
									<Editor
										items={ this.props.items }
										onItemCreated={ this.props.onItemCreated }
										onItemUpdate={ this.props.onItemUpdate }
										onError={ this.props.onError }
										{ ...this.props }
									/>
								</Route>
							}
						</CSSTransitionGroup>
					</main>
				</div>
				<MultipleChoiceDialog { ...this.props } />
				<StyleInstaller { ...this.props } />
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
			</div>
		);
	}

	static defaultProps = {
		citations: {},
	}
	
	static propTypes = {
		citations: PropTypes.object,
		citationStyle: PropTypes.string,
		error: PropTypes.string,
		getCopyData: PropTypes.func.isRequired,
		getFileData: PropTypes.func.isRequired,
		history: PropTypes.object,
		isConfirmingStyleSwitch: PropTypes.bool,
		isLoading: PropTypes.bool,
		isLoadingCitations: PropTypes.bool,
		isPickingItem: PropTypes.bool,
		isReadOnly: PropTypes.bool,
		isSaving: PropTypes.bool,
		isTranslating: PropTypes.bool,
		items: PropTypes.array,
		itemsCount: PropTypes.number,
		match: PropTypes.object,
		multipleChoiceItems: PropTypes.array,
		onCitationStyleChanged: PropTypes.func.isRequired,
		onClearError: PropTypes.func.isRequired,
		onDeleteCitations: PropTypes.func.isRequired,
		onError: PropTypes.func.isRequired,
		onItemCreated: PropTypes.func.isRequired,
		onItemUpdate: PropTypes.func.isRequired,
		onMultipleChoiceCancel: PropTypes.func.isRequired,
		onMultipleChoiceSelect: PropTypes.func.isRequired,
		onOverride: PropTypes.func.isRequired,
		onSave: PropTypes.func.isRequired,
		onStyleSwitchCancel: PropTypes.func.isRequired,
		onStyleSwitchConfirm: PropTypes.func.isRequired,
		onTranslationRequest: PropTypes.func.isRequired,
		permalink: PropTypes.string,
		url: PropTypes.string,
	}
}

module.exports = withRouter(ZBib);