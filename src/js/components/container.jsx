/* eslint-disable react/no-deprecated */
// @TODO: migrate to getDerivedStateFromProps()
'use strict';

const React = require('react');
const PropTypes = require('prop-types');
const copy = require('copy-to-clipboard');
const deepEqual = require('deep-equal');
const SmoothScroll = require('smooth-scroll');
const ZoteroBib = require('zotero-translation-client');
const exportFormats = require('../constants/export-formats');
const { withRouter } = require('react-router-dom');
const arrayEquals = require('array-equal');
const {  dedupMultipleChoiceItems,
	fetchFromPermalink,
	getBibliographyFormatParameters,
	getBibliographyOrFallback,
	getCitation,
	getCiteproc,
	isLikeUrl,
	isNoteStyle,
	isNumericStyle,
	isSentenceCaseStyle,
	parseIdentifier,
	processMultipleChoiceItems,
	processSentenceCaseAPAItems,
	retrieveStyle,
	retrieveStylesData,
	saveToPermalink,
	validateItem,
	validateUrl, } = require('../utils');
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
		citationCopyModifiers: {},
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
		isTranslatingMore: false,
		itemUnderReview: null,
		itemUnderReviewBibliography: null,
		lastDeletedItem: null,
		messages: [],
		moreItemsLink: null,
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
		this.handleScroll = this.handleScroll.bind(this);
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
			message: 'Welcome to the beta of my new citation generator.',
			onAction: this.handleReadMoreClick.bind(this, id),
		};
		this.setState({
			messages: [...this.state.messages, message]
		});
	}

	displayFirstCitationMessage() {
		const message = {
			action: 'Read More',
			id: getNextMessageId(),
			kind: 'success',
			message: 'Your first citation has been added. Citations are stored locally in your browser.',
			href: '/faq#where-is-my-bibliography-stored'
		};
		this.setState({
			messages: [...this.state.messages, message]
		});
	}

	displayNoResultsMessage() {
		const message = {
			id: getNextMessageId(),
			kind: 'info',
			message: 'No results found',
		};
		this.setState({
			messages: [...this.state.messages, message]
		});
	}

	async componentDidMount() {
		const params = new URLSearchParams(location.search);
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
		this.setState({ citationStyles, identifier: params.get('q') || '' });
		document.addEventListener('copy', this.handleCopy, true);
		document.addEventListener('visibilitychange', this.handleVisibilityChange);
		document.addEventListener('scroll', this.handleScroll);
		await this.handleIdChanged(this.props);

		if(this.props.match.path === '/import') {
			if(params.has('q')) {
				this.handleTranslateIdentifier(params.get('q'), null, true);
			}
			this.props.history.replace('/');
		}
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
			if(isSentenceCaseStyle(this.state.citationStyle) &&
				this.state.isConfirmingStyleSwitch != state.isConfirmingStyleSwitch
			) {
				let processedItems = processSentenceCaseAPAItems(this.bib.itemsRaw);
				for (let [index, item] of processedItems.entries()) {
					this.bib.updateItem(index, item);
				}
			}

			try {
				const cslData = await retrieveStyle(this.state.citationStyle);
				await this.prepareCiteproc(
					this.state.citationStyle,
					this.state.isReadOnly ? this.bibRemote : this.bib,
					this.state.isReadOnly
				);
				localStorage.setItem('zotero-bib-citation-style', this.state.citationStyle);
				this.setState({
					isNoteStyle: isNoteStyle(cslData),
					isNumericStyle: isNumericStyle(cslData),
					bibliography: this.bibliography
				});
			} catch(e) {
				this.handleError('Failed to obtain selected citation style', e);
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
			if(isSentenceCaseStyle(this.state.citationStyle)) {
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
		}

		if(this.state.itemUnderReview &&
			!deepEqual(this.state.itemUnderReview, state.itemUnderReview)) {
				const reviewBib = new ZoteroBib({
					...this.state.config,
					persist: false,
					initialItems: [this.state.itemUnderReview]
				});
				const reviewCiteproc = await getCiteproc(this.state.citationStyle, reviewBib);
				reviewCiteproc.opt.development_extensions.wrap_url_and_doi = false;
				reviewCiteproc.updateItems([this.state.itemUnderReview.key]);
				const itemUnderReviewBibliography = getBibliographyOrFallback(reviewBib, reviewCiteproc);
				this.setState({ itemUnderReviewBibliography });
		} else if(this.state.itemUnderReviewBibliography && !this.state.itemUnderReview) {
			this.setState({ itemUnderReviewBibliography: null });
		}

		if(this.state.citationToCopy && this.state.isCitationCopyDialogOpen && !state.isCitationCopyDialogOpen) {
			// @TODO: ideally getCitation this would be handled by a Worker however
			// 		  it's impossible to make a structured clone of citeproc

			// for large libraries (above 50 items) add 50ms timeout in order to ensure that
			// browser will render spinner first, before blocking main thread with getCitation()
			const timeout = this.bib.itemsRaw.length > 50 ? 50 : 0;
			setTimeout(() => {
				this.setState({
					citationHtml: getCitation(
						this.bib,
						this.state.citationToCopy,
						null,
						['html'],
						this.citeproc
					).html,
				});
			}, timeout);
		}
	}

	componentWillUnmount() {
		document.removeEventListener('copy', this.handleCopy, true);
		document.removeEventListener('visibilityChange', this.handleVisibilityChange);
		document.removeEventListener('scroll', this.handleScroll);
	}

	handleCopy(ev) {
		if(this.copyDataInclude) {
			this.copyDataInclude.forEach(copyDataFormat => {
				ev.clipboardData.setData(copyDataFormat.mime, copyDataFormat.data);
			});
			ev.preventDefault();
			delete this.copyDataInclude;
		}
	}

	async handleVisibilityChange() {
		if(!this.state.isReadOnly && document.visibilityState === 'visible') {
			this.bib.reloadItems();
			this.setState({
				bibliography: this.bibliography,
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
				const remoteData = await fetchFromPermalink(`${props.config.storeURL}/${id}`);
				if(remoteData && 'items' in remoteData) {
					citationStyle = remoteData.citationStyle || citationStyle;
					title = 'title' in remoteData && remoteData.title || null;
					var citationStyleMeta = this.state.citationStyles.find(cs => cs.name === citationStyle);
					if(!citationStyleMeta) {
						const stylesData = await retrieveStylesData(this.state.config.stylesURL);
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
				this.handleError('Failed to load citations by id', e);
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

		if(!isReadOnly && !localStorage.getItem('zotero-bib-visited')) {
			localStorage.setItem('zotero-bib-visited', 'true');
			this.displayWelcomeMessage();
		}
	}

	async handleSave() {
		let permalink = null;
		this.setState({ isSaving: true });
		try {
			const key = await saveToPermalink(this.state.config.storeURL, {
				title: this.state.title,
				citationStyle: this.state.citationStyle,
				items: this.bib.itemsRaw
			});
			permalink = `${window.location.origin}/${key}`;
		} catch(e) {
			this.props.history.push('/');
			this.handleError('Failed to upload bibliography', e);
		}
		this.setState({ permalink });
	}

	handleDeleteCitations() {
		this.bib.clearItems();
		this.clearMessages();
		this.setState({
			bibliography: this.bibliography,
			items: this.bib.itemsRaw,
			itemUnderReview: null,
			permalink: null,
			title: null,
		});
	}

	handleItemCreated(item) {
		this.bib.addItem(item);
		this.setState({
			bibliography: this.bibliography,
			editorItem: this.bib.itemsRaw.find(i => i.key === item.key),
			items: this.bib.itemsRaw,
			permalink: null,
		});
	}

	handleOpenEditor(itemId = null) {
		if(this.state.itemUnderReview && itemId && itemId != this.state.itemUnderReview.key) {
			this.setState({
				itemUnderReview: null,
			});
		}

		this.clearMessages();
		this.setState({
			isEditorOpen: true,
			editorItem: this.bib.itemsRaw.find(i => i.key === itemId)
		});
	}

	handleCloseEditor(hasCreatedItem = false) {
		this.setState({
			isEditorOpen: false,
			editorItem: null
		});
		if(hasCreatedItem) {
			if(!localStorage.getItem('zotero-bib-translated')) {
				localStorage.setItem('zotero-bib-translated', 'true');
				this.displayFirstCitationMessage();
			}
		}
	}

	handleDeleteEntry(itemId) {
		this.setState({
			itemUnderReview: null,
			permalink: null,
		});
		const item = this.bib.itemsRaw.find(item => item.key == itemId);
		if(this.bib.removeItem(item)) {
			const message = {
				id: getNextMessageId(),
				action: 'Undo',
				isUndoMessage: true,
				kind: 'warning',
				message: 'Item Deleted',
				onAction: this.handleUndoDelete.bind(this),
				onDismiss: this.handleDismissUndo.bind(this),
			};
			this.setState({
				bibliography: this.bibliography,
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
		this.clearMessages();
		this.setState({
			itemUnderReview: null
		});
		if(citationStyle === 'install') {
			this.setState({
				isStylesDataLoading: true,
				isInstallingStyle: true
			});
			try {
				const stylesData = await retrieveStylesData(this.state.config.stylesURL);
				this.setState({
					isStylesDataLoading: false,
					stylesData
				});
			} catch(e) {
				this.handleError(e.message, e);
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
			this.handleError('Failed to obtain metadata. Please check your connection and try again.', e);
			return;
		}

		if(isSentenceCaseStyle(this.state.citationStyle)) {
			const itemsMetaData = JSON.parse(localStorage.getItem('zotero-bib-items-metadata')) || {};

			if(!(itemKey in itemsMetaData)) {
				itemsMetaData[itemKey] = {};
			}

			itemsMetaData[itemKey]['apaEditedKeys'] = [
				...(new Set([
					...(itemsMetaData[itemKey]['apaEditedKeys'] || []),
					...Object.keys(patch)
				]))
			];
			localStorage.setItem('zotero-bib-items-metadata', JSON.stringify(itemsMetaData));
		}
		this.bib.updateItem(index, updatedItem);
		this.setState({
			bibliography: this.bibliography,
			items: this.bib.itemsRaw,
			editorItem: updatedItem
		});
		// if edited item is itemUnderReview, update it as well
		if(this.state.itemUnderReview && this.state.itemUnderReview.key === itemKey) {
			this.setState({ itemUnderReview: updatedItem });
		}
	}

	async handleTranslateIdentifier(identifier, multipleSelectedItems = null, shouldConfirm = false) {
		identifier = parseIdentifier(identifier);

		this.clearMessages();
		this.setState({
			identifier,
			isTranslating: true,
			itemUnderReview: null,
			messages: []
		});

		let isUrl = !!multipleSelectedItems || isLikeUrl(identifier);
		if(identifier || isUrl) {
			try {
				var translationResponse;
				if(isUrl) {
					let url = validateUrl(identifier);
					if(url) {
						this.setState({ identifier: url });
					}
					if(multipleSelectedItems) {
						translationResponse = await this.bib.translateUrlItems(url, multipleSelectedItems, { add: false });
					} else {
						translationResponse = await this.bib.translateUrl(url, { add: false });
					}
				} else {
					translationResponse = await this.bib.translateIdentifier(identifier, { add: false });
				}

				switch(translationResponse.result) {
					case ZoteroBib.COMPLETE:
						if(translationResponse.items.length === 0) {
							this.displayNoResultsMessage();
							this.setState({ isTranslating: false });
							return;
						}
						var rootItems = translationResponse.items.filter(item => !item.parentItem);

						if(rootItems.length > 1) {
							const reviewBib = new ZoteroBib({
								...this.state.config,
								persist: false,
								initialItems: rootItems
							});

							const reviewCiteproc = await getCiteproc(this.state.citationStyle, reviewBib);
							reviewCiteproc.opt.development_extensions.wrap_url_and_doi = false;
							reviewCiteproc.updateItems([translationResponse.items[0].key]);
							const multipleItems = getBibliographyOrFallback(reviewBib, reviewCiteproc);

							this.setState({
								identifier: '',
								isTranslating: false,
								isAddingMultiple: true,
								permalink: null,
								multipleItems
							});
							return;
						}

						if(shouldConfirm) {
							const reviewBib = new ZoteroBib({
								...this.state.config,
								persist: false,
								initialItems: [translationResponse.items[0]]
							});

							const reviewCiteproc = await getCiteproc(this.state.citationStyle, reviewBib);
							reviewCiteproc.opt.development_extensions.wrap_url_and_doi = false;
							reviewCiteproc.updateItems([translationResponse.items[0].key]);
							const itemToConfirm = getBibliographyOrFallback(reviewBib, reviewCiteproc);

							this.setState({
								identifier: '',
								isTranslating: false,
								isConfirmingAdd: true,
								permalink: null,
								itemToConfirm
							});
							return;
						} else {
							this.addItem(translationResponse.items[0]);
						}

						this.setState({
							identifier: '',
							isTranslating: false,
							bibliography: this.bibliography,
							items: this.bib.itemsRaw,
							itemUnderReview: translationResponse.items[0],
							permalink: null,
						});
					break;
					case ZoteroBib.MULTIPLE_CHOICES:
						this.setState({
							isTranslating: false,
							isPickingItem: true,
							moreItemsLink: 'next' in translationResponse.links ? translationResponse.links.next : null,
							multipleChoiceItems: dedupMultipleChoiceItems(
								await processMultipleChoiceItems(translationResponse.items, isUrl)
							)
						});
					break;
					case ZoteroBib.FAILED:
						this.handleError('Not Found. Query returned nothing useful. Maybe try a different identifier.');
						this.setState({ isTranslating: false });
					break;
				}
			}
			catch(e) {
				this.handleError('Not Found. Query returned nothing useful. Maybe try a different identifier.', e);
				this.setState({ isTranslating: false });
			}
		} else {
			this.handleError('Query doesn’t appear to be a valid URL or identifier');
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

	handleError(errorMessage, errorData = null) {
		const message = {
			id: getNextMessageId(),
			kind: 'error',
			message: errorMessage,
		};
		this.setState({
			messages: [...this.state.messages, message]
		});
		if(errorData) {
			console.error(errorData); //eslint-disable-line no-console
		}
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

	async handleMultipleChoiceSelect(selectedItem) {
		this.setState({
			isPickingItem: false,
			multipleChoiceItems: []
		});
		if(selectedItem.source === 'url') {
			return await this.handleTranslateIdentifier(
				this.state.identifier,
				{ [selectedItem.key]: selectedItem.value.title }
			);
		} else {
			return await this.handleTranslateIdentifier(selectedItem.key);
		}
	}

	async handleMultipleChoiceMore() {
		this.setState({
			isTranslatingMore: true
		});
		try {
			let { result, items, links } = await this.bib.translateIdentifier(
				this.state.identifier, {
					endpoint: this.state.moreItemsLink.url,
					add: false
			});
			switch(result) {
				case ZoteroBib.COMPLETE:
				case ZoteroBib.MULTIPLE_ITEMS:
					this.setState({
						isTranslatingMore: false,
						isPickingItem: true,
						moreItemsLink: 'next' in links ? links.next : null,
						multipleChoiceItems: dedupMultipleChoiceItems([
							...this.state.multipleChoiceItems,
							...(await processMultipleChoiceItems(items))
						])
					});
				break;
				case ZoteroBib.FAILED:
					this.handleError('An error occurred while fetching more items.');
					this.setState({ isTranslatingMore: false });
				break;
			}
		} catch(e) {
			this.handleError('An error occurred while fetching more items.', e);
			this.setState({ isTranslatingMore: false });
		}
	}

	handleMutipleItemsCancel() {
		this.setState({
			isAddingMultiple: false,
			multipleItems: {}
		});
	}

	handleMutipleItemsSelect(key) {
		const item = this.state.multipleItems.items.find(i => i.key === key);
		this.addItem(item);
		this.setState({
			bibliography: this.bibliography,
			isAddingMultiple: false,
			items: this.bib.itemsRaw,
			multipleItems: null,
			itemUnderReview: item,
		});
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
		this.clearMessages();
		this.setState({
			itemUnderReview: null,
			permalink: null,
			title
		});
	}

	handleReadMoreClick(id, event) {
		const target = document.querySelector('.howto');
		scroll.animateScroll(target, event.target, {
			header: '.message',
			offset: this.calcOffset()
		});
		this.handleClearMessage(id);
	}

	handleHelpClick(event) {
		const target = document.querySelector('.howto');
		scroll.animateScroll(target, event.target, {offset: this.calcOffset()});
	}

	handleGetStartedClick() {
		const target = document.querySelector('.schroeder-bib-container');
		scroll.animateScroll(target);
		document.querySelector('.id-input').focus();
	}

	handleSaveToZoteroShow() {
		this.setState({ isSaveToZoteroVisible: true });
	}

	handleSaveToZoteroHide() {
		this.setState({ isSaveToZoteroVisible: false });
	}

	handleCitationCopyDialogOpen(itemId) {
		this.clearMessages();
		this.setState({
			citationToCopy: itemId,
			isCitationCopyDialogOpen: true,
			itemUnderReview: null,
		});
	}

	handleCitationModifierChange(citationCopyModifiers) {
		this.setState({
			citationCopyModifiers,
			citationHtml: getCitation(
					this.bib,
					this.state.citationToCopy,
					citationCopyModifiers,
					['html'],
					this.citeproc,
					true
				).html
		});
	}

	handleCitationCopy() {
		// HTML is generated for the dialog, but we need a text version too for the clipboard
		var text = getCitation(
			this.bib,
			this.state.citationToCopy,
			this.state.citationCopyModifiers,
			['text'],
			this.citeproc,
			true
		).text;
		var html = this.state.citationHtml;
		this.copyDataInclude = [
			{ mime: 'text/plain', data: text },
			{ mime: 'text/html', data: html },
		];
		return copy(text);
	}

	handleCitationCopyCancel() {
		this.setState({
			isCitationCopyDialogOpen: false,
			citationToCopy: null,
			citationCopyModifiers: {},
			citationHtml: null
		});
	}

	handleConfirmAddCancel() {
		this.setState({
			isConfirmingAdd: false,
			itemToConfirm: null
		});
	}

	handleConfirmAddConfirm() {
		this.addItem(this.state.itemToConfirm.items[0]);
		this.setState({
			bibliography: this.bibliography,
			isConfirmingAdd: false,
			items: this.bib.itemsRaw,
			itemToConfirm: null,
			itemUnderReview: this.state.itemToConfirm.items[0],
		});
	}

	handleReviewDelete() {
		this.handleDeleteEntry(this.state.itemUnderReview.key);
	}

	handleReviewDismiss() {
		this.setState({ itemUnderReview: null });
	}

	handleReviewEdit() {
		this.handleOpenEditor(this.state.itemUnderReview.key);
	}

	handleScroll() {
		if(!this.state.messages.find(m => m.isWelcomeMessage)) {
			return;
		}
		const target = document.querySelector('.howto');
		const isScrolledToIllustration = window.pageYOffset > target.offsetTop;
		if(isScrolledToIllustration) {
			this.setState({
				messages: this.state.messages.filter(m => !m.isWelcomeMessage)
			})
		}
	}

	calcOffset() {
		var md = window.matchMedia('(min-width: 768px)');
		return md.matches ? 48 : 24;
	}

	addItem(item) {
		if(isSentenceCaseStyle(this.state.citationStyle)) {
			this.bib.addItem(processSentenceCaseAPAItems([item])[0]);
		} else {
			this.bib.addItem(item);
		}
		if(!localStorage.getItem('zotero-bib-translated')) {
			localStorage.setItem('zotero-bib-translated', 'true');
			this.displayFirstCitationMessage();
		}
	}

	async prepareCiteproc(style, bib, isReadOnly) {
		this.citeproc = await getCiteproc(style, bib);
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
		const copyData = format === 'html' ?
			formatBib(bibliography) :
			`${bibliography[0].bibstart}${bibliography[1].join('')}${bibliography[0].bibend}`;

		if(bibliography) {
			if(exportFormats[format].include) {
				this.copyDataInclude = [
				{
					mime: exportFormats[format].mime,
					data: copyData
				},
				{
					mime: exportFormats[exportFormats[format].include].mime,
					data: this.getCopyData(exportFormats[format].include)
				}];
			}
		}

		return copyData;
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
		} else if(format === 'bibtex') {
			try {
				fileContents = await this.bib.exportItems('bibtex');
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
		if(!bib || !this.citeproc) {
			return {};
		}
		return getBibliographyOrFallback(bib, this.citeproc);
	}

	render() {
		return <ZBib
			getCopyData = { this.getCopyData.bind(this) }
			getFileData = { this.getFileData.bind(this) }
			onCitationCopy = { this.handleCitationCopy.bind(this) }
			onCitationCopyCancel = { this.handleCitationCopyCancel.bind(this) }
			onCitationCopyDialogOpen = { this.handleCitationCopyDialogOpen.bind(this) }
			onCitationModifierChange = { this.handleCitationModifierChange.bind(this) }
			onCitationStyleChanged = { this.handleCitationStyleChanged.bind(this) }
			onClearMessage = { this.handleClearMessage.bind(this) }
			onConfirmAddCancel = { this.handleConfirmAddCancel.bind(this) }
			onConfirmAddConfirm = { this.handleConfirmAddConfirm.bind(this) }
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
			onMultipleChoiceMore = { this.handleMultipleChoiceMore.bind(this) }
			onMultipleChoiceSelect = { this.handleMultipleChoiceSelect.bind(this) }
			OnMutipleItemsCancel = { this.handleMutipleItemsCancel.bind(this) }
			OnMutipleItemsSelect = { this.handleMutipleItemsSelect.bind(this) }
			onOverride = { this.handleOverride.bind(this) }
			onReviewDelete = { this.handleReviewDelete.bind(this) }
			onReviewDismiss = { this.handleReviewDismiss.bind(this) }
			onReviewEdit = { this.handleReviewEdit.bind(this) }
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
