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

const Editor = require('./editor');
const { CSSTransitionGroup } = require('react-transition-group');
const StyleSelector = require('./style-selector');
const ExportDialog = require('./export-dialog');
const citationStyles = require('../constants/citation-styles');

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
		const baseUrl = this.props.match.params.id ? `/id/${this.props.match.params.id}/` : '/';
		this.props.history.push(key ? baseUrl + key : baseUrl);
	}

	render() {
		return (
			<div className="zotero-bib-wrap">
				<header className="touch-header hidden-sm-up">
					<TouchNavigation
						root="Citations"
						path={ this.currentPath }
						onNavigation={ this.handleNavigation.bind(this) }
					/>
				</header>
				<div className="zotero-bib">
					<ErrorMessage
						error={ this.props.error }
						onDismiss={ this.props.onClearError.bind(this) }
					/>
					<main className={ `${this.currentView}-active` }>
						<div className="citations-tool scroll-container">
							{
								this.props.isReadOnly ?
									<ReadOnlyControls
										localCitationsCount={ this.props.itemsCount }
										citations={ this.props.citations }
										onOverride={ this.props.onOverride }
										getExportData={ this.props.getExportData }
									/>
								: <Controls
										citations={ this.props.citations }
										permalink={ this.props.permalink }
										url={ this.props.url }
										citationStyle={ this.props.citationStyle }
										getExportData={ this.props.getExportData }
										isSaving={ this.props.isSaving }
										onSave={ this.props.onSave }
										isTranslating={ this.props.isTranslating }
										onCitationStyleChanged={ this.props.onCitationStyleChanged }
										onTranslationRequest={ this.props.onTranslationRequest }
								/>
							}
							{
								this.props.isLoading ? (
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
							getExportData={ this.props.getExportData }
						/>
						<StyleSelector
							className="hidden-sm-up"
							citationStyle={ this.props.citationStyle }
							citationStyles= { citationStyles }
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
			</div>
		);
	}

	static defaultProps = {
		citations: {}
	}
	
	static propTypes = {
		citations: PropTypes.object,
		citationStyle: PropTypes.string,
		error: PropTypes.string,
		getExportData: PropTypes.func.isRequired,
		history: PropTypes.object,
		isLoading: PropTypes.bool,
		isReadOnly: PropTypes.bool,
		isSaving: PropTypes.bool,
		isTranslating: PropTypes.bool,
		items: PropTypes.array,
		itemsCount: PropTypes.number,
		match: PropTypes.object,
		onCitationStyleChanged: PropTypes.func.isRequired,
		onClearError: PropTypes.func.isRequired,
		onError: PropTypes.func.isRequired,
		onItemCreated: PropTypes.func.isRequired,
		onItemUpdate: PropTypes.func.isRequired,
		onOverride: PropTypes.func.isRequired,
		onSave: PropTypes.func.isRequired,
		onTranslationRequest: PropTypes.func.isRequired,
		permalink: PropTypes.string,
		url: PropTypes.string,
	}
}

module.exports = withRouter(ZBib);