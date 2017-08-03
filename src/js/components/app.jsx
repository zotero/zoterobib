'use strict';

const React = require('react');
const ZoteroBib = require('zotero-bib');
const { CSL } = require('citeproc-js');
const { Route, withRouter } = require('react-router-dom');
const { retrieveStyle, retrieveLocaleSync, validateUrl } = require('../utils');

const Dashboard = require('./dashboard');
const Editor = require('./editor');
const Sidebar = require('./sidebar');
const ErrorMessage = require('./error-message');

class App extends React.Component {
		constructor(props) {
		super(props);
		this.bib = new ZoteroBib();
		this.selectedStyleId = 'chicago-note-bibliography';
		this.updating = Promise.resolve();
		this.state = {
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
		const style = await retrieveStyle(this.selectedStyleId);
		this.citeproc = new CSL.Engine(sys, style);
		this.updateBibliography();
		this.setState({
			citeprocReady: true,
			items: this.bib.items
		});
	}

	updateBibliography() {
		this.citeproc.updateItems(this.bib.itemsCSL.map(item => item.id));
		let bib = this.citeproc.makeBibliography();
		this.setState({
			items: this.bib.items,
			citations: bib[0].entry_ids.reduce(
				(obj, key, id) => ({
					...obj,
					[key]: bib[1][id]
				}), {}
			)
		});
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

	handleSelectCitationStyle(selectedStyle) {
		this.selectedStyleId = selectedStyle.value;
		this.updating = this.updateCiteproc();
	}

	async handleItemUpdate(itemKey, fieldKey, fieldValue) {
		await this.updating;

		const index = this.bib.items.findIndex(item => item.itemKey === itemKey);
		this.bib.updateItem(index, {
			...this.bib.items[index],
			[fieldKey]: fieldValue
		});

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
		this.bib.addItem({
			'itemKey': key,
			'itemVersion': 0,
			'itemType': 'book',
			'creators': [],
			'title': '(No Title)'
		});
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
					onCotationStyleChanged={ citationStyle => this.setState({ citationStyle }) }
					onDeleteCitations={ this.handleDeleteCitations }
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