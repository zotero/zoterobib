'use strict';

const React = require('react');
const ZoteroBib = require('zotero-bib');
const CSL = require('citeproc');
const cx = require('classnames');
const { BrowserRouter, Route, withRouter, Switch, Link } = require('react-router-dom');
const { retrieveStyle, retrieveLocaleSync, validateUrl } = require('../utils');
const exportFormats = require('../constants/export-formats');
const { CSSTransitionGroup } = require('react-transition-group')


const UrlInput = require('./url-input');
const Citations = require('./citations');
const Editor = require('./editor');
const StyleSelector = require('./style-selector');
const ExportDialog = require('./export-dialog');
const Button = require('zotero-web-library/lib/component/ui/button');
const Icon = require('zotero-web-library/lib/component/ui/icon');
const { Toolbar, ToolGroup } = require('zotero-web-library/lib/component/ui/toolbars');
const TouchNavigation = require('zotero-web-library/lib/component/touch-navigation');
const ErrorMessage = require('./error-message');
const citationStyles = require('../constants/citation-styles');
const { validateItem } = require('../utils');
const { get } = require('zotero-web-library/lib/utils');

function firstChild(props) {
	const childrenArray = React.Children.toArray(props.children);
	return childrenArray[0] || null;
}


class App extends React.Component {
		constructor(props) {
		super(props);
		this.bib = new ZoteroBib(props.config);
		this.updating = Promise.resolve();
		this.state = {
			citationStyle: 'chicago-note-bibliography',
			citeprocReady: false,
			url: '',
			busy: false,
			error: '',
			items: [],
			active: 'citations'
		};
	}

	componentDidMount() {
		this.updating = this.updateCiteproc();
	}

	async updateCiteproc() {
		this.setState({
			citeprocReady: false
		});
		const sys = {
			retrieveLocale: retrieveLocaleSync,
			retrieveItem: itemId => this.bib.itemsCSL.find(item => item.id === itemId)
		};
		const style = await retrieveStyle(this.state.citationStyle);
		this.citeproc = new CSL.Engine(sys, style);
		this.updateBibliography();
		this.setState({
			citeprocReady: true,
			items: [...this.bib.items]
		});
	}

	updateBibliography() {
		this.citeproc.updateItems(
			this.bib.itemsRaw
				.filter(item => item.itemKey && !item.parentItem)
				.map(item => item.itemKey)
		);
		let bib = this.citeproc.makeBibliography();
		this.setState({
			items: [...this.bib.items],
			citations: bib[0].entry_ids.reduce(
				(obj, key, id) => ({
					...obj,
					[key]: bib[1][id]
				}), {}
			)
		});
	}

	getExportData(format, asFile = false) {
		if(this.state.citeprocReady) {
			this.citeproc.setOutputFormat(format);
			const bib = this.citeproc.makeBibliography();
			this.citeproc.setOutputFormat('html');
			const fileContents = `${bib[0].bibstart}${bib[1].join()}${bib[0].bibend}`;

			if(asFile) {
				const fileName = `citations.${exportFormats[format].extension}`;
				const file = new File(
					[fileContents],
					fileName,
					{ type: exportFormats[format].mime }
				);
				return file;
			} else {
				return fileContents;
			}
		}

		return '';
	}

	async handleTranslateUrl(url) {
		url = validateUrl(url);
		this.setState({
			busy: true,
			error: '',
			url: url || ''
		});

		if(url) {
			try {
				await this.updating;
				await this.bib.translateUrl(url.toString());
				this.updateBibliography();
				this.setState({
					url: '',
					busy: false
				});
			}
			catch(e) {
				this.setState({
					error: 'An error occured when citing this source',
					busy: false
				});
			}
		} else {
			this.setState({
				error: 'Value entered doesn\'t appear to be a valid URL',
				busy: false
			});
		}
	}

	handleDeleteCitations() {
		this.bib.clearItems();
		this.updateBibliography();
	}

	handleSelectCitationStyle(citationStyle) {
		this.setState({ citationStyle });
		this.updating = this.updateCiteproc();
	}

	handleItemCreated(item) {
		this.bib.addItem(item);
		this.updateBibliography();
	}

	async handleItemUpdate(itemKey, fieldKey, fieldValue) {
		await this.updating;
		const index = this.bib.items.findIndex(item => item.itemKey === itemKey);

		let updatedItem = {
			...this.bib.items[index],
			[fieldKey]: fieldValue
		};

		try {
			await validateItem(updatedItem);	
		} catch(e) {
			this.handleErrorMessage('Failed to obtain meta data. Please check your connection and try again.');
			return;
		}

		this.bib.updateItem(index, updatedItem);
		this.updateBibliography();
	}

	handleErrorMessage(error) {
		this.setState({ error });
	}

	handleClearErrorMessage() {
		this.setState({ error: '' });
	}

	handleDeleteEntry(itemId) {
		this.bib.removeItem(this.bib.itemsRaw.find(item => item.itemKey == itemId));
		this.updateBibliography();
	}

	handleNavigation(key) {
		this.props.history.push(`/${key === null ? '' : key}`);
	}

	get currentView() {
		if(this.props.location.pathname === '/style-selector') {
			return 'style-selector';
		}
		if(this.props.location.pathname === '/export') {
			return 'export-dialog';
		}
		if(this.props.location.pathname.startsWith('/item')) {
			return 'editor';
		}
		return 'citations';
	}

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
						error={ this.state.error }
						onDismiss={ this.handleClearErrorMessage.bind(this) }
					/>
					<main className={ `${this.currentView}-active` }>
						<div className="citations-tool scroll-container">
							<Toolbar className="hidden-xs-down toolbar-large">
								<div className="toolbar-left">
									<StyleSelector
										citationStyle={ this.state.citationStyle }
										citationStyles= { citationStyles }
										onCitationStyleChanged={ this.handleSelectCitationStyle.bind(this) }
									/>
								</div>
								<div className="toolbar-right">
									<Link to="/item">
										<Button>
											Manual Entry
										</Button>
									</Link>
									<ExportDialog
										getExportData={ this.getExportData.bind(this) }
									/>
								</div>
							</Toolbar>
							<Toolbar className="hidden-sm-up">
								<div className="toolbar-left">
									<ToolGroup>
										<Link to="/item">
											<Button>
												<Icon type={ '16/new' } width="16" height="16" />
											</Button>
										</Link>
										<Link to="/export">
											<Button>
												<Icon type={ '16/export' } width="16" height="16" />
											</Button>
										</Link>
										<Link to="/style-selector">
											<Button>
												<Icon type={ '16/cog' } width="16" height="16" />
											</Button>
										</Link>
									</ToolGroup>
								</div>
							</Toolbar>
							<UrlInput
								url={ this.state.url }
								busy={ this.state.busy }
								onTranslationRequest={ this.handleTranslateUrl.bind(this) }
							/>
							<Citations
								citations={ this.state.citations }
								onDeleteEntry={ this.handleDeleteEntry.bind(this) }
								{ ...this.props } />
						</div>
						<ExportDialog
							className="hidden-sm-up"
							getExportData={ this.getExportData.bind(this) }
						/>
						<StyleSelector
							className="hidden-sm-up"
							citationStyle={ this.state.citationStyle }
							citationStyles= { citationStyles }
							onCitationStyleChanged={ this.handleSelectCitationStyle.bind(this) }
						/>
						<CSSTransitionGroup
							component={ firstChild }
							transitionName="slide"
							transitionEnterTimeout={600}
							transitionLeaveTimeout={600}
						>
							{ this.currentView == 'editor' &&
								<Route path="/item/:item?">
									<Editor
										items={ this.state.items }
										onItemCreated={ this.handleItemCreated.bind(this) }
										onItemUpdate={ this.handleItemUpdate.bind(this) }
										onError={ this.handleErrorMessage.bind(this) }
										{ ...this.props }
									/>
								</Route>
							}
						</CSSTransitionGroup>
					</main>
				</div>
				<footer>
					Powered by <a href="http://zotero.org/">Zotero</a>
				</footer>
			</div>
		);
	}
}
module.exports = withRouter(App);