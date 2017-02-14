'use strict';

import React from 'react';
import ReactDOM from 'react-dom';
import ZoteroBib from 'zotero-bib';

import citationStyles from './citation-styles';

import Select from 'react-select';

const syncRequestAsText = url => {
	let xhr = new XMLHttpRequest();
	xhr.open('GET', url, false);
	xhr.send();
	return xhr.responseText;
};

const validateUrl = url => {
		try {
			url = new URL(url);
			return url.toString();
		} catch(e) {
			try {
				url = new URL(`http://${url}`);
				return url.toString();
			} catch(e) {
				return false;
			}
		}
};

export default class ZoteroBibComponent extends React.Component {
	constructor(props) {
		super(props);
		this.bib = new ZoteroBib();
		this.csl = ZoteroBib.CSL;
		this.selectedStyleId = 'chicago-note-bibliography';
		this.updating = Promise.resolve();
		this.state = {
			url: '',
			busy: false,
			error: '',
			citeprocReady: false,
			preferencesOpen: false,
			citations: []
		};
	}

	componentDidMount() {
		this.updating = this.updateCiteproc();
		console.info(this.updating);
	}

	retrieveLocaleSync(lang) {
		let url = `https://cdn.rawgit.com/citation-style-language/locales/b01a5e4d/locales-${lang}.xml`;
		let retval = syncRequestAsText(url);
		return retval;
	}

	async retrieveStyle(styleId) {
		let cacheId = `style-${styleId}`;
		let style = localStorage.getItem(cacheId);
		if(!style) {
			let url = `https://raw.githubusercontent.com/citation-style-language/styles/master/${styleId}.csl`;
			let response = await fetch(url);
			style = await response.text();
			localStorage.setItem(cacheId, style);
		}
		return style;
	}

	//@NOTE: Might need to pre-index items for performance reasons
	retrieveItem(itemId) {
		return this.bib.items.find(item => item.id === itemId);
	}

	async updateCiteproc() {
		this.setState({
			citeprocReady: false
		});
		let sys = {
			retrieveLocale: this.retrieveLocaleSync,
			retrieveItem: this.retrieveItem.bind(this)
		};
		let style = await this.retrieveStyle(this.selectedStyleId);
		this.citeproc = new ZoteroBib.CSL.Engine(sys, style);
		this.updateBibliography();
		this.setState({
			citeprocReady: true
		});
	}

	updateBibliography() {
		this.citeproc.updateItems(this.bib.items.map(item => item.id));
		let bib = this.citeproc.makeBibliography();
		this.setState({
			citations: bib[0].entry_ids.reduce((obj, k, i) => ({...obj, [k]: bib[1][i] }), {})
		});
	}

	getCitation(citation) {
		return { 
			__html: citation
		};
	}

	selectCitationStyleHandler(selectedStyle) {
		this.selectedStyleId = selectedStyle.value;
		this.updating = this.updateCiteproc();
	}

	urlChangedHandler(ev) {
		this.setState({
			url: ev.target.value
		});
	}

	deleteCitationHandler(itemId) {
		this.bib.removeItem(this.bib.rawItems.find(item => item.itemKey == itemId));
		this.updateBibliography();
	}

	deleteAllCitationsHandler() {
		this.bib.clearItems();
		this.updateBibliography();
	}

	async translateUrlHandler(ev) {
		ev.preventDefault();
		let url = validateUrl(this.state.url);
		this.setState({
			busy: true,
			error: '',
			url: url
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

	preferencesOpenHandler() {
		this.setState({
			preferencesOpen: !this.state.preferencesOpen
		});
	}

	render() {
		return (
			<div className="zotero-bib">
				
				<div className={ `zotero-bib-preferences ${ this.state.preferencesOpen ? 'open' : '' }` }>
					<div className="zotero-bib-preferences-outer">
						<svg 
							onClick= { this.preferencesOpenHandler.bind(this) }
							className="zotero-bib-form-options-icon"
							style={{ width: 24, height: 24 }}
							aria-labelledby="title"
							role="img">
								<title id="title">Cog</title>
								<use xlinkHref="/icons/cog.svg#cog"></use>
						</svg>
						<h2>
							Preferences
						</h2>
					</div>
					<div className="zotero-bib-preferences-inner">
						<div className="zotero-bib-preferences-item">
							<label>Choose Citation Style:</label>
							<Select
								clearable={ false }
								className="zotero-bib-citation-style-selector"
								value={ this.selectedStyleId }
								options={ citationStyles }
								onChange={ this.selectCitationStyleHandler.bind(this) }
							/>
						</div>
						<div className="zotero-bib-preferences-item">
							<label>Delete Citations:</label>
							<button 
								onClick={ this.deleteAllCitationsHandler.bind(this) }
								className="zotero-bib-preferences-delete-all-button">
									Delete All
							</button>
						</div>
					</div>
					
				</div>
				<div className="zotero-bib-form">
					<div className="zotero-bib-form-main">
						<input
							ref = { i => this.inputField = i }
							autoFocus
							placeholder="Cite a source by entering its url"
							className="zotero-bib-form-url"
							type="text" value={ this.state.url }
							onChange={ this.urlChangedHandler.bind(this) }
						/>
						<button 
							disabled = { this.state.busy }
							className={ `zotero-bib-form-submit-button ${ this.state.busy ? 'loading' : '' }` }
							onClick={ this.translateUrlHandler.bind(this) }>
								{ this.state.busy ? '' : 'Cite it' }
						</button>
					</div>
				</div>
				<div className={ `zotero-bib-error ${ this.state.error ? 'visible' : ''}` }>
					{ this.state.error }
				</div>
				<div className="zotero-bib-citations">
					{
						Object.keys(this.state.citations).map(itemId => {
							return (
								<div className="zotero-bib-citation-wrapper" key={ itemId }>
									<div className="zotero-bib-citation">
										<div dangerouslySetInnerHTML={ this.getCitation(this.state.citations[itemId]) } />
									</div>
									<div className="zotero-bib-citation-action">
										<button>
											<svg 
												onClick= { this.deleteCitationHandler.bind(this, itemId) }
												className="zotero-bib-citation-action-icon"
												style={{ width: 24, height: 24 }}
												aria-labelledby="title"
												role="img">
													<title id="title">Trash</title>
													<use xlinkHref="/icons/trash.svg#trash"></use>
											</svg>
										</button>
									</div>
								</div>
							);
						})
					}
				</div>
				<footer>
					Powered by <a href="http://zotero.org/">Zotero</a>
				</footer>
			</div>
		);
	}

	static init(domEl) {
		ReactDOM.render(<ZoteroBibComponent />, domEl);
	}

}
