'use strict';

const React = require('react');
const PropTypes = require('prop-types');
const ZoteroBib = require('zotero-bib');
const exportFormats = require('../constants/export-formats');
const { withRouter } = require('react-router-dom');
const { fetchFromPermalink, saveToPermalink, getCiteproc, validateItem, validateUrl } = require('../utils');
const ZBib = require('./zbib');

class Container extends React.Component {
	state = {
		isLoading: true,
		isReadOnly: !!this.props.match.params.id,
		isSaving: false,
		isTranslating: false,
		citationStyle: localStorage.getItem('zotero-bib-citations-style') || 'chicago-note-bibliography',
		errorMessage: null,
		permalink: null,
		url: '',
		citations: {},
	}

	async componentDidUpdate(props, state) {
		if((this.state.isReadOnly !== state.isReadOnly)
			|| (this.state.citationStyle !== state.citationStyle)
		) {
			try {
				await this.prepareCiteproc(
					this.state.citationStyle,
					this.state.isReadOnly ? this.bibRemote : this.bib,
					this.state.isReadOnly
				);
				localStorage.setItem('zotero-bib-citations-style', this.state.citationStyle);
				this.setState({ citations: this.citations });
			} catch(e) {
				this.setState({
					citationStyle: state.citationStyle,
					errorMessage: 'Failed to obtain selected citations style.'
				});
			} finally {
				this.setState({
					isLoading: false
				});
			}
		}
	}

	async componentDidMount() {
		let isReadOnly = !!this.props.match.params.id;
		let citationStyle = this.state.citationStyle;
		let errorMessage = null;

		if(this.props.match.params.id) {
			try {
				const id = this.props.match.params.id;
				const remoteData = await fetchFromPermalink(`${this.props.config.storeUrl}/${id}`);
				if(remoteData && 'items' in remoteData) {
					citationStyle = remoteData.citationStyle || citationStyle;
					this.bibRemote = new ZoteroBib({
						...this.props.config,
						initialItems: remoteData.items,
						persist: false
					});
				}
			} catch(e) {
				this.props.history.push('/');
				errorMessage = 'Failed to load citations by id.';
			}
		}

		this.bib = new ZoteroBib({ ...this.props.config });

		await this.prepareCiteproc(
			citationStyle,
			isReadOnly ? this.bibRemote : this.bib,
			isReadOnly
		);
		
		
		this.setState({ 
			isReadOnly,
			citationStyle,
			errorMessage,
			citations: this.citations,
			items: this.items,
			isLoading: false,
		});
	}

	async handleSave() {
		let permalink = null;
		let errorMessage = null;
		this.setState({ isSaving: true });
		try {
			const key = await saveToPermalink(this.props.config.storeUrl, {
				citationStyle: this.state.citationStyle,
				items: this.bib.itemsRaw
			});
			permalink = `${window.location.origin}/id/${key}/`;
		} catch(e) {
			this.props.history.push('/');
			errorMessage = 'Failed to save citations.' + e;
		}
		this.setState({ permalink, errorMessage });
	}

	handleDeleteCitations() {
		this.setState({ permalink: null });
		this.bib.clearItems();
		this.setState({ citations: this.citations, items: this.items });
	}

	handleItemCreated(item) {
		this.setState({ permalink: null });
		this.bib.addItem(item);
		this.setState({ citations: this.citations, items: this.items });
	}

	handleDeleteEntry(itemId) {
		this.setState({ permalink: null });
		this.bib.removeItem(
			this.bib.itemsRaw.find(item => item.itemKey == itemId)
		);
		this.setState({ citations: this.citations, items: this.items });
	}

	handleCitationStyleChanged(citationStyle) {
		this.setState({
			isLoading: true,
			citationStyle
		});
	}

	async handleItemUpdate(itemKey, fieldKey, fieldValue) {
		const index = this.bib.items.findIndex(item => item.itemKey === itemKey);

		let updatedItem = {
			...this.bib.items[index],
			[fieldKey]: fieldValue
		};

		try {
			await validateItem(updatedItem);
		} catch(e) {
			this.setState({
				errorMessage: 'Failed to obtain meta data. Please check your connection and try again.'
			});
			return;
		}

		this.bib.updateItem(index, updatedItem);
		this.setState({ citations: this.citations, items: this.items });
	}

	async handleTranslateUrl(url) {
		url = validateUrl(url);
		this.setState({
			isTranslating: true,
			errorMessage: '',
			url: url || ''
		});

		if(url) {
			try {
				await this.bib.translateUrl(url.toString());
				this.setState({
					url: '',
					isTranslating: false,
					citations: this.citations,
					items: this.items
				});
			}
			catch(e) {
				this.setState({
					errorMessage: 'An error occured when citing this source',
					isTranslating: false,
				});
			}
		} else {
			this.setState({
				errorMessage: 'Value entered doesn\'t appear to be a valid URL',
				isTranslating: false,
			});
		}
	}

	handleOverride() {
		this.bib.clearItems();
		this.bib = this.bibRemote;
		this.bib.setItemsStorage(this.bib.items);
		delete this.bibRemote;
		this.props.history.replace('/');
		this.setState({ isReadOnly: false });
	}

	handleError(errorMessage) {
		this.setState({ errorMessage });
	}

	handleClearErrorMessage() {
		this.setState({ errorMessage: '' });
	}

	async prepareCiteproc(style, bib, isReadOnly) {
		this.citeproc = await getCiteproc(style, bib);
		// Make URLs and DOIs clickable on permalink pages
		this.citeproc.opt.development_extensions.wrap_url_and_doi = isReadOnly;
	}

	getExportData(format, asFile = false) {
		if(this.citeproc) {
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

	get citations() {
		const bib = this.state.isReadOnly ? this.bibRemote : this.bib;
		if(!bib) {
			return {};
		}
		this.citeproc.updateItems(
			bib.itemsRaw
				.filter(item => item.itemKey && !item.parentItem)
				.map(item => item.itemKey)
		);
		let bibliography = this.citeproc.makeBibliography();
		return bibliography[0].entry_ids.reduce(
			(obj, key, id) => ({
				...obj,
				[key]: bibliography[1][id]
			}), {}
		);
	}

	get items() {
		const bib = this.state.isReadOnly ? this.bibRemote : this.bib;
		return bib ? [...bib.items] : [];
	}

	render() {
		return <ZBib 
			onSave = { this.handleSave.bind(this) }
			onDeleteCitations = { this.handleDeleteCitations.bind(this) }
			onItemCreated = { this.handleItemCreated.bind(this) }
			onDeleteEntry = { this.handleDeleteEntry.bind(this) }
			onItemUpdate = { this.handleItemUpdate.bind(this) }
			onOverride = { this.handleOverride.bind(this) }
			onCitationStyleChanged = { this.handleCitationStyleChanged.bind(this) }
			onTranslationRequest = { this.handleTranslateUrl.bind(this) }
			onClearError = { this.handleClearErrorMessage.bind(this) }
			onError = { this.handleError.bind(this) }
			getExportData = { this.getExportData.bind(this) }
			itemsCount = { this.bib ? this.bib.items.length : null }
			{ ...this.state }
		/>;
	}

	static propTypes = {
		config: PropTypes.object,
		match: PropTypes.object,
		history: PropTypes.object,
	}
}

module.exports = withRouter(Container);