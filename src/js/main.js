'use strict';

const Dashboard = require('./components/dashboard');
const Editor = require('./components/editor');
const React = require('react');
const ReactDOM = require('react-dom');
const ZoteroBib = require('zotero-bib');
const { CSL } = require('citeproc-js');
const { BrowserRouter, Route } = require('react-router-dom');
const { retrieveStyle, retrieveLocaleSync, validateUrl } = require('./utils');

const Sidebar = require('./components/sidebar');

//@TODO fix naming convention (bib vs this.bib)
class ZoteroBibComponent extends React.Component {
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

	render() {
		return (
			<BrowserRouter>
				<div>
					<Sidebar
						onCotationStyleChanged={ citationStyle => this.setState({ citationStyle }) }
						onDeleteCitations={ this.handleDeleteCitations }
					/>
					<div>
						<Route exact path="/" render={
							props => <Dashboard
								url={ this.state.url }
								busy={ this.state.busy }
								error={ this.state.error }
								citations={ this.state.citations }
								onTranslationRequest={ this.handleTranslateUrl.bind(this) }
								{ ...props } />
						} />
						<Route
							path="/item/:item" render={
							props => <Editor
								items={ this.state.items }
								onItemUpdate={ this.handleItemUpdate.bind(this) }
								{ ...props }
							/>
						} />
					</div>
				</div>
			</BrowserRouter>
		);
	}

	static init(domEl) {
		ReactDOM.render(<ZoteroBibComponent />, domEl);
	}
}

module.exports = ZoteroBibComponent;
