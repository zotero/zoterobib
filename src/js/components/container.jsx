'use strict';

const React = require('react');
const PropTypes = require('prop-types');
const ZoteroBib = require('zotero-bib');
const exportFormats = require('../constants/export-formats');
const { withRouter } = require('react-router-dom');
const { fetchFromPermalink, saveToPermalink, getCiteproc, validateItem, validateUrl, isIdentifier } = require('../utils');
const ZBib = require('./zbib');

class Container extends React.Component {
	state = {
		isLoadingCitations: true,
		isPickingItem: false,
		isReadOnly: undefined,
		isSaving: false,
		isTranslating: false,
		citationStyle: localStorage.getItem('zotero-bib-citations-style') || 'chicago-note-bibliography',
		errorMessage: null,
		permalink: null,
		url: '',
		citations: {},
		multipleChoiceItems: [],
	}

	constructor(props) {
		super(props);
		this.handleCopy = this.handleCopy.bind(this);
	}

	async componentWillReceiveProps(props) {
		if(this.props.match.params.id !== props.match.params.id) {
			await this.handleIdChanged(props);
		}
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
					isLoading: false,
					isLoadingCitations: false
				});
			}
		}
	}

	async componentDidMount() {
		document.addEventListener('copy', this.handleCopy);
		await this.handleIdChanged(this.props);
	}

	componentWillUnmount() {
		document.removeEventListener('copy', this.handleCopy);
	}

	handleCopy(ev) {
		if(this.copyDataInclude) {
			const formattedMime = exportFormats[this.copyDataInclude].mime;
			const formattedValue = this.getExportData(this.copyDataInclude);
			ev.clipboardData.setData('text/plain', ev.target.value);
			ev.clipboardData.setData(formattedMime, formattedValue);
			ev.preventDefault();
			delete this.copyDataInclude;
		}
	}

	async handleIdChanged(props) {
		let isReadOnly = !!props.match.params.id;
		let citationStyle = this.state.citationStyle;
		let errorMessage = null;

		this.setState({ 
			isReadOnly: undefined,
			isLoading: true
		});

		if(props.match.params.id) {
			try {
				const id = props.match.params.id;
				const remoteData = await fetchFromPermalink(`${props.config.storeUrl}/${id}`);
				if(remoteData && 'items' in remoteData) {
					citationStyle = remoteData.citationStyle || citationStyle;
					this.bibRemote = new ZoteroBib({
						...props.config,
						initialItems: remoteData.items,
						persist: false
					});
				}
			} catch(e) {
				props.history.push('/');
				errorMessage = 'Failed to load citations by id.';
			}
		}

		this.bib = new ZoteroBib({ ...props.config });

		await this.prepareCiteproc(
			citationStyle,
			isReadOnly ? this.bibRemote : this.bib,
			isReadOnly
		);
		
		this.setState({ 
			isReadOnly,
			citationStyle,
			errorMessage,
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
			permalink = `${window.location.origin}/${key}`;
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
			this.bib.itemsRaw.find(item => item.key == itemId)
		);
		this.setState({ citations: this.citations, items: this.items });
	}

	handleCitationStyleChanged(citationStyle) {
		this.setState({
			isLoadingCitations: true,
			citationStyle
		});
	}

	async handleItemUpdate(itemKey, fieldKey, fieldValue) {
		const index = this.bib.items.findIndex(item => item.key === itemKey);

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

	async handleTranslateIdentifier(identifier, multipleSelectedItems = null) {
		this.setState({
			isTranslating: true,
			url: identifier,
			errorMessage: ''
		});

		let isUrl = !!multipleSelectedItems || !isIdentifier(identifier);
		if(identifier || isUrl) {
			try {
				var translationResponse;
				if(isUrl) {
					let url = validateUrl(identifier);
					if(url) {
						this.setState({
							url: url
						});
					}
					if(multipleSelectedItems) {
						translationResponse = await this.bib.translateUrlItems(url, multipleSelectedItems);	
					} else {
						translationResponse = await this.bib.translateUrl(url);
					}
				} else {
					translationResponse = await this.bib.translateIdentifier(identifier);
				}

				switch(translationResponse.result) {
					case ZoteroBib.COMPLETE:
						this.setState({
							url: '',
							isTranslating: false,
							citations: this.citations,
							items: this.items
						});
					break;
					case ZoteroBib.MULTIPLE_ITEMS:
						this.setState({
							isTranslating: false,
							isPickingItem: true,
							multipleChoiceItems: Object.keys(translationResponse.items)
							.map(key => ({
								key,
								value: translationResponse.items[key]
							}))
						});
					break;
					case ZoteroBib.FAILED:
						this.setState({
							errorMessage: 'An error occured when citing this source',
							isTranslating: false,
						});
					break;
				}
			}
			catch(e) {
				this.setState({
					errorMessage: 'An error occured when citing this source',
					isTranslating: false,
				});
			}
		} else {
			this.setState({
				errorMessage: 'Value entered doesn\'t appear to be a valid URL, ISBN, DOI, or PMID',
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

	handleMultipleChoiceCancel() {
		this.setState({
			isPickingItem: false,
			multipleChoiceItems: []
		});
	}

	async handleMultipleChoiceSelect(multipleSelectedItems) {
		this.setState({
			isPickingItem: false,
			multipleChoiceItems: []
		});
		return await this.handleTranslateIdentifier(
			this.state.url,
			multipleSelectedItems.reduce((aggr, item) => {
				aggr[item.key] = item.value;
				return aggr;
			}, {})
		);
	}

	async prepareCiteproc(style, bib, isReadOnly) {
		this.citeproc = await getCiteproc(style, bib);
		// Make URLs and DOIs clickable on permalink pages
		this.citeproc.opt.development_extensions.wrap_url_and_doi = isReadOnly;
	}

	getExportData(format, asFile = false) {
		if(this.citeproc) {
			if(exportFormats[format].include) {
				this.copyDataInclude = exportFormats[format].include;
			}

			const separator = format === 'rtf' ? '\\line ' : '';
			this.citeproc.setOutputFormat(format);
			const bib = this.citeproc.makeBibliography();
			this.citeproc.setOutputFormat('html');
			const fileContents = `${bib[0].bibstart}${bib[1].join(separator)}${bib[0].bibend}`;

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
				.filter(item => item.key)
				.map(item => item.key)
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
			onTranslationRequest = { this.handleTranslateIdentifier.bind(this) }
			onClearError = { this.handleClearErrorMessage.bind(this) }
			onMultipleChoiceCancel = { this.handleMultipleChoiceCancel.bind(this) }
			onMultipleChoiceSelect = { this.handleMultipleChoiceSelect.bind(this) }
			onError = { this.handleError.bind(this) }
			getExportData = { this.getExportData.bind(this) }
			itemsCount = { this.bib ? this.bib.items.filter(i => !!i.key).length : null }
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