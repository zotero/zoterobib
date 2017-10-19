'use strict';

const React = require('react');
const ZoteroBib = require('zotero-bib');
const CSL = require('citeproc');
const cx = require('classnames');
const { BrowserRouter, Route, withRouter, Switch, Link } = require('react-router-dom');
const { retrieveStyle, retrieveLocaleSync, validateUrl } = require('../utils');
const exportFormats = require('../constants/export-formats');
const { CSSTransitionGroup } = require('react-transition-group')
const Popover = require('react-popover');

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
		this.config = {
			storeUrl: this.props.config.storeUrl || (typeof window != 'undefined' && window.location.origin || '')
		};

		if(this.config.storeUrl.endsWith('/')) {
			this.config.storeUrl = this.config.storeUrl.substr(0, this.config.storeUrl.length - 1);
		}

		this.updating = Promise.resolve();
		this.state = {
			citationStyle: 'chicago-note-bibliography',
			citeprocReady: false,
			url: '',
			busy: false,
			error: '',
			items: [],
			active: 'citations',
			isExportDialogOpen: false,
			isSaving: false,
			isLoading: false
		};
	}

	async componentDidMount() {
		this.globalClickListener = window.addEventListener(
			'click',
			this.handleDocumentClick.bind(this)
		);

		const bibConfig = { ...this.props.config };

		
		this.setState({
			isLoading: true
		}, async () => {
			if(this.props.match.params.id) {
				const items = await this.fetchStoredItems(this.props.match.params.id);
				if(items) {
					bibConfig['override'] = true;
					bibConfig['initialItems'] = items;
				}
			}

			this.bib = new ZoteroBib(bibConfig);
			this.updating = this.updateCiteproc();

			this.setState({
				isLoading: false
			});
		});
		
	}

	componentWillUnmount() {
		window.removeEventListener(this.globalClickListener);
	}

	async fetchStoredItems(id) {
		try {
			const response = await fetch(`${this.config.storeUrl}/${id}`);
			if(!response.ok) {
				throw new Error();	
			}
			const items = await response.json();
			return items;
		} catch(e) {
			this.props.history.push('/');
			this.handleErrorMessage('Failed to load citations by id.');
		}
		return false;
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

	handleDocumentClick(ev) {
		if(!ev.target.closest('.export-button') && !ev.target.closest('.Popover')) {
			this.setState({ isExportDialogOpen: false });
		}
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
		const baseUrl = get(this.props.match, 'params.id') ? `/id/${get(this.props.match, 'params.id')}/` : '/';
		this.props.history.push(key ? baseUrl + key : baseUrl);
	}

	async handleSave() {
		this.setState({
			isSaving: true
		}, async () => {
			const response = await fetch(this.config.storeUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(this.bib.itemsRaw)
			});

			if(response.ok) {
				this.setState({
					isSaving: false
				});
				const { key } = await response.json();
				if(key) {
					this.props.history.push(`/id/${key}/`);
				} else {
					this.handleErrorMessage('There was a problem while saving citations.');
				}
			} else {
				let errorMessage = await response.text();
				this.handleErrorMessage(errorMessage);
			}
		});
	}

	get currentView() {
		let currentView = this.props.match.params.active ? this.props.match.params.active : 'citations';
		return currentView;
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
				{
					this.state.isSaving || this.state.isLoading && <div className="zotero-bib-busy-layer hidden-sm-up">
						<Icon type={ '16/spin' } width="32" height="32" />
					</div>
				}
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
									<Link to={ `${this.props.match.url}editor/` }>
										<Button>
											Manual Entry
										</Button>
									</Link>

									<Button 
										onClick={ this.handleSave.bind(this) }
										disabled={ this.props.isSaving }
									>
										{ this.state.isSaving ? 'Saving...' : 'Save' }
									</Button>

									<Popover 
										isOpen={ this.state.isExportDialogOpen }
										preferPlace="end"
										place="below"
										body={
											<ExportDialog
												onExported={ () => this.setState({ isExportDialogOpen: false }) }
												getExportData={ this.getExportData.bind(this) }
											/>
										}
									>
										<Button 
											className="export-button"
											onClick={ () => this.setState({ isExportDialogOpen: !this.state.isExportDialogOpen }) }
										>
											Export
										</Button>
									</Popover>
								</div>
							</Toolbar>
							<Toolbar className="hidden-sm-up">
								<div className="toolbar-left">
									<ToolGroup>
										<Link to={ `${this.props.match.url}editor/` }>
											<Button>
												<Icon type={ '16/new' } width="16" height="16" />
											</Button>
										</Link>
										<Link to={ `${this.props.match.url}export-dialog/` }>
											<Button>
												<Icon type={ '16/export' } width="16" height="16" />
											</Button>
										</Link>
										<Link to={ `${this.props.match.url}style-selector/` }>
											<Button>
												<Icon type={ '16/cog' } width="16" height="16" />
											</Button>
										</Link>
										<Button 
											onClick={ this.handleSave.bind(this) }
											disabled={ this.props.isSaving }
										>
											<Icon type={ '16/floppy' } width="16" height="16" />
										</Button>
									</ToolGroup>
								</div>
							</Toolbar>
							<UrlInput
								url={ this.state.url }
								busy={ this.state.busy }
								onTranslationRequest={ this.handleTranslateUrl.bind(this) }
							/>
							{
								this.state.isLoading ? (
									<div className="zotero-citations-loading">
										<Icon type={ '16/spin' } width="32" height="32" />
									</div>
								) : <Citations
									citations={ this.state.citations }
									onDeleteEntry={ this.handleDeleteEntry.bind(this) }
									{ ...this.props } />
							}
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
								<Route path={ `${this.props.match.url}/:item?` }>
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