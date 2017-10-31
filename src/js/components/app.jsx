'use strict';

const React = require('react');
const ZoteroBib = require('zotero-bib');
const cx = require('classnames');
const { BrowserRouter, Route, withRouter, Switch, Link } = require('react-router-dom');
const { retrieveStyle, retrieveLocaleSync, validateUrl } = require('../utils');
const exportFormats = require('../constants/export-formats');
const { CSSTransitionGroup } = require('react-transition-group');
const Citations = require('./citations');
const Editor = require('./editor');
const StyleSelector = require('./style-selector');
const ExportDialog = require('./export-dialog');
const Icon = require('zotero-web-library/lib/component/ui/icon');
const Controls = require('./controls');
const ReadOnlyControls = require('./read-only-controls');
const TouchNavigation = require('zotero-web-library/lib/component/touch-navigation');
const ErrorMessage = require('./error-message');
const citationStyles = require('../constants/citation-styles');
const { validateItem, getCSL } = require('../utils');
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

		this.branch = 'local';
		this.updating = Promise.resolve();
		this.state = {
			citationStyle: 'chicago-note-bibliography',
			citeprocReady: false,
			url: '',
			isBusy: false,
			error: '',
			items: [],
			readOnly: false,
			active: 'citations',
			isExportDialogOpen: false,
			isSaving: false,
			isLoading: false
		};
	}

	async componentDidMount() {
		this.setState({
			readOnly: !!this.props.match.params.id,
			isLoading: true
		}, async () => {
			if(this.props.match.params.id) {
				const items = await this.fetchStoredItems(this.props.match.params.id);
				if(items) {
					this.bibRemote = new ZoteroBib({
						...this.props.config,
						initialItems: items,
						persist: false
					});
				} else {
					this.props.history.push('/');
				}
			}

			this.branch = this.bibRemote ? 'remote' : 'local';
			this.setState({
				readOnly: !!this.bibRemote
			}, async () => {
				this.bib = new ZoteroBib({ ...this.props.config });
				this.updating = await this.updateCiteproc();
				this.setState({
					isLoading: false
				});	
			});
		});
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

	updateCiteproc() {
		const bib = this.branch === 'remote' ? this.bibRemote : this.bib;
		return new Promise((resolve) => {
			this.setState({
				citeprocReady: false
			}, async () => {
				const sys = {
					retrieveLocale: retrieveLocaleSync,
					retrieveItem: itemId => bib.itemsCSL.find(item => item.id === itemId)
				};
				const [ CSL, style ] = await Promise.all([
					getCSL(),
					retrieveStyle(this.state.citationStyle)
				]);

				this.citeproc = new CSL.Engine(sys, style);
				this.updateBibliography();
				this.setState({
					citeprocReady: true,
					items: [...bib.items]
				}, resolve);
			});
		});
	}

	updateBibliography() {
		const bib = this.branch === 'remote' ? this.bibRemote : this.bib;
		this.citeproc.updateItems(
			bib.itemsRaw
				.filter(item => item.itemKey && !item.parentItem)
				.map(item => item.itemKey)
		);
		let bibliography = this.citeproc.makeBibliography();
		this.setState({
			items: [...bib.items],
			citations: bibliography[0].entry_ids.reduce(
				(obj, key, id) => ({
					...obj,
					[key]: bibliography[1][id]
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
			isBusy: true,
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
					isBusy: false
				});
			}
			catch(e) {
				this.setState({
					error: 'An error occured when citing this source',
					isBusy: false
				});
			}
		} else {
			this.setState({
				error: 'Value entered doesn\'t appear to be a valid URL',
				isBusy: false
			});
		}
	}

	handleDeleteCitations() {
		this.bib.clearItems();
		this.updateBibliography();
	}

	handleSelectCitationStyle(citationStyle) {
		let previousCitationStyle = this.state.citationStyle;
		this.setState({
			isLoading: true,
			citationStyle
		}, async () => {
			try {
				await this.updateCiteproc();
			} catch(c) {
				this.handleErrorMessage('Failed to obtain selected citations style.');
				this.setState({ citationStyle: previousCitationStyle });
			} finally {
				this.setState({
					isLoading: false
				});
			}
		});
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

	handleOverride() {
		this.branch = 'local';
		this.bib.clearItems();
		this.bib = this.bibRemote;
		this.bib.setItemsStorage(this.bib.items);
		delete this.bibRemote;
		this.props.history.push('/');
		this.setState({
			readOnly: false
		}, () => {
			this.updateBibliography();

		});
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
		return new Promise((resolve, reject) => {
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
						resolve(key);
					} else {
						this.handleErrorMessage('There was a problem while saving citations.');
						reject();
					}
				} else {
					let errorMessage = await response.text();
					this.handleErrorMessage(errorMessage);
					reject();
				}
			});
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
					(this.state.isSaving || this.state.isLoading) && <div className="zotero-bib-busy-layer hidden-sm-up">
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
							{ 
								this.state.readOnly ?
									<ReadOnlyControls
										localCitationsCount={ this.state.citeprocReady ? this.bib.itemsRaw.length : null }
										citations={ this.state.citations }
										onOverride={ this.handleOverride.bind(this) }
									/>
								: <Controls
										citationStyle={ this.state.citationStyle }
										getExportData={ this.getExportData.bind(this) }
										url={ this.state.url }
										isSaving={ this.state.isSaving }
										onSave={ this.handleSave.bind(this) }
										isBusy={ this.state.isBusy }
										onCitationStyleChanged={ this.handleSelectCitationStyle.bind(this) }
										onTranslationRequest={ this.handleTranslateUrl.bind(this) }
								/>
							}
							{
								this.state.isLoading ? (
									<div className="zotero-citations-loading hidden-xs-down">
										<Icon type={ '16/spin' } width="32" height="32" />
									</div>
								) : <Citations
									citations={ this.state.citations }
									readOnly= { this.state.readOnly }
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