import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ZoteroBib from 'zotero-translation-client';
import { useParams, useHistory } from "react-router-dom";
import copy from 'copy-to-clipboard';

import { dedupMultipleChoiceItems, fetchFromPermalink, getOneTimeBibliographyOrFallback,
getExpandedCitationStyles, getCiteproc, isLikeUrl, noop, parseIdentifier,
processMultipleChoiceItems, processSentenceCaseAPAItems, retrieveIndependentStyle,
retrieveStylesData, validateItem, validateUrl } from '../utils';
import { coreCitationStyles } from '../../../data/citation-styles-data.json';
import defaults from '../constants/defaults';
import ZBib from './zbib';
import { useCitationStyle, usePrevious } from '../hooks';

var msgId = 0;
const getNextMessageId = () => ++msgId < Number.MAX_SAFE_INTEGER ? msgId : (msgId = 0);

const BibWebContainer = props => {
	const { id: remoteId } = useParams();
	const history = useHistory();
	const citeproc = useRef(null);
	const bib = useRef(null);
	const copyData = useRef(null);
	const [isCiteprocReady, setIsCiteprocReady] = useState(false);
	const [isDataReady, setIsDataReady] = useState(false);
	const [activeDialog, setActiveDialog] = useState(false);
	const wasDataReady = usePrevious(isDataReady);
	const [messages, setMessages] = useState([]);
	const [bibliography, setBibliography] = useState({ items: [], meta: null, lookup: {} });
	const [citationStyle, setCitationStyle] = useState(
		localStorage.getItem('zotero-bib-citation-style') || coreCitationStyles.find(cs => cs.isDefault).name
	);
	const prevCitationStyle = usePrevious(citationStyle);
	const [citationStyleXml, setCitationStyleXml] = useState(null);
	const [isFetchingStyleXml, setIsFetchingStyleXml] = useState(false);
	const prevCitationStyleXml = usePrevious(citationStyleXml);

	const [isStylesDataLoading, setIsStylesDataLoading] = useState(false);
	const [stylesData, setStylesData] = useState(null);

	const [citationToCopy, setCitationToCopy] = useState(null);
	const [citationCopyModifiers, setCitationCopyModifiers] = useState({});
	const [citationHtml, setCitationHtml] = useState(null);

	const [identifier, setIdentifier] = useState('');
	const [isTranslating, setIsTranslating] = useState(false);
	const [itemUnderReview, setItemUnderReview] = useState(null);
	const [multipleItems, setMultipleItems] = useState(null);
	const [itemToConfirm, setItemToConfirm] = useState(null);
	const [moreItemsLink, setMoreItemsLink] = useState(null);
	const [multipleChoiceItems, setMultipleChoiceItems] = useState(null);
	const [editorItem, setEditorItem] = useState(null);

	const { styleHasBibliography, isNoteStyle, isNumericStyle, isSentenceCaseStyle, isUppercaseSubtitlesStyle } =
		useCitationStyle(citationStyle, citationStyleXml);

	const config = useMemo(() => ({ ...defaults, ...props.config }), [props.config]);
	const isStyleReady = !!citationStyleXml;
	const isReady = isStyleReady && isCiteprocReady && isDataReady;
	const isReadOnly = !!remoteId;

	const [citationStyles, setCitationStyles] = useState([
		...coreCitationStyles.map(cs => ({
			...cs, isDependent: 0, parent: null, isCore: true })
		),
		...(JSON.parse(localStorage.getItem('zotero-bib-extra-citation-styles')) || [])
	]);
	citationStyles.sort((a, b) => a.title.toUpperCase().localeCompare(b.title.toUpperCase()));

	const localCitationsCount = useMemo(() => {
		// parse citations from localstorage so we know how many there are.toUpperCase
		// if not remoteid, we don't care so save don't waste time parsing
		if(remoteId) {
			const localBib = new ZoteroBib(config);
			localBib.reloadItems();
			return localBib.items.length;
		} else {
			return null;
		}
	}, [config, remoteId]);

	const addItem = useCallback(item => {
		if(isSentenceCaseStyle) {
			bib.current.addItem(processSentenceCaseAPAItems([item])[0]);
		} else {
			bib.current.addItem(item);
		}
		if(!localStorage.getItem('zotero-bib-translated')) {
			localStorage.setItem('zotero-bib-translated', 'true');
			// this.displayFirstCitationMessage(); //TODO
		}

		//TODO: optimise in bib
		const itemCSL = bib.current.itemsCSL.find(icsl => icsl.id === item.key)

		citeproc.current.insertReference(itemCSL);
		citeproc.current.insertCluster(({ id: itemCSL.id, cites: [ { id: itemCSL.id } ] }));
		citeproc.current.setClusterOrder(bib.current.itemsRaw.map(item => ({ id: item.key }))).unwrap();
	}, [isSentenceCaseStyle]);

	const deleteItem = useCallback(itemId => {
		const item = bib.current.itemsRaw.find(item => item.key == itemId);
		if(bib.current.removeItem(item)) {
			// TODO MESSAGE, LAST DELETED ITEM
			// const message = {
			// 	id: getNextMessageId(),
			// 	action: 'Undo',
			// 	isUndoMessage: true,
			// 	kind: 'warning',
			// 	message: 'Item Deleted',
			// 	onAction: this.handleUndoDelete.bind(this),
			// 	onDismiss: this.handleDismissUndo.bind(this),
			// };
			// setMessages([
			// 	...this.state.messages.filter(m => !m.isUndoMessage),
			// 	message
			// ]);
			// setLastDeletedItem({ ...item });
			citeproc.current.removeReference(itemId);
			citeproc.current.removeCluster(itemId);
			citeproc.current.setClusterOrder(bib.current.itemsRaw.map(item => ({ id: item.key }))).unwrap();
		}
	}, []);

	const buildBibliography = useCallback(async () => {
		setIsCiteprocReady(false);

		if(citeproc.current) {
			citeproc.current.setStyle(citationStyleXml);
		} else {
			citeproc.current = await getCiteproc(citationStyleXml);
		}

		citeproc.current.includeUncited("All").unwrap();
		citeproc.current.insertReferences(bib.current.itemsCSL).unwrap();

		// we also init every single item as a separate cluster for fallback rendering
		citeproc.current.initClusters(
			bib.current.itemsRaw.map(item => ({ id: item.key, cites: [ { id: item.key } ] }))
		).unwrap();
		citeproc.current.setClusterOrder(bib.current.itemsRaw.map(item => ({ id: item.key }))).unwrap();

		const itemsLookup = bib.current.itemsRaw.reduce((acc, item) => { acc[item.key] = item; return acc }, {});

		if(styleHasBibliography) {
			setBibliography({
				items: citeproc.current.makeBibliography().unwrap(),
				meta: citeproc.current.bibliographyMeta().unwrap(),
				lookup: itemsLookup
			});
		} else {
			const render = citeproc.current.fullRender().unwrap();
			setBibliography({
				items: bib.current.itemsRaw.map(item => ({ id: item.key, value: render.allClusters[item.key] })),
				meta: null,
				lookup: itemsLookup
			});
		}

		setIsCiteprocReady(true);

	}, [citationStyleXml, styleHasBibliography]);

	const fetchRemoteBibliography = useCallback(async () => {
		try {
			const remoteData = await fetchFromPermalink(`${config.storeURL}/${remoteId}`);
			if(remoteData && 'items' in remoteData) {
				const citationStyle = remoteData.citationStyle || citationStyle;
				const title = 'title' in remoteData && remoteData.title || null;

				var citationStyleMeta = citationStyles.find(cs => cs.name === citationStyle);
				if(!citationStyleMeta) {
					const stylesData = await retrieveStylesData(config.stylesURL);
					const newStyleMeta = stylesData.find(sd => sd.name === citationStyle);
					setCitationStyles(getExpandedCitationStyles(citationStyles, newStyleMeta));
				}

				bib.current = new ZoteroBib({
					...config,
					initialItems: remoteData.items,
					persist: false
				});

				setIsDataReady(true);
			}
		} catch(e) {
			history.push('/');
			handleError('Failed to load citations by id', e);
		}
	}, [citationStyles, config, handleError, history, remoteId]);

	const updateBibliography = useCallback(() => {
		const diff = citeproc.current.batchedUpdates().unwrap();
		const itemsLookup = bib.current.itemsRaw.reduce((acc, item) => { acc[item.key] = item; return acc }, {});

		if(diff.bibliography && styleHasBibliography) {
			var newBibliographyItems;
			if(diff.bibliography.entryIds) {
				newBibliographyItems = diff.bibliography.entryIds.map(entryId => ({
					id: entryId,
					value: entryId in diff.bibliography.updatedEntries ?
						diff.bibliography.updatedEntries[entryId] :
						bibliography.items.find(bibItem => bibItem.id === entryId).value
				}));
			} else {
				newBibliographyItems = bibliography.items.map(bibItem => {
					return bibItem.id in diff.bibliography.updatedEntries ?
						{ id: bibItem.id, value: diff.bibliography.updatedEntries[bibItem.id] } :
						bibItem;
				});
			}

			setBibliography({
				...bibliography,
				lookup: itemsLookup,
				items: newBibliographyItems
			});
		} else if(!styleHasBibliography) {
			const newBibliographyItems = [];
			diff.clusters.forEach(([id, value]) => {
				const existingEntry = bibliography.items.find(bibItem => bibItem.id === id);
				if(existingEntry) {
					existingEntry.value = value;
				} else {
					newBibliographyItems.push({ id, value });
				}
			});
			// TODO: cluster removal
			setBibliography({
				...bibliography,
				lookup: itemsLookup,
				items: [...bibliography.items, ...newBibliographyItems]
			});
		}
	}, [bibliography, styleHasBibliography]);

	const handleError = useCallback((message, e) => {
		// TODO: display message
		throw e;
	}, []);

	const handleCitationStyleChanged = useCallback(async ev => {
		const newCitationStyle = ev.value;
		// this.clearMessages(); //@TODO
		// setItemUnderReview(null); //@TODO
		if(newCitationStyle === 'install') {
			setActiveDialog('STYLE_INSTALLER');
			setIsStylesDataLoading(true);
			try {
				setStylesData(await retrieveStylesData(config.stylesURL));
				setIsStylesDataLoading(false);
			} catch(e) {
				handleError(e.message, e);
				setActiveDialog(null);
				setIsStylesDataLoading(false);
			}
		} else {
			setCitationStyle(newCitationStyle);
			localStorage.setItem('zotero-bib-citation-style', newCitationStyle);
		}
	}, [config.stylesURL, handleError]);

	const handleCitationCopyDialogOpen = useCallback(itemId => {
		// this.clearMessages(); //@TODO
		// setItemUnderReview(null); //@TODO
		setActiveDialog('COPY_CITATION');
		setCitationToCopy(itemId);
	}, []);

	const handleCitationCopyDialogClose = useCallback(() => {
		setActiveDialog(null);
		setCitationToCopy(null);
		setCitationHtml(null);
		setCitationCopyModifiers({});
	}, []);

	const handleCitationCopy = useCallback(() => {
		const cites = [ {id: citationToCopy, ...citationCopyModifiers }];
		const positions = [{ }];
		const text = citeproc.current.previewCitationCluster(cites, positions, 'plain').unwrap();
		const html = citationHtml;
		copyData.current = [
			{ mime: 'text/plain', data: text },
			{ mime: 'text/html', data: html },
		];
		return copy(text);
	}, [citationCopyModifiers, citationHtml, citationToCopy]);

	const handleCopyToClipboard = useCallback(ev => {
		if(copyData.current) {
			copyData.current.forEach(copyDataFormat => {
				ev.clipboardData.setData(copyDataFormat.mime, copyDataFormat.data);
			});
			ev.preventDefault();
			copyData.current = null;
		}
	}, []);

	const handleCitationModifierChange = useCallback(citationCopyModifiers => {
		setCitationCopyModifiers(citationCopyModifiers);
	}, []);

	const handleConfirmAddCancel = useCallback(() => {
		setActiveDialog(null);
		setItemToConfirm(null);
	}, []);

	const handleConfirmAddConfirm = useCallback(() => {
		addItem(itemToConfirm.item);
		setItemUnderReview(itemToConfirm.item);
		setActiveDialog(null);
		setItemToConfirm(null);
	}, [addItem, itemToConfirm]);

	const handleDeleteEntry = useCallback((itemId) => {
		setItemUnderReview(null);
		// setPermalink(null); //TODO
		deleteItem(itemId);
		updateBibliography();
	}, [deleteItem, updateBibliography]);

	const handleDeleteCitations = useCallback(() => {
		// TODO
		// this.bib.clearItems();
		// this.clearMessages();
		// this.setState({
		// 	bibliography: this.bibliography,
		// 	items: this.bib.itemsRaw,
		// 	itemUnderReview: null,
		// 	permalink: null,
		// 	title: null,
		// });
	}, []);

	const handleItemCreated = useCallback((item) => {
		addItem(item);
		setEditorItem(item);
		updateBibliography();
		// setPermalink(null);
	}, [addItem, updateBibliography]);

	const handleItemUpdate = useCallback(async (itemKey, patch) => {
		const index = bib.current.itemsRaw.findIndex(item => item.key === itemKey);

		let updatedItem = {
			...bib.current.itemsRaw[index],
			...patch
		};

		try {
			await validateItem(updatedItem);
		} catch(e) {
			handleError('Failed to obtain metadata. Please check your connection and try again.', e);
			return;
		}

		if(isSentenceCaseStyle) {
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
		bib.current.updateItem(index, updatedItem);
		setEditorItem(updatedItem);

		deleteItem(itemKey);
		addItem(updatedItem);
		updateBibliography();

		//TODO
		// if edited item is itemUnderReview, update it as well
		// if(this.state.itemUnderReview && this.state.itemUnderReview.key === itemKey) {
		// 	this.setState({ itemUnderReview: updatedItem });
		// }
	}, [addItem, deleteItem, handleError, isSentenceCaseStyle, updateBibliography]);

	const handleMutipleItemsCancel = useCallback(() => {
		setActiveDialog(null);
		setMultipleItems(null);
	}, []);

	const handleMutipleItemsSelect = useCallback((key) => {
		const item = multipleItems.items.find(i => i.key === key);
		addItem(item);
		setActiveDialog(null);
		setMultipleItems(null);
		setItemUnderReview(null);
		updateBibliography();
	}, [addItem, multipleItems, updateBibliography]);

	const handleOpenEditor = useCallback((itemId = null) => {
		if(itemUnderReview && itemId && itemId != itemUnderReview.key) {
			setItemUnderReview(null);
		}

		// this.clearMessages(); //@TODO
		setEditorItem(bib.current.itemsRaw.find(i => i.key === itemId));
		setActiveDialog('EDITOR');
	}, [itemUnderReview]);

	const handleCloseEditor = useCallback((hasCreatedItem = false) => {
		setEditorItem(null);
		setActiveDialog(null);

		if(hasCreatedItem) {
			if(!localStorage.getItem('zotero-bib-translated')) {
				localStorage.setItem('zotero-bib-translated', 'true');
				// this.displayFirstCitationMessage(); //@TODO
			}
		}
	}, []);

	const handleOverride = useCallback(() => {
		const localBib = new ZoteroBib(config);
		localBib.clearItems();

		bib.current = new ZoteroBib({
			...config,
			initialItems: bib.current.itemsRaw
		});

		history.replace('/');
	}, [config, history]);

	const handleStyleInstallerCancel = () => {
		setActiveDialog(null);
	};

	const handleStyleInstallerDelete = useCallback((deleteStyleMeta) => {
		setCitationStyles(citationStyles.filter(cs => cs.name !== deleteStyleMeta.name ));
	}, [citationStyles]);

	const handleStyleInstallerSelect = useCallback((newStyleMeta) => {
		const newCitationStyles = getExpandedCitationStyles(citationStyles, newStyleMeta);
		setCitationStyles(newCitationStyles);
		setCitationStyle(newStyleMeta.name);
		localStorage.setItem(
			'zotero-bib-extra-citation-styles',
			JSON.stringify(newCitationStyles.filter(cs => !cs.isCore))
		);
		localStorage.setItem('zotero-bib-citation-style', newStyleMeta.name);
	}, [citationStyles]);

	const handleTranslateIdentifier = useCallback(async (identifier, multipleSelectedItems = null, shouldConfirm = false) => {
		identifier = parseIdentifier(identifier);

		// this.clearMessages(); //@TODO
		setIdentifier(identifier);
		setIsTranslating(true);
		setItemUnderReview(null);
		// setPermalink(null); //@TODO

		let isUrl = !!multipleSelectedItems || isLikeUrl(identifier);
		if(identifier || isUrl) {
			try {
				var translationResponse;
				if(isUrl) {
					let url = validateUrl(identifier);
					if(url) {
						setIdentifier(url);
					}
					if(multipleSelectedItems) {
						translationResponse = await bib.current.translateUrlItems(url, multipleSelectedItems, { add: false });
					} else {
						translationResponse = await bib.current.translateUrl(url, { add: false });
					}
				} else {
					translationResponse = await bib.current.translateIdentifier(identifier, { add: false });
				}

				switch(translationResponse.result) {
					case ZoteroBib.COMPLETE:
						if(translationResponse.items.length === 0) {
							setMessages(...messages, {
								id: getNextMessageId(),
								kind: 'info',
								message: 'No results found',
							});
							setIsTranslating(false);
							return;
						}
						var rootItems = translationResponse.items.filter(item => !item.parentItem);

						if(rootItems.length > 1) {
							const reviewBib = new ZoteroBib({
								...config,
								persist: false,
								initialItems: rootItems
							});

							const multipleItems = {
								items: rootItems,
								...(await getOneTimeBibliographyOrFallback(
									reviewBib.itemsCSL, citationStyleXml, styleHasBibliography
								))
							};

							setIdentifier('');
							setIsTranslating(false);
							setActiveDialog('MULTIPLE_ITEMS_DIALOG');
							setMultipleItems(multipleItems);
							return;
						}

						if(shouldConfirm) {
							const reviewBib = new ZoteroBib({
								...config,
								persist: false,
								initialItems: [translationResponse.items[0]]
							});

							const itemToConfirm = {
								item: translationResponse.items[0],
								...(await getOneTimeBibliographyOrFallback(
								reviewBib.itemsCSL, citationStyleXml, styleHasBibliography
								))
							};

							setIdentifier('');
							setIsTranslating(false);
							setActiveDialog('CONFIRM_ADD_DIALOG');
							setItemToConfirm(itemToConfirm);
							return;
						} else {
							addItem(translationResponse.items[0]);
						}

						setIdentifier('');
						setIsTranslating(false);
						updateBibliography();
						setItemUnderReview(translationResponse.items[0]);

					break;
					case ZoteroBib.MULTIPLE_CHOICES:
						setIsTranslating(false);
						setActiveDialog('MULTIPLE_CHOICE_DIALOG');
						setMoreItemsLink('next' in translationResponse.links ? translationResponse.links.next : null);
						setMultipleChoiceItems(dedupMultipleChoiceItems(
							await processMultipleChoiceItems(translationResponse.items, isUrl)
						));
					break;
					case ZoteroBib.FAILED:
						handleError('An error occurred while citing this source.');
						setIsTranslating(false);
					break;
				}
			}
			catch(e) {
				handleError('An error occurred while citing this source.', e);
				setIsTranslating(false);
			}
		} else {
			handleError('Value entered doesn’t appear to be a valid URL or identifier');
			setIsTranslating(false);
		}
	}, [addItem, citationStyleXml, config, handleError, messages, styleHasBibliography, updateBibliography]);

	const fetchCitationStyleXml = useCallback(async () => {
		setIsFetchingStyleXml(true);
		setCitationStyleXml(await retrieveIndependentStyle(citationStyle));
		setIsFetchingStyleXml(false);
	}, [citationStyle]);

	useEffect(() => {
		if(!isCiteprocReady || !citationToCopy) {
			return;
		}

		setTimeout(() => {
			const cites = [ {id: citationToCopy, ...citationCopyModifiers }];
			const positions = [{ }];
			setCitationHtml(
				citeproc.current.previewCitationCluster(cites, positions, 'html').unwrap()
			);
		}, 0);
	}, [isCiteprocReady, citationCopyModifiers, citationToCopy]);

	useEffect(() => {
		const isDataTrigger = typeof(wasDataReady) !== 'undefined' && !wasDataReady && isDataReady;
		const isStyleXmlTrigger = typeof(prevCitationStyleXml) !== 'undefined' && citationStyleXml !== prevCitationStyleXml;
		if(citationStyleXml && (isDataTrigger || (isStyleXmlTrigger && isDataReady))) {
			buildBibliography();
		}
	}, [buildBibliography, citationStyleXml, isDataReady, prevCitationStyleXml, wasDataReady]);

	useEffect(() => {
		if(typeof(prevCitationStyle) !== 'undefined' && citationStyle !== prevCitationStyle) {
			setCitationStyleXml(null);
		}
	}, [citationStyle, prevCitationStyle]);

	useEffect(() => {
		if(citationStyleXml === null && !isFetchingStyleXml) {
			fetchCitationStyleXml();
		}
	}, [citationStyleXml, fetchCitationStyleXml, isFetchingStyleXml]);

	useEffect(() => {
		fetchCitationStyleXml();
		if(remoteId) {
			fetchRemoteBibliography();
		} else {
			bib.current = new ZoteroBib(config);
			bib.current.reloadItems();
			setIsDataReady(true);
		}
		document.addEventListener('copy', handleCopyToClipboard, true);
	}, []);


	return (<ZBib
		bibliography = { bibliography }
		citationCopyModifiers = { citationCopyModifiers }
		citationHtml = { citationHtml }
		citationStyle = { citationStyle }
		citationStyles = { citationStyles }
		editorItem = { editorItem }
		identifier = { identifier }
		isNoteStyle = { isNoteStyle }
		isStylesDataLoading = { isStylesDataLoading }
		isTranslating={ isTranslating }
		isReadOnly={ isReadOnly }
		isReady={ isReady }
		itemUnderReview = { itemUnderReview }
		localCitationsCount = { localCitationsCount }
		messages={ messages }
		moreItemsLink = { moreItemsLink }
		multipleChoiceItems = { multipleChoiceItems }
		activeDialog={ activeDialog }
		onCitationCopyDialogOpen = { handleCitationCopyDialogOpen }
		onCitationCopy = { handleCitationCopy }
		onCitationCopyDialogClose = { handleCitationCopyDialogClose }
		onCitationModifierChange = { handleCitationModifierChange }
		onClearMessage = { noop }
		onConfirmAddCancel = { handleConfirmAddCancel }
		onConfirmAddConfirm = { handleConfirmAddConfirm }
		onDeleteEntry = { handleDeleteEntry }
		onEditorClose = { handleCloseEditor }
		onEditorOpen = { handleOpenEditor }
		onItemCreated = { handleItemCreated }
		onItemUpdate = { handleItemUpdate }
		onMutipleItemsCancel = { handleMutipleItemsCancel }
		onMutipleItemsSelect = { handleMutipleItemsSelect }
		onStyleInstallerCancel = { handleStyleInstallerCancel }
		onStyleInstallerDelete = { handleStyleInstallerDelete }
		onStyleInstallerSelect = { handleStyleInstallerSelect }
		onDismissUndo = { noop }
		onHelpClick = { noop }
		onSaveToZoteroHide = { noop }
		onStyleSwitchCancel = { noop }
		onStyleSwitchConfirm = { noop }
		onTranslationRequest = { handleTranslateIdentifier }
		onCitationStyleChanged={ handleCitationStyleChanged }
		onOverride={ handleOverride }
		onUndoDelete = { noop }
		stylesData={ stylesData }
		styleHasBibliography={ styleHasBibliography }
	/>);
}

export default BibWebContainer;
