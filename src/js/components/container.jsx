import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ZoteroBib from 'zotero-translation-client';
import { useParams, useHistory } from "react-router-dom";
import copy from 'copy-to-clipboard';
import SmoothScroll from 'smooth-scroll';

import { calcOffset, dedupMultipleChoiceItems, fetchFromPermalink, getOneTimeBibliographyOrFallback,
getExpandedCitationStyles, getCiteproc, getItemsCSL, isLikeUrl, noop, parseIdentifier,
processMultipleChoiceItems, processSentenceCaseAPAItems, retrieveIndependentStyle,
retrieveStylesData, saveToPermalink, validateItem, validateUrl } from '../utils';
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
	const [activeDialog, setActiveDialog] = useState(null);
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

	const [title, setTitle] = useState(localStorage.getItem('zotero-bib-title') || '');
	const prevTitle = usePrevious(title);
	const [identifier, setIdentifier] = useState('');
	const [isTranslating, setIsTranslating] = useState(false);
	const [isTranslatingMore, setIsTranslatingMore] = useState(false);
	const [itemUnderReview, setItemUnderReview] = useState(null);
	const [multipleItems, setMultipleItems] = useState(null);
	const [itemToConfirm, setItemToConfirm] = useState(null);
	const [moreItemsLink, setMoreItemsLink] = useState(null);
	const [multipleChoiceItems, setMultipleChoiceItems] = useState(null);
	const [editorItem, setEditorItem] = useState(null);
	const [lastDeletedItem, setLastDeletedItem] = useState(null);
	const [permalink, setPermalink] = useState(null);

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

	const addItem = useCallback((item, showFirstCitationMessage = true)  => {
		if(isSentenceCaseStyle) {
			bib.current.addItem(processSentenceCaseAPAItems([item])[0]);
		} else {
			bib.current.addItem(item);
		}

		if(showFirstCitationMessage && !localStorage.getItem('zotero-bib-translated')) {
			localStorage.setItem('zotero-bib-translated', 'true');
			displayFirstCitationMessage();
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
			citeproc.current.removeReference(itemId);
			citeproc.current.removeCluster(itemId);
			citeproc.current.setClusterOrder(bib.current.itemsRaw.map(item => ({ id: item.key }))).unwrap();
		}
	}, []);

	const displayFirstCitationMessage = useCallback(() => {
		const message = {
			action: 'Read More',
			id: getNextMessageId(),
			kind: 'FIRST_CITATION',
			message: 'Your first citation has been added. Citations are stored locally in your browser.',
			href: '/faq#where-is-my-bibliography-stored'
		};
		setMessages([...messages, message]);
	}, [messages]);

	const displayWelcomeMessage = useCallback(() => {
		const message = {
			action: 'Read More',
			id: getNextMessageId(),
			kind: 'WELCOME_MESSAGE',
			message: 'ZoteroBib is a free service that helps you quickly create a bibliography in any citation style.',
		};
		setMessages([...messages, message]);
	}, [messages]);

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

				setTitle(remoteData?.title);
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

		if(bib.current.itemsRaw.length === 0) {
			setBibliography({ items: [], meta: null, lookup: {} });
			return;
		}

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

	const handleError = useCallback((errorMessage, errorData) => {
		const message = {
			id: getNextMessageId(),
			kind: 'ERROR',
			message: errorMessage,
		};
		setMessages([...messages, message]);
		if(errorData) {
			console.error(errorData); //eslint-disable-line no-console
		}
	}, [messages]);

	const handleCitationStyleChanged = useCallback(async ev => {
		const newCitationStyle = ev.value;
		// this.clearMessages(); //@TODO
		setItemUnderReview(null);
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
		setItemUnderReview(null);
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

	const handleConfirmAddConfirm = useCallback(async () => {
		addItem(itemToConfirm.item);
		// TODO
		setItemUnderReview({
			item: itemToConfirm.items,
			...(await getOneTimeBibliographyOrFallback(
				getItemsCSL(itemToConfirm.items), citationStyleXml, styleHasBibliography
			))
		});
		setActiveDialog(null);
		setItemToConfirm(null);
	}, [addItem, itemToConfirm]);

	const handleDeleteEntry = useCallback((itemId) => {
		const item = bib.current.itemsRaw.find(item => item.key == itemId);
		setItemUnderReview(null);
		setPermalink(null);
		deleteItem(itemId);
		updateBibliography();
		setLastDeletedItem({ ...item });
		const message = {
			id: getNextMessageId(),
			action: 'Undo',
			kind: 'UNDO_DELETE',
			message: 'Item Deleted',
		};
		setMessages([ ...messages.filter(m => m.kind !== 'UNDO_DELETE'), message ]);
	}, [deleteItem, messages, updateBibliography]);

	const handleDeleteCitations = useCallback(() => {
		bib.current.clearItems();
		setMessages([]);
		setItemUnderReview(null);
		setPermalink(null);
		setTitle(null);
		updateBibliography();
	}, [updateBibliography]);

	const handleDismiss = useCallback(id => {
		const message = messages.find(m => m.id === id);
		if(message) {
			if(message.kind === 'UNDO_DELETE') {
				setLastDeletedItem(null);
			}
			setMessages(messages.filter(m => m.id !== id));
		}
	}, [messages]);

	const handleGetStartedClick = useCallback(ev => {
		const target = document.querySelector('.zotero-bib-container');
		(new SmoothScroll()).animateScroll(target, ev.currentTarget, { speed: 1000, speedAsDuration: true });
		document.querySelector('.id-input').focus();
	}, []);

	const handleItemCreated = useCallback((item) => {
		addItem(item, false);
		setEditorItem(item);
		updateBibliography();
		setPermalink(null);
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

	const handleMultipleChoiceCancel = useCallback(() => {
		setActiveDialog(null);
		setMultipleChoiceItems(null);
	}, []);

	const handleMultipleChoiceMore = useCallback(async () => {
		setIsTranslatingMore(true);
		try {
			let { result, items, links } = await bib.current.translateIdentifier(identifier, {
				endpoint: moreItemsLink.url,
				add: false
			});

			switch(result) {
				case ZoteroBib.COMPLETE:
				case ZoteroBib.MULTIPLE_CHOICES:
					setIsTranslatingMore(false);
					setActiveDialog('MULTIPLE_CHOICE_DIALOG');
					setMoreItemsLink('next' in links ? links.next : null);
					setMultipleChoiceItems(dedupMultipleChoiceItems([
						...multipleChoiceItems,
						...(await processMultipleChoiceItems(items))
					]));
				break;
				case ZoteroBib.FAILED:
					handleError('An error occurred while fetching more items.');
					setIsTranslatingMore(false);
				break;
			}
		} catch(e) {
			handleError('An error occurred while fetching more items.', e);
			setIsTranslatingMore(false);
		}
	}, [handleError, identifier, moreItemsLink, multipleChoiceItems]);

	const handleMultipleChoiceSelect = useCallback(async selectedItem => {
		setActiveDialog(null);
		setMultipleChoiceItems(null);

		if(selectedItem.source === 'url') {
			return await handleTranslateIdentifier(identifier,
				{ [selectedItem.key]: selectedItem.value.title }
			);
		} else {
			return await handleTranslateIdentifier(selectedItem.key);
		}
	}, [handleTranslateIdentifier, identifier]);

	const handleMultipleItemsCancel = useCallback(() => {
		setActiveDialog(null);
		setMultipleItems(null);
	}, []);

	const handleMultipleItemsSelect = useCallback(async key => {
		const item = multipleItems.items.find(i => i.key === key);
		addItem(item);
		setActiveDialog(null);
		setMultipleItems(null);
		setItemUnderReview(null);
		setItemUnderReview({
			item,
			...(await getOneTimeBibliographyOrFallback(
			getItemsCSL([item]), citationStyleXml, styleHasBibliography
			))
		});
		updateBibliography();
	}, [addItem, citationStyleXml, multipleItems, styleHasBibliography, updateBibliography]);

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
				displayFirstCitationMessage();
			}
		}
	}, [displayFirstCitationMessage]);

	const handleOverride = useCallback(() => {
		const localBib = new ZoteroBib(config);
		localBib.clearItems();

		bib.current = new ZoteroBib({
			...config,
			initialItems: bib.current.itemsRaw
		});

		history.replace('/');
	}, [config, history]);

	const handleReadMoreClick = useCallback(event => {
		const target = document.querySelector('.zbib-illustration');
		(new SmoothScroll()).animateScroll(target, event.currentTarget, {
			header: '.message',
			offset: calcOffset(),
			speed: 1000, speedAsDuration: true,
		});
		setMessages(messages.filter(m => m.kind !== 'WELCOME_MESSAGE'));
	}, [messages]);

	const handleStyleInstallerCancel = () => {
		setActiveDialog(null);
	};

	const handleReviewDelete = useCallback(() => {
		handleDeleteEntry(itemUnderReview.key);
	}, [handleDeleteEntry, itemUnderReview]);

	const handleReviewDismiss = useCallback(() => {
		setItemUnderReview(null);
	}, []);

	const handleReviewEdit = useCallback(() => {
		handleOpenEditor(itemUnderReview.key);
	}, [handleOpenEditor, itemUnderReview]);

	const handleSave = useCallback(async () => {
		try {
			const key = await saveToPermalink(config.storeURL, {
				title: title,
				citationStyle: citationStyle,
				items: bib.current.itemsRaw
			});
			setPermalink(`${window.location.origin}/${key}`);
		} catch(e) {
			setPermalink(null);
			history.push('/');
			handleError('Failed to upload bibliography', e);
		}
	}, [citationStyle, config, handleError, history, title]);

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

	const handleTitleChange = useCallback(title => {
		setMessages([]);
		setItemUnderReview(null);
		setPermalink(null);
		setTitle(title);
	}, []);

	const handleTranslateIdentifier = useCallback(async (identifier, multipleSelectedItems = null, shouldConfirm = false) => {
		identifier = parseIdentifier(identifier);

		setMessages([]);
		setIdentifier(identifier);
		setIsTranslating(true);
		setItemUnderReview(null);
		setPermalink(null);

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
							setMessages([
								...messages,
								{ id: getNextMessageId(), kind: 'INFO', message: 'No results found', }
							]);
							setIsTranslating(false);
							return;
						}
						var rootItems = translationResponse.items.filter(item => !item.parentItem);

						if(rootItems.length > 1) {
							const multipleItems = {
								items: rootItems,
							...(await getOneTimeBibliographyOrFallback(
									getItemsCSL(rootItems), citationStyleXml, styleHasBibliography
								))
							};

							setIdentifier('');
							setIsTranslating(false);
							setActiveDialog('MULTIPLE_ITEMS_DIALOG');
							setMultipleItems(multipleItems);
							return;
						}

						if(shouldConfirm) {
							const itemToConfirm = {
								item: translationResponse.items[0],
								...(await getOneTimeBibliographyOrFallback(
								getItemsCSL([translationResponse.items[0]]), citationStyleXml, styleHasBibliography
								))
							};

							setIdentifier('');
							setIsTranslating(false);
							setActiveDialog('CONFIRM_ADD_DIALOG');
							setItemToConfirm(itemToConfirm);
							return;
						}

						addItem(translationResponse.items[0]);
						setIdentifier('');
						setIsTranslating(false);
						updateBibliography();
						setItemUnderReview({
							item: translationResponse.items[0],
							...(await getOneTimeBibliographyOrFallback(
							getItemsCSL([translationResponse.items[0]]), citationStyleXml, styleHasBibliography
							))
						});

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

	const handleUndoDelete = useCallback(() => {
		if(lastDeletedItem) {
			addItem(lastDeletedItem);
			updateBibliography();
			setMessages(messages.filter(m => m.kind !== 'UNDO_DELETE'));
			setPermalink(null);
			setLastDeletedItem(null);
		}
	}, [addItem, lastDeletedItem, messages, updateBibliography]);

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
		if(!remoteId && !isReadOnly && !localStorage.getItem('zotero-bib-visited')) {
			localStorage.setItem('zotero-bib-visited', 'true');
			displayWelcomeMessage();
		}
	}, [displayWelcomeMessage, isReadOnly, remoteId])

	useEffect(() => {
		if(title !== prevTitle && typeof(prevTitle) !== 'undefined') {
			localStorage.setItem('zotero-bib-title', title);
		}
	}, [title, prevTitle]);

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
		isReadOnly={ isReadOnly }
		isReady={ isReady }
		isStylesDataLoading = { isStylesDataLoading }
		isTranslating={ isTranslating }
		isTranslatingMore= { isTranslatingMore }
		itemUnderReview = { itemUnderReview }
		localCitationsCount = { localCitationsCount }
		messages={ messages }
		moreItemsLink = { moreItemsLink }
		multipleChoiceItems = { multipleChoiceItems }
		multipleItems= { multipleItems }
		activeDialog= { activeDialog }
		onCitationCopyDialogOpen = { handleCitationCopyDialogOpen }
		onCitationCopy = { handleCitationCopy }
		onCitationCopyDialogClose = { handleCitationCopyDialogClose }
		onCitationModifierChange = { handleCitationModifierChange }
		onClearMessage = { noop }
		onConfirmAddCancel = { handleConfirmAddCancel }
		onConfirmAddConfirm = { handleConfirmAddConfirm }
		onDeleteCitations = { handleDeleteCitations }
		onDeleteEntry = { handleDeleteEntry }
		onDismiss = { handleDismiss }
		onEditorClose = { handleCloseEditor }
		onEditorOpen = { handleOpenEditor }
		onError = { handleError }
		onGetStartedClick = { handleGetStartedClick }
		onItemCreated = { handleItemCreated }
		onItemUpdate = { handleItemUpdate }
		onMultipleChoiceCancel = { handleMultipleChoiceCancel }
		onMultipleChoiceMore = { handleMultipleChoiceMore }
		onMultipleChoiceSelect = { handleMultipleChoiceSelect }
		onMultipleItemsCancel = { handleMultipleItemsCancel }
		onMultipleItemsSelect = { handleMultipleItemsSelect }
		onReviewDelete = { handleReviewDelete }
		onReviewDismiss = { handleReviewDismiss }
		onReviewEdit = { handleReviewEdit }
		onSave = { handleSave }
		onStyleInstallerCancel = { handleStyleInstallerCancel }
		onStyleInstallerDelete = { handleStyleInstallerDelete }
		onStyleInstallerSelect = { handleStyleInstallerSelect }
		onTitleChanged = { handleTitleChange }
		onHelpClick = { noop }
		onReadMore = { handleReadMoreClick }
		onSaveToZoteroHide = { noop }
		onStyleSwitchCancel = { noop }
		onStyleSwitchConfirm = { noop }
		onTranslationRequest = { handleTranslateIdentifier }
		onCitationStyleChanged={ handleCitationStyleChanged }
		onOverride={ handleOverride }
		onUndoDelete = { handleUndoDelete }
		permalink = { permalink }
		stylesData={ stylesData }
		styleHasBibliography={ styleHasBibliography }
		title = { title }
	/>);
}

export default BibWebContainer;
