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

class ZoteroBibComponent extends React.Component {
	constructor(props) {
		super(props);
		this.bib = new ZoteroBib();
		this.selectedStyleId = 'chicago-note-bibliography';
		this.updating = Promise.resolve();
		this.state = {
			citeprocReady: false
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
			citeprocReady: true
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

	async translateUrlHandler(ev) {
		ev.preventDefault();
		let url = validateUrl(this.state.url);
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
				this.inputField.focus();
			}
			catch(e) {
				this.setState({
					error: 'An error occured when citing this source',
					busy: false
				});
				this.inputField.focus();
			}
		} else {
			this.setState({
				error: 'Value entered doesn\'t appear to be a valid URL',
				busy: false
			});
			this.inputField.focus();
		}
	}

	deleteCitationsHandler() {
		this.bib.clearItems();
		this.updateBibliography();
	}

	selectCitationStyleHandler(selectedStyle) {
		this.selectedStyleId = selectedStyle.value;
		this.updating = this.updateCiteproc();
	}

	render() {
		return (
			<BrowserRouter>
				<div>
					<Sidebar
						onCotationStyleChanged={ citationStyle => this.setState({ citationStyle }) }
						onDeleteCitations={ this.deleteCitationsHandler }
					/>
					<div>
						<Route exact path="/" render={
							props => <Dashboard
								citations={ this.state.citations }
								{ ...props } />
						} />
						<Route
							path="/item/:item" render={
							props => <Editor
								items={ this.bib.items }
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
