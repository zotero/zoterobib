'use strict';

const React = require('react');
const PropTypes = require('prop-types');
const SmoothScroll = require('smooth-scroll');
const ZoteroBib = require('zotero-bib');
const exportFormats = require('../constants/export-formats');
const { withRouter } = require('react-router-dom');
const arrayEquals = require('array-equal');
const { fetchFromPermalink,
 saveToPermalink,
 getCiteproc,
 validateItem,
 validateUrl,
 isIdentifier,
 parseIdentifier,
 getBibliographyFormatParameters,
 retrieveStylesData,
 processSentenceCaseAPAItems,
 isApa } = require('../utils');
const { coreCitationStyles } = require('../../../data/citation-styles-data.json');
const defaults = require('../constants/defaults');
const ZBib = require('./zbib');
const formatBib = require('../cite');

const scroll = new SmoothScroll();
var msgId = 0;

const getNextMessageId = () => ++msgId < Number.MAX_SAFE_INTEGER ? msgId : (msgId = 0);

class Container extends React.Component {
	state = {
		//@TODO: bibliography, citations & items should probably be a single variable
		bibliography: [],
		citations: {},
		citationStyle: localStorage.getItem('zotero-bib-citation-style') || coreCitationStyles.find(cs => cs.isDefault).name,
		citationStyles: [],
		config: {
			...defaults,
			...this.props.config
		},
		editorItem: null,
		isConfirmingStyleSwitch: false,
		isEditorOpen: false,
		isInstallingStyle: false,
		isLoadingCitations: true,
		isPickingItem: false,
		isReadOnly: undefined,
		isSaveToZoteroVisible: false,
		isSaving: false,
		isStylesDataLoading: false,
		isTranslating: false,
		lastDeletedItem: null,
		messages: [],
		multipleChoiceItems: [],
		permalink: null,
		stylesData: null,
		title: localStorage.getItem('zotero-bib-title') || null,
		unconfirmedCitationStyle: null,
		url: '',
	}

	constructor(props) {
		super(props);
		this.handleCopy = this.handleCopy.bind(this);
		this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
	}

	clearMessages() {
		this.setState({
			messages: []
		});
	}

	displayWelcomeMessage() {
		const id = getNextMessageId();
		const message = {
			action: 'Read More',
			id,
			isWelcomeMessage: true,
			kind: 'info',
			message: 'ZBib is a free service that helps you quickly create a bibliography in any citation style.',
			onAction: this.handleReadMoreClick.bind(this, id),
		};
		this.setState({
			messages: [...this.state.messages, message]
		});
	}

	displayFirstTranslationMessage() {
		const id = getNextMessageId();
		const message = {
			action: 'Read More',
			id,
			kind: 'success',
			message: 'Your first citation has been added. Citations are stored locally in your browser.',
			onAction: this.handleReadMoreClick.bind(this, id),
		};
		this.setState({
			messages: [...this.state.messages, message]
		});
	}

	async componentDidMount() {
		if(!localStorage.getItem('zotero-bib-visited')) {
			localStorage.setItem('zotero-bib-visited', 'true');
			this.displayWelcomeMessage();
		}

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
		document.addEventListener('visibilitychange', this.handleVisibilityChange);
		await this.handleIdChanged(this.props);


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
			if(isApa(this.state.citationStyle) &&
				this.state.isConfirmingStyleSwitch != state.isConfirmingStyleSwitch
			) {
				let processedItems = processSentenceCaseAPAItems(this.bib.itemsRaw);
				for (let [index, item] of processedItems.entries()) {
					this.bib.updateItem(index, item);
				}
			}
			try {
				await this.prepareCiteproc(
					this.state.citationStyle,
					this.state.isReadOnly ? this.bibRemote : this.bib,
					this.state.isReadOnly
				);
				localStorage.setItem('zotero-bib-citation-style', this.state.citationStyle);
				this.setState({
					citations: this.citations,
					bibliography: this.bibliography
				});
			} catch(e) {
				this.handleError('Failed to obtain selected citation style');
				this.setState({
					citationStyle: state.citationStyle
				});
			} finally {
				this.setState({
					isLoading: false,
					isLoadingCitations: false
				});
			}
		}

		if(!this.state.isReadOnly && this.state.title !== state.title) {
			if(this.state.title) {
				localStorage.setItem('zotero-bib-title', this.state.title);
			} else {
				localStorage.removeItem('zotero-bib-title');
			}
		}

		if(!this.state.isReadOnly &&
			this.state.citationStyle !== state.citationStyle &&
			this.state.isConfirmingStyleSwitch === state.isConfirmingStyleSwitch
		) {
			if(isApa(this.state.citationStyle)) {
				this.clearMessages();
				this.setState({
					citationStyle: state.citationStyle,
					unconfirmedCitationStyle: this.state.citationStyle,
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

	componentWillUnmount() {
		document.removeEventListener('copy', this.handleCopy);
		document.removeEventListener('visibilityChange', this.handleVisibilityChange);
	}

	handleCopy(ev) {
		if(this.copyDataInclude) {
			const formattedMime = exportFormats[this.copyDataInclude].mime;
			ev.clipboardData.setData('text/plain', this.getCopyData('text'));
			ev.clipboardData.setData(formattedMime, this.getCopyData(this.copyDataInclude));
			ev.preventDefault();
			delete this.copyDataInclude;
		}
	}

	async handleVisibilityChange() {
		if(!this.state.isReadOnly && document.visibilityState === 'visible') {
			this.bib.reloadItems();
			this.setState({
				bibliography: this.bibliography,
				citations: this.citations,
				items: this.bib.items,
			});
		}
	}

	async handleIdChanged(props) {
		let isReadOnly = !!props.match.params.id;
		let citationStyle = this.state.citationStyle;
		let title = this.state.title;

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
					title = 'title' in remoteData && remoteData.title || null;
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
				this.handleError('Failed to load citations by id');
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
			title,
			localCitationsCount: this.bib.itemsRaw.length,
			items: isReadOnly ? this.bibRemote.itemsRaw : this.bib.itemsRaw,
			isLoading: false,
		});

	}

	async handleSave() {
		let permalink = null;
		this.setState({ isSaving: true });
		try {
			const key = await saveToPermalink(this.state.config.storeUrl, {
				title: this.state.title,
				citationStyle: this.state.citationStyle,
				items: this.bib.itemsRaw
			});
			permalink = `${window.location.origin}/${key}`;
		} catch(e) {
			this.props.history.push('/');
			this.handleError('Failed to save citations.');
		}
		this.setState({ permalink });
	}

	handleDeleteCitations() {
		this.bib.clearItems();
		this.setState({
			bibliography: this.bibliography,
			citations: this.citations,
			items: this.bib.itemsRaw,
			permalink: null,
			title: null
		});
	}

	handleItemCreated(item) {
		this.setState({ permalink: null });
		this.bib.addItem(item);
		this.setState({
			bibliography: this.bibliography,
			citations: this.citations,
			items: this.bib.itemsRaw,
			editorItem: this.bib.itemsRaw.find(i => i.key === item.key)
		});
	}

	handleOpenEditor(itemId = null) {
		this.clearMessages();
		this.setState({
			isEditorOpen: true,
			editorItem: this.bib.itemsRaw.find(i => i.key === itemId)
		});
	}

	handleCloseEditor() {
		this.setState({
			isEditorOpen: false,
			editorItem: null
		});
	}

	handleDeleteEntry(itemId) {
		this.setState({ permalink: null });
		const item = this.bib.itemsRaw.find(item => item.key == itemId);

		if(this.bib.removeItem(item)) {
			const message = {
				id: getNextMessageId(),
				action: 'Undo',
				isUndoMessage: true,
				autoDismiss: true,
				kind: 'warning',
				message: 'Item Deleted',
				onAction: this.handleUndoDelete.bind(this),
				onDismiss: this.handleDismissUndo.bind(this),
			};
			this.setState({
				bibliography: this.bibliography,
				citations: this.citations,
				items: this.bib.itemsRaw,
				lastDeletedItem: { ...item },
				messages: [
					...this.state.messages.filter(m => !m.isUndoMessage),
					message
				]
			});
		}
	}

	handleUndoDelete() {
		if(this.state.lastDeletedItem) {
			this.handleItemCreated(this.state.lastDeletedItem);
			this.handleClearMessage(this.state.messages.find(m => m.isUndoMessage));
			this.setState({
				permalink: null,
				lastDeletedItem: null
			});
		}
	}

	handleDismissUndo() {
		this.handleClearMessage(this.state.messages.find(m => m.isUndoMessage));
		this.setState({ lastDeletedItem: null });

	}

	async handleCitationStyleChanged(citationStyle) {
		if(citationStyle === this.state.citationStyle) {
			return;
		}
		if(citationStyle === 'install') {
			this.clearMessages();
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
		const index = this.bib.itemsRaw.findIndex(item => item.key === itemKey);

		let updatedItem = {
			...this.bib.itemsRaw[index],
			...patch
		};

		try {
			await validateItem(updatedItem);
		} catch(e) {
			this.handleError('Failed to obtain metadata. Please check your connection and try again.');
			return;
		}

		this.bib.updateItem(index, updatedItem);
		this.setState({
			bibliography: this.bibliography,
			citations: this.citations,
			items: this.bib.itemsRaw,
			editorItem: this.bib.itemsRaw.find(i => i.key === itemKey)
		});
	}

	async handleTranslateIdentifier(identifier, multipleSelectedItems = null) {
		identifier = parseIdentifier(identifier);

		this.setState({
			isTranslating: true,
			identifier,
			messages: []
		});

		let isUrl = !!multipleSelectedItems || !isIdentifier(identifier);
		if(identifier || isUrl) {
			try {
				var translationResponse;
				if(isUrl) {
					let url = validateUrl(identifier);
					if(url) {
						this.setState({ identifier: url });
					}
					if(multipleSelectedItems) {
						translationResponse = await this.bib.translateUrlItems(url, multipleSelectedItems, false);
					} else {
						translationResponse = await this.bib.translateUrl(url, false);
					}
				} else {
					translationResponse = await this.bib.translateIdentifier(identifier, false);
				}

				switch(translationResponse.result) {
					case ZoteroBib.COMPLETE:
						if(isApa(this.state.citationStyle)) {
							this.bib.addItem(processSentenceCaseAPAItems(translationResponse.items)[0]);
						} else {
							this.bib.addItem(translationResponse.items[0]);
						}
						if(!localStorage.getItem('zotero-bib-translated')) {
							localStorage.setItem('zotero-bib-translated', 'true');
							this.displayFirstTranslationMessage();
						}
						this.setState({
							identifier: '',
							isTranslating: false,
							bibliography: this.bibliography,
							citations: this.citations,
							items: this.bib.itemsRaw,
							permalink: null,
						});
					break;
					case ZoteroBib.MULTIPLE_ITEMS:
						this.clearMessages();
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
						this.handleError('An error occurred while citing this source.');
						this.setState({ isTranslating: false });
					break;
				}
			}
			catch(e) {
				this.handleError('An error occurred while citing this source.');
				this.setState({ isTranslating: false });
			}
		} else {
			this.handleError('Value entered doesn\'t appear to be a valid URL, ISBN, DOI, or PMID');
			this.setState({ isTranslating: false });
		}
	}

	handleOverride() {
		this.bib.clearItems();
		this.bib = this.bibRemote;
		this.bib.setItemsStorage(this.bib.itemsRaw);
		delete this.bibRemote;
		this.props.history.replace('/');
		this.setState({ isReadOnly: false });
	}

	handleError(errorMessage) {
		const message = {
			id: getNextMessageId(),
			kind: 'error',
			message: errorMessage,
		};
		this.setState({
			messages: [...this.state.messages, message]
		});
	}

	handleClearMessage(message) {
		message = typeof message === 'number' ?
			this.state.messages.find(m => m.id === message) :
			message;
		this.setState({ messages: this.state.messages.filter(msg => msg != message) });
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
			this.state.identifier,
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
			citationStyle: this.state.unconfirmedCitationStyle,
			isConfirmingStyleSwitch: false,
			unconfirmedCitationStyle: null,
		});
	}

	handleStyleSwitchCancel() {
		this.setState({
			isConfirmingStyleSwitch: false,
			unconfirmedCitationStyle: null,
		});
	}

	handleTitleChange(title) {
		this.setState({
			permalink: null,
			title
		});
	}

	calcOffset() {
		var md = window.matchMedia('(min-width: 768px)');
		return md.matches ? 48 : 24;
	}

	handleReadMoreClick(id, event) {
		const target = document.querySelector('.zbib-illustration');
		scroll.animateScroll(target, event.target, {
			header: '.message',
			offset: this.calcOffset()
		});
		this.handleClearMessage(id);
	}

	handleHelpClick(event) {
		const target = document.querySelector('.zbib-illustration');
		scroll.animateScroll(target, event.target, {offset: this.calcOffset()});
	}

	handleGetStartedClick() {
		const target = document.querySelector('.zotero-bib-container');
		scroll.animateScroll(target);
		document.querySelector('.id-input').focus();
	}

	handleSaveToZoteroShow() {
		this.setState({ isSaveToZoteroVisible: true });
	}
	handleSaveToZoteroHide() {
		this.setState({ isSaveToZoteroVisible: false });
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
		if(format === 'html') {
			return formatBib(bibliography);
		} else {
			return `${bibliography[0].bibstart}${bibliography[1].join('')}${bibliography[0].bibend}`;
		}
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

	get bibliography() {
		const bib = this.state.isReadOnly ? this.bibRemote : this.bib;
		if(!bib) {
			return {};
		}
		const items = bib.itemsRaw
				.filter(item => item.key)
				.map(item => item.key);
		this.citeproc.updateItems(items);
		return this.citeproc.makeBibliography();
	}

	get citations() {
		let bibliography = this.bibliography;
		return bibliography[0].entry_ids.reduce(
			(obj, key, id) => ({
				...obj,
				[key]: bibliography[1][id]
			}), {}
		);
	}


	render() {
		return <ZBib
			getCopyData = { this.getCopyData.bind(this) }
			getFileData = { this.getFileData.bind(this) }
			itemsCount = { this.bib ? this.bib.items.filter(i => !!i.key).length : null }
			onCitationStyleChanged = { this.handleCitationStyleChanged.bind(this) }
			onClearMessage = { this.handleClearMessage.bind(this) }
			onDeleteCitations = { this.handleDeleteCitations.bind(this) }
			onDeleteEntry = { this.handleDeleteEntry.bind(this) }
			onDismissUndo = { this.handleDismissUndo.bind(this) }
			onEditorClose = { this.handleCloseEditor.bind(this) }
			onEditorOpen = { this.handleOpenEditor.bind(this) }
			onError = { this.handleError.bind(this) }
			onGetStartedClick = { this.handleGetStartedClick.bind(this) }
			onHelpClick = { this.handleHelpClick.bind(this) }
			onItemCreated = { this.handleItemCreated.bind(this) }
			onItemUpdate = { this.handleItemUpdate.bind(this) }
			onMultipleChoiceCancel = { this.handleMultipleChoiceCancel.bind(this) }
			onMultipleChoiceSelect = { this.handleMultipleChoiceSelect.bind(this) }
			onOverride = { this.handleOverride.bind(this) }
			onSave = { this.handleSave.bind(this) }
			onSaveToZoteroHide = { this.handleSaveToZoteroHide.bind(this) }
			onSaveToZoteroShow = { this.handleSaveToZoteroShow.bind(this) }
			onStyleInstallerCancel = { this.handleStyleInstallerCancel.bind(this) }
			onStyleInstallerDelete = { this.handleStyleInstallerDelete.bind(this) }
			onStyleInstallerInstall = { this.handleStyleInstallerInstall.bind(this) }
			onStyleInstallerSelect = { this.handleStyleInstallerSelect.bind(this) }
			onStyleSwitchCancel = { this.handleStyleSwitchCancel.bind(this) }
			onStyleSwitchConfirm = { this.handleStyleSwitchConfirm.bind(this) }
			onTitleChanged = { this.handleTitleChange.bind(this) }
			onTranslationRequest = { this.handleTranslateIdentifier.bind(this) }
			onUndoDelete = { this.handleUndoDelete.bind(this) }
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
