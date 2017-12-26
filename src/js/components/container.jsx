'use strict';

const React = require('react');
const PropTypes = require('prop-types');
const ZoteroBib = require('zotero-bib');
const exportFormats = require('../constants/export-formats');
const { withRouter } = require('react-router-dom');
const arrayEquals = require('array-equal');
const { fetchFromPermalink, saveToPermalink, getCiteproc, validateItem, validateUrl, isIdentifier, getBibliographyFormatParameters, retrieveStylesData, processSentenceCaseAPAItems } = require('../utils');
const coreCitationStyles = require('../../../data/core-citation-styles.json');
const defaults = require('../constants/defaults');
const ZBib = require('./zbib');

class Container extends React.Component {
	state = {
		config: {
			...defaults,
			...this.props.config
		},
		isLoadingCitations: true,
		isPickingItem: false,
		isStylesDataLoading: false,
		isInstallingStyle: false,
		isReadOnly: undefined,
		isSaving: false,
		isTranslating: false,
		isConfirmingStyleSwitch: false,
		citationStyle: localStorage.getItem('zotero-bib-citation-style') || coreCitationStyles.find(cs => cs.isDefault).name,
		errorMessage: null,
		permalink: null,
		stylesData: null,
		url: '',
		citations: {},
		multipleChoiceItems: [],
		citationStyles: [],
		lastDeletedItem: null
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
				localStorage.setItem('zotero-bib-citation-style', this.state.citationStyle);
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
		if(!this.state.isReadOnly &&
			this.state.citationStyle !== state.citationStyle &&
			this.state.isConfirmingStyleSwitch === state.isConfirmingStyleSwitch
		) {
			if(this.state.citationStyle === 'apa') {
				this.setState({
					citationStyle: state.citationStyle,
					isConfirmingStyleSwitch: true
				});
			}
		}
		if(!arrayEquals(this.state.citationStyles, state.citationStyles)) {
			//@TODO: store extra citation styles in local storage
			localStorage.setItem(
				'zotero-bib-extra-citation-styles',
				JSON.stringify(this.state.citationStyles.filter(cs => !cs.isCore))
			);
			const stylesRemoved = state.citationStyles.filter(cs => !this.state.citationStyles.includes(cs));
			// actually remove style data from local storage
			stylesRemoved.forEach(s => localStorage.removeItem(`style-${s.name}`));
		}
	}

	async componentDidMount() {
		const citationStyles = [
			...coreCitationStyles.map(cs => ({ 
				...cs,
				isDependent: 0,
				parent: null,
				isCore: true 
			})),
			...(JSON.parse(localStorage.getItem('zotero-bib-extra-citation-styles')) || [])
		];
		citationStyles.sort((a, b) => a.title.toUpperCase().localeCompare(b.title.toUpperCase()));
		this.setState({ citationStyles });
		document.addEventListener('copy', this.handleCopy);
		await this.handleIdChanged(this.props);
	}

	componentWillUnmount() {
		document.removeEventListener('copy', this.handleCopy);
	}

	handleCopy(ev) {
		if(this.copyDataInclude) {
			const formattedMime = exportFormats[this.copyDataInclude].mime;
			const bibliography = this.getExportData(this.copyDataInclude);
			const formattedValue = `${bibliography[0].bibstart}${bibliography[1].join('')}${bibliography[0].bibend}`;
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
					var citationStyleMeta = this.state.citationStyles.find(cs => cs.name === citationStyle);
					if(!citationStyleMeta) {
						const stylesData = await retrieveStylesData(this.state.config.stylesUrl, this.props.config.stylesCacheTime);
						citationStyleMeta = stylesData.find(sd => sd.name === citationStyle);
						this.setState({
							citationStyles: this.getExpandedCitationStyles(citationStyleMeta)
						});
					}

					this.bibRemote = new ZoteroBib({
						...this.state.config,
						initialItems: remoteData.items,
						persist: false
					});
				}
			} catch(e) {
				props.history.push('/');
				errorMessage = 'Failed to load citations by id';
			}
		}

		this.bib = new ZoteroBib({ ...this.state.config });

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
			const key = await saveToPermalink(this.state.config.storeUrl, {
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
		const item = this.bib.itemsRaw.find(item => item.key == itemId);

		if(this.bib.removeItem(item)) {
			this.setState({ 
				citations: this.citations,
				items: this.items,
				lastDeletedItem: { ...item }
			});	
		}
	}

	handleUndoDelete() {
		if(this.state.lastDeletedItem) {
			this.handleItemCreated(this.state.lastDeletedItem);
			this.setState({ 
				permalink: null,
				lastDeletedItem: null
			});
		}
	}

	handleDismissUndo() {
		this.setState({ lastDeletedItem: null });
	}

	async handleCitationStyleChanged(citationStyle) {
		if(citationStyle === this.state.citationStyle) {
			return;
		}
		if(citationStyle === 'install') {
			this.setState({
				isStylesDataLoading: true,
				isInstallingStyle: true
			});
			try {
				const stylesData = await retrieveStylesData(this.state.config.stylesUrl, this.props.config.stylesCacheTime);
				this.setState({
					isStylesDataLoading: false,
					stylesData
				});
			} catch(e) {
				this.handleError(e.message);
				this.setState({
					isStylesDataLoading: false,
					isInstallingStyle: false
				});
			}
		} else {
			this.setState({
				isLoadingCitations: true,
				citationStyle
			});
		}
	}

	async handleItemUpdate(itemKey, patch) {
		const index = this.bib.items.findIndex(item => item.key === itemKey);

		let updatedItem = {
			...this.bib.items[index],
			...patch
		};

		try {
			await validateItem(updatedItem);
		} catch(e) {
			this.setState({
				errorMessage: 'Failed to obtain metadata. Please check your connection and try again.'
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
							items: this.items,
							permalink: null,
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
							errorMessage: 'An error occured while citing this source',
							isTranslating: false,
						});
					break;
				}
			}
			catch(e) {
				this.setState({
					errorMessage: 'An error occured while citing this source',
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

	handleStyleInstallerCancel() {
		this.setState({
			isInstallingStyle: false
		});
	}

	handleStyleInstallerSelect(styleMeta) {
		this.handleStyleInstallerInstall(styleMeta);
		this.handleCitationStyleChanged(styleMeta.name);
	}

	handleStyleInstallerInstall(styleMeta) {
		this.setState({ 
			citationStyles: this.getExpandedCitationStyles(styleMeta)
		});
	}

	handleStyleInstallerDelete(styleMeta) {
		this.setState({
			citationStyles: this.state.citationStyles.filter(cs => cs.name !== styleMeta.name )
		});
	}

	handleStyleSwitchConfirm() {
		this.setState({
			citationStyle: 'apa',
			isConfirmingStyleSwitch: false
		});
	}
	
	handleStyleSwitchCancel() {
		this.setState({
			isConfirmingStyleSwitch: false
		});
	}

	async prepareCiteproc(style, bib, isReadOnly) {
		this.citeproc = await getCiteproc(style, bib, this.state.citationStyles);
		// Make URLs and DOIs clickable on permalink pages
		this.citeproc.opt.development_extensions.wrap_url_and_doi = isReadOnly;
	}

	getExpandedCitationStyles(styleMeta) {
		if(this.state.citationStyles.find(cs => cs.name === styleMeta.name)) {
			return this.state.citationStyles;
		}

		const citationStyles = [
			...this.state.citationStyles,
			{
				name: styleMeta.name,
				title: styleMeta.title,
				isDependent: styleMeta.dependent,
				isCore: false
			}
		];

		citationStyles.sort((a, b) => a.title.toUpperCase().localeCompare(b.title.toUpperCase()));
		return citationStyles;
	}

	getExportData(format) {
		var bibliography;
		if(this.citeproc) {
			this.citeproc.setOutputFormat(format);
			bibliography = this.citeproc.makeBibliography();
			// reset back to default
			this.citeproc.setOutputFormat('html');
		}
		return bibliography;
	}

	getCopyData(format) {
		const bibliography = this.getExportData(format);

		if(bibliography) {
			if(exportFormats[format].include) {
				this.copyDataInclude = exportFormats[format].include;
			}
		}
		return `${bibliography[0].bibstart}${bibliography[1].join('')}${bibliography[0].bibend}`;
	}

	async getFileData(format) {
		var fileContents, separator, bibStyle, preamble = '';
		
		if(format === 'ris') {
			try {
				fileContents = await this.bib.exportItems('ris');
			} catch(e) {
				this.handleError(e.message);
				return;
			}
		} else {
			const bibliography = this.getExportData(format);	
			if(format === 'rtf') {
				bibStyle = getBibliographyFormatParameters(bibliography);
				separator = '\\\r\n';
				preamble = `${bibStyle.tabStops.length ? '\\tx' + bibStyle.tabStops.join(' \\tx') + ' ' : ''}\\li${bibStyle.indent} \\fi${bibStyle.firstLineIndent} \\sl${bibStyle.lineSpacing} \\slmult1 \\sa${bibStyle.entrySpacing} `;
			}
			fileContents = `${bibliography[0].bibstart}${preamble}${bibliography[1].join(separator)}${bibliography[0].bibend}`;
		}

		const fileName = `citations.${exportFormats[format].extension}`;
		const file = new File(
			[fileContents],
			fileName,
			{ type: exportFormats[format].mime }
		);
		return file;
	}

	get citations() {
		const bib = this.state.isReadOnly ? this.bibRemote : this.bib;
		if(!bib) {
			return {};
		}
		const items = bib.itemsRaw
				.filter(item => item.key)
				.map(item => item.key);

		if(this.state.citationStyle === 'apa') {
			processSentenceCaseAPAItems(bib.itemsRaw);
		}
		this.citeproc.updateItems(items);
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
			onStyleInstallerCancel = { this.handleStyleInstallerCancel.bind(this) }
			onStyleInstallerSelect = { this.handleStyleInstallerSelect.bind(this) }
			onStyleInstallerInstall = { this.handleStyleInstallerInstall.bind(this) }
			onStyleInstallerDelete = { this.handleStyleInstallerDelete.bind(this) }
			onStyleSwitchConfirm = { this.handleStyleSwitchConfirm.bind(this) }
			onStyleSwitchCancel = { this.handleStyleSwitchCancel.bind(this) }
			onUndoDelete = { this.handleUndoDelete.bind(this) }
			onDismissUndo = { this.handleDismissUndo.bind(this) }
			onError = { this.handleError.bind(this) }
			getCopyData = { this.getCopyData.bind(this) }
			getFileData = { this.getFileData.bind(this) }
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