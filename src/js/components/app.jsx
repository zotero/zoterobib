'use strict';

const React = require('react');
const ZoteroBib = require('zotero-bib');
const { CSL } = require('citeproc-js');
const { Route, withRouter } = require('react-router-dom');
const { retrieveStyle, retrieveLocaleSync, validateUrl } = require('../utils');
const exportFormats = require('../constants/export-formats');

const Dashboard = require('./dashboard');
const Editor = require('./editor');
const Sidebar = require('./sidebar');
const ErrorMessage = require('./error-message');
const citationStyles = require('../constants/citation-styles');
const { validateItem } = require('../utils');

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
			items: []
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
		this.citeproc.updateItems(this.bib.itemsCSL.map(item => item.id));
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

	getExportData(format, asDataUrl = false) {
		if(this.state.citeprocReady) {
			this.citeproc.setOutputFormat(format);
			const bib = this.citeproc.makeBibliography();
			this.citeproc.setOutputFormat('html');

			if(asDataUrl) {
				return `data:${exportFormats[format]},${bib[0].bibstart}${bib[1].join()}${bib[0].bibend}`;
			} else {
				return `${bib[0].bibstart}${bib[1].join()}${bib[0].bibend}`;
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

	handleManualEntry() {
		const key = Math.random().toString(36).substr(2, 8).toUpperCase();
		const item = {
			'itemKey': key,
			'itemVersion': 0,
			'itemType': 'book',
			'creators': [{
				creatorType: 'author',
				firstName: '',
				lastName: ''
			}],
			'title': '(No Title)'
		};
		this.bib.addItem(item);
		this.updateBibliography();
		this.props.history.push(`/item/${key}`);
	}

	handleDeleteEntry(itemId) {
		this.bib.removeItem(this.bib.itemsRaw.find(item => item.itemKey == itemId));
		this.updateBibliography();
	}

	render() {
		return (
			<div>
				<Sidebar
					citationStyle={ this.state.citationStyle }
					citationStyles= { citationStyles }
					getExportData={ this.getExportData.bind(this) }
					onCitationStyleChanged={ this.handleSelectCitationStyle.bind(this) }
					onDeleteCitations={ this.handleDeleteCitations.bind(this) }
				/>
				<ErrorMessage
					error={ this.state.error }
					onDismiss={ this.handleClearErrorMessage.bind(this) }
				/>
				<div>
					<Route exact path="/" render={
						props => <Dashboard
							url={ this.state.url }
							busy={ this.state.busy }
							citations={ this.state.citations }
							onTranslationRequest={ this.handleTranslateUrl.bind(this) }
							onManualEntry={ this.handleManualEntry.bind(this) }
							onDeleteEntry={ this.handleDeleteEntry.bind(this) }
							onError={ this.handleErrorMessage.bind(this) }
							{ ...props } />
					} />
					<Route
						path="/item/:item" render={
						props => <Editor
							items={ this.state.items }
							onItemUpdate={ this.handleItemUpdate.bind(this) }
							onError={ this.handleErrorMessage.bind(this) }
							{ ...props }
						/>
					} />
				</div>
			</div>
		);
	}
}

module.exports = withRouter(App);