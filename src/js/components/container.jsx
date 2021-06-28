import React, { memo, useCallback, useEffect, useMemo, useRef, useState, useReducer } from 'react';
import ZoteroBib from 'zotero-translation-client';
import { useParams, useLocation, useHistory } from "react-router-dom";
import copy from 'copy-to-clipboard';
import SmoothScroll from 'smooth-scroll';

import { calcOffset, dedupMultipleChoiceItems, ensureNoBlankItems, fetchFromPermalink,
fetchWithCachedFallback, getOneTimeBibliographyOrFallback, getExpandedCitationStyles, getItemsCSL,
isLikeUrl, parseIdentifier, processMultipleChoiceItems, processSentenceCaseAPAItems,
retrieveStylesData, saveToPermalink, validateItem, validateUrl } from '../utils';
import { coreCitationStyles } from '../../../data/citation-styles-data.json';
import defaults from '../constants/defaults';
import exportFormats from '../constants/export-formats';
import ZBib from './zbib';
import { usePrevious } from '../hooks';
import { formatBib, formatFallback, getBibliographyFormatParameters } from '../cite';
import CiteprocWrapper from '../citeproc-wrapper';
import { pick } from '../immutable';
import { getStyleProperties } from '../get-style-properties';

var msgId = 0;
const getNextMessageId = () => ++msgId < Number.MAX_SAFE_INTEGER ? msgId : (msgId = 0);
const stylesCache = new Map();

const CONFIRM_CURRENT_STYLE = 'CONFIRM_CURRENT_STYLE';
const ERROR_FETCH_STYLE = 'ERROR_FETCH_STYLE';
const RECEIVE_FETCH_STYLE = 'RECEIVE_FETCH_STYLE';
const REQUEST_FETCH_STYLE = 'REQUEST_FETCH_STYLE';
const SELECT_CURRENT_STYLE = 'SELECT_CURRENT_STYLE';
const BEGIN_BUILD_BIBLIOGRAPHY = 'BEGIN_BUILD_BIBLIOGRAPHY';
const COMPLETE_BUILD_BIBLIOGRAPHY = 'COMPLETE_BUILD_BIBLIOGRAPHY';
const COMPLETE_REFRESH_BIBLIOGRAPHY = 'COMPLETE_BUILD_BIBLIOGRAPHY';
const BIBLIOGRAPHY_SOURCE_REPLACED = 'BIBLIOGRAPHY_SOURCE_REPLACED';
const BIBLIOGRAPHY_SOURCE_CHANGED = 'BIBLIOGRAPHY_SOURCE_CHANGED';
const CLEAR_MESSAGE = 'CLEAR_MESSAGE';
const REPLACE_MESSAGE = 'REPLACE_MESSAGE';
const POST_MESSAGE = 'POST_MESSAGE';
const CLEAR_ALL_MESSAGES = 'CLEAR_ALL_MESSAGES';

const fetchAndSelectStyle = async (dispatch, styleName, opts = {}) => {
	dispatch({ type: REQUEST_FETCH_STYLE, styleName });
	let nextStyleName = styleName, styleXml, styleProps;

	do {
		if(stylesCache.has(styleName)) {
			styleXml = stylesCache.get(styleName);
		} else {
			const url = `https://www.zotero.org/styles/${styleName}`;
			try {
				const response = await fetchWithCachedFallback(url);
				if(!response.ok) {
					throw new Error(`Failed to fetch ${styleName} from ${url}`);
				}
				styleXml = await response.text();
			} catch(error) {
				dispatch({ type: ERROR_FETCH_STYLE, styleName, error });
				throw error;
			}
			stylesCache.set(styleName, styleXml);
		}
		styleProps = getStyleProperties(styleXml);
		const { parentStyleName } = styleProps
		nextStyleName = parentStyleName;
	} while(nextStyleName);

	dispatch({
		type: RECEIVE_FETCH_STYLE, styleName, styleXml, styleProps, ...opts
	});

	dispatch({
		type: SELECT_CURRENT_STYLE, styleName, styleXml, styleProps, ...opts
	});
}

const confirmStyle = dispatch => dispatch({ type: CONFIRM_CURRENT_STYLE });

const reducer = (state, action) => {
	switch(action.type) {
		case REQUEST_FETCH_STYLE:
			return { ...state, isFetching: true };
		case RECEIVE_FETCH_STYLE:
		case ERROR_FETCH_STYLE:
			return { ...state, isFetching: false };
		case SELECT_CURRENT_STYLE:
			return {
				...state,
				bibliographyNeedsRebuild: true,
				selected: action.styleName,
				xml: action.styleXml,
				isConfirmed: typeof(action.isConfirmed) === 'boolean' ? action.isConfirmed : !action.styleProps.isSentenceCaseStyle,
				...pick(
					action.styleProps,
					['styleHasBibliography', 'isNumericStyle', 'isNoteStyle', 'isUppercaseSubtitlesStyle', 'isSentenceCaseStyle']
				)
			}
		case CONFIRM_CURRENT_STYLE:
			return {
				...state,
				isConfirmed: true
			}
		case BEGIN_BUILD_BIBLIOGRAPHY:
			return {
				...state,
				isCiteprocReady: false,
			}
		case COMPLETE_BUILD_BIBLIOGRAPHY:
			return {
				...state,
				bibliography: pick(action, ['items', 'meta', 'lookup']),
				isCiteprocReady: true,
				bibliographyNeedsRebuild: false,
				bibliographyNeedsRefresh: false,
			}
		case COMPLETE_REFRESH_BIBLIOGRAPHY:
			return {
				...state,
				bibliography: pick(action, ['items', 'lookup']),
				bibliographyNeedsRefresh: false,
			}
		case BIBLIOGRAPHY_SOURCE_REPLACED:
			return {
				...state, isCiteprocReady: false, bibliographyNeedsRebuild: true,
			}
		case BIBLIOGRAPHY_SOURCE_CHANGED:
			return {
				...state, bibliographyNeedsRefresh: true,
			}
		case CLEAR_MESSAGE:
			return {
				...state,
				messages: state.messages.filter(m => 'id' in action ? m.id !== action.id : m.kind !== action.kind)
			}
		case REPLACE_MESSAGE:
			return {
				...state,
				messages: [...state.messages.filter(m => m.kind !== action.kind), action.message]
			}
		case POST_MESSAGE:
			return {
				...state,
				messages: [...state.messages, action.message]
			}
		case CLEAR_ALL_MESSAGES:
			return { ...state, messages: [] }
	}
	return state;
}


const BibWebContainer = props => {
	const { id: remoteId } = useParams();
	const history = useHistory();
	const location = useLocation();
	const citeproc = useRef(null);
	const bib = useRef(null);
	const copyData = useRef(null);
	const copyDataInclude = useRef(null);
	const revertCitationStyle = useRef(null);
	const lastDeletedItem = useRef(null);
	const [isDataReady, setIsDataReady] = useState(false);
	const [activeDialog, setActiveDialog] = useState(null);
	const wasDataReady = usePrevious(isDataReady);
	const isReadOnly = !!remoteId;

	const [state, dispatch] = useReducer(reducer, {
		selected: undefined,
		xml: undefined,
		isFetching: false,
		styleHasBibliography: undefined,
		isNumericStyle: undefined,
		isNoteStyle: undefined,
		isUppercaseSubtitlesStyle: undefined,
		isSentenceCaseStyle: undefined,
		isConfirmed: undefined,
		bibliography: { items: [], meta: null, lookup: {} },
		bibliographyNeedsRefresh: false,
		bibliographyNeedsRebuild: false,
		isCiteprocReady: false,
		messages: [],
	});

	const prevCitationStyle = usePrevious(state.selected);
	const [isStylesDataLoading, setIsStylesDataLoading] = useState(false);
	const [stylesData, setStylesData] = useState(null);

	const [citationToCopy, setCitationToCopy] = useState(null);
	const [citationCopyModifiers, setCitationCopyModifiers] = useState({});
	const [citationHtml, setCitationHtml] = useState(null);

	const [title, setTitle] = useState(remoteId ? '' : localStorage.getItem('zotero-bib-title') || '');
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
	const [permalink, setPermalink] = useState(null);
	const [isQueryHandled, setIsQueryHandled] = useState(location.pathname !== '/import');

	const wasSentenceCaseStyle = usePrevious(state.isSentenceCaseStyle);
	const config = useMemo(() => ({ ...defaults, ...props.config }), [props.config]);
	const useLegacy = useRef(true);
	const isStyleReady = state.selected && state.isConfirmed && !state.isFetching;

	const isReady = isStyleReady && state.isCiteprocReady && isDataReady && isQueryHandled;

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

	const buildBibliography = useCallback(async () => {
		dispatch({ type: BEGIN_BUILD_BIBLIOGRAPHY });

		if(citeproc.current) {
			citeproc.current.setStyle(state.xml);
		} else {
			citeproc.current = await CiteprocWrapper.new({
				style: state.xml,
				format: 'html',
				wrap_url_and_doi: isReadOnly
			}, useLegacy.current);
		}

		const t0 = performance.now();
		citeproc.current.includeUncited("All");
		citeproc.current.insertReferences(ensureNoBlankItems(bib.current.itemsCSL));

		let items, meta;
		const lookup = bib.current.itemsRaw.reduce((acc, item) => { acc[item.key] = item; return acc }, {});


		if(state.styleHasBibliography) {
			citeproc.current.initClusters([]);
			items = citeproc.current.makeBibliography();
			meta = citeproc.current.bibliographyMeta();
			const t1 = performance.now();
			console.log(`Engine: ${useLegacy.current ? 'JS' : 'RS'}; ${bib.current.itemsRaw.length} items; Bibliography generation took ${(t1 - t0).toFixed(2)} milliseconds.`);
		} else {
			// init every single item as a separate cluster for fallback rendering
			citeproc.current.initClusters(
				bib.current.itemsRaw.map(item => ({ id: item.key, cites: [ { id: item.key } ] }))
			);
			citeproc.current.setClusterOrder(bib.current.itemsRaw.map(item => ({ id: item.key })));
			const render = citeproc.current.fullRender();
			const t1 = performance.now();
			console.log(`Engine: ${useLegacy.current ? 'JS' : 'RS'}; ${bib.current.itemsRaw.length} items; Bibliography generation took ${(t1 - t0).toFixed(2)} milliseconds.`);
			items = bib.current.itemsRaw.map(item => ({ id: item.key, value: render.allClusters[item.key] }));
			meta = null;
		}

		dispatch({ type: COMPLETE_BUILD_BIBLIOGRAPHY, items, meta, lookup });
	}, [isReadOnly, state.xml, state.styleHasBibliography]);

	const updateBibliography = useCallback(() => {
		const t0 = performance.now();
		const diff = citeproc.current.batchedUpdates();
		const t1 = performance.now();
		console.log(`Engine: ${useLegacy.current ? 'JS' : 'RS'}; Bibliography update took ${(t1 - t0).toFixed(2)} milliseconds.`);

		if(bib.current.itemsRaw.length === 0) {
			dispatch({ type: COMPLETE_REFRESH_BIBLIOGRAPHY, items: [], lookup: {} });
			return;
		}

		const lookup = bib.current.itemsRaw.reduce((acc, item) => { acc[item.key] = item; return acc }, {});
		let items;

		if(diff.bibliography && state.styleHasBibliography) {
			if(diff.bibliography.entryIds) {
				items = diff.bibliography.entryIds.map(entryId => ({
					id: entryId,
					value: entryId in diff.bibliography.updatedEntries ?
						diff.bibliography.updatedEntries[entryId] :
						state.bibliography.items.find(bibItem => bibItem.id === entryId).value
				}));
			} else {
				items = state.bibliography.items.map(bibItem => {
					return bibItem.id in diff.bibliography.updatedEntries ?
						{ id: bibItem.id, value: diff.bibliography.updatedEntries[bibItem.id] } :
						bibItem;
				});
			}

		} else if(!state.styleHasBibliography) {
			const newBibliographyItems = [];
			diff.clusters.forEach(([id, value]) => {
				const existingEntry = state.bibliography.items.find(bibItem => bibItem.id === id);
				if(existingEntry) {
					existingEntry.value = value;
				} else {
					newBibliographyItems.push({ id, value });
				}
			});

			items = [...state.bibliography.items.filter(i => i.id in lookup), ...newBibliographyItems];
		}
		dispatch({ type: COMPLETE_REFRESH_BIBLIOGRAPHY, lookup, items });
	}, [state.styleHasBibliography, state.bibliography]);

	const addItem = useCallback((item, showFirstCitationMessage = true)  => {
		if(state.isSentenceCaseStyle) {
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

		citeproc.current.insertReference(ensureNoBlankItems([itemCSL])[0]);
		if(!state.styleHasBibliography) {
			citeproc.current.insertCluster(({ id: itemCSL.id, cites: [ { id: itemCSL.id } ] }));
			citeproc.current.setClusterOrder(bib.current.itemsRaw.map(item => ({ id: item.key })));
		}
	}, [displayFirstCitationMessage, state.isSentenceCaseStyle, state.styleHasBibliography]);

	const deleteItem = useCallback(itemId => {
		const item = bib.current.itemsRaw.find(item => item.key == itemId);
		if(bib.current.removeItem(item)) {
			citeproc.current.removeReference(itemId);

			if(!state.styleHasBibliography) {
				citeproc.current.removeCluster(itemId);
				citeproc.current.setClusterOrder(bib.current.itemsRaw.map(item => ({ id: item.key })));
			}
		}
	}, [state.styleHasBibliography]);

	const displayFirstCitationMessage = useCallback(() => {
		const message = {
			action: 'Read More',
			id: getNextMessageId(),
			kind: 'FIRST_CITATION',
			message: 'Your first citation has been added. Citations are stored locally in your browser.',
			href: '/faq#where-is-my-bibliography-stored'
		};
		dispatch({ type: REPLACE_MESSAGE, kind: 'WELCOME_MESSAGE', message });
	}, []);

	const displayWelcomeMessage = useCallback(() => {
		const message = {
			action: 'Read More',
			id: getNextMessageId(),
			kind: 'WELCOME_MESSAGE',
			message: 'ZoteroBib is a free service that helps you quickly create a bibliography in any citation style.',
		};
		dispatch({ type: POST_MESSAGE, message });
	}, []);

	const fetchRemoteBibliography = useCallback(async () => {
		try {
			const remoteData = await fetchFromPermalink(`${config.storeURL}/${remoteId}`);
			if(remoteData && 'items' in remoteData) {
				if(remoteData.citationStyle) {
					await fetchAndSelectStyle(dispatch, remoteData.citationStyle, { isConfirmed: true });

					var citationStyleMeta = citationStyles.find(cs => cs.name === remoteData.citationStyle);
					if(!citationStyleMeta) {
						const stylesData = await retrieveStylesData(config.stylesURL);
						const newStyleMeta = stylesData.find(sd => sd.name === remoteData.citationStyle);
						setCitationStyles(getExpandedCitationStyles(citationStyles, newStyleMeta));
					}
				}

				bib.current = new ZoteroBib({
					...config,
					initialItems: remoteData.items,
					persist: false
				});

				setTitle(remoteData?.title ?? '');
				setIsDataReady(true);
			}
		} catch(e) {
			history.push('/');
			handleError('Failed to load citations by id', e);
		}
	}, [citationStyles, config, handleError, history, remoteId]);

	const getCopyData = useCallback(async format => {
		const { bibliographyItems, bibliographyMeta } = await getOneTimeBibliographyOrFallback(
			bib.current.itemsCSL, state.xml, state.styleHasBibliography, useLegacy.current, { format }
		);

		if(bibliographyItems) {
			const copyData = format === 'html' ?
				state.styleHasBibliography ?
					formatBib(bibliographyItems, bibliographyMeta) :
					formatFallback(bibliographyItems) :
				bibliographyItems.map(i => i.value).join('\n');


			if(exportFormats[format].include) {
				copyDataInclude.current = [
				{
					mime: exportFormats[format].mime,
					data: copyData
				},
				{
					mime: exportFormats[exportFormats[format].include].mime,
					data: await getCopyData(exportFormats[format].include)
				}];
			}
			return copyData;
		}

		return '';
	}, [state.xml, state.styleHasBibliography]);

	const getFileData = useCallback(async format => {
		var fileContents, separator, bibStyle, preamble = '';

		if(format === 'ris') {
			try {
				fileContents = await bib.current.exportItems('ris');
			} catch(e) {
				handleError(e.message);
				return;
			}
		} else if(format === 'bibtex') {
			try {
				fileContents = await bib.current.exportItems('bibtex');
			} catch(e) {
				handleError(e.message);
				return;
			}
		} else {
			const { bibliographyItems, bibliographyMeta } = await getOneTimeBibliographyOrFallback(
				bib.current.itemsCSL, state.xml, state.styleHasBibliography, useLegacy.current, { format }
			);

			if(format === 'rtf') {
				bibStyle = getBibliographyFormatParameters(bibliographyMeta);
				separator = '\\\r\n';
				preamble = `${bibStyle.tabStops.length ? '\\tx' + bibStyle.tabStops.join(' \\tx') + ' ' : ''}\\li${bibStyle.indent} \\fi${bibStyle.firstLineIndent} \\sl${bibStyle.lineSpacing} \\slmult1 \\sa${bibStyle.entrySpacing} `;
			}
			fileContents = `{\\rtf ${bibliographyMeta?.formatMeta?.markupPre || ''}${preamble}${bibliographyItems.map(i => i.value).join(separator)}${bibliographyMeta?.formatMeta?.markupPost || ''}}`;
		}

		const fileName = `citations.${exportFormats[format].extension}`;
		const file = new File(
			[fileContents],
			fileName,
			{ type: exportFormats[format].mime }
		);
		return file;
	}, [handleError, state.xml, state.styleHasBibliography]);

	const handleError = useCallback((errorMessage, errorData) => {
		const message = {
			id: getNextMessageId(),
			kind: 'ERROR',
			message: errorMessage,
		};
		dispatch({ type: POST_MESSAGE, message });
		if(errorData) {
			console.error(errorData); //eslint-disable-line no-console
		}
	}, []);

	const handleCitationStyleChanged = useCallback(async newCitationStyle => {
		dispatch({ type: CLEAR_ALL_MESSAGES });
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
			fetchAndSelectStyle(dispatch, newCitationStyle);
			localStorage.setItem('zotero-bib-citation-style', newCitationStyle);
		}
	}, [config.stylesURL, handleError]);

	const handleCitationCopyDialogOpen = useCallback(itemId => {
		dispatch({ type: CLEAR_ALL_MESSAGES });
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
		const text = citeproc.current.previewCitationCluster(cites, positions, 'plain');
		const html = citationHtml;
		copyData.current = [
			{ mime: 'text/plain', data: text },
			{ mime: 'text/html', data: html },
		];
		return copy(text);
	}, [citationCopyModifiers, citationHtml, citationToCopy]);

	const handleCopyToClipboard = useCallback(ev => {
		if(copyDataInclude.current) {
			copyDataInclude.current.forEach(copyDataFormat => {
				ev.clipboardData.setData(copyDataFormat.mime, copyDataFormat.data);
			});
			ev.preventDefault();
			copyDataInclude.current = null;
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
		setItemUnderReview({
			item: itemToConfirm.item,
			...(await getOneTimeBibliographyOrFallback(
				getItemsCSL([itemToConfirm.item]), state.xml, state.styleHasBibliography, useLegacy.current
			))
		});
		setActiveDialog(null);
		setItemToConfirm(null);
		dispatch({ type: BIBLIOGRAPHY_SOURCE_CHANGED });
	}, [addItem, state.xml, itemToConfirm, state.styleHasBibliography]);

	const handleDeleteEntry = useCallback((itemId) => {
		const item = bib.current.itemsRaw.find(item => item.key == itemId);
		lastDeletedItem.current = item;
		setItemUnderReview(null);
		setPermalink(null);
		deleteItem(itemId);
		dispatch({ type: BIBLIOGRAPHY_SOURCE_CHANGED });
		const message = {
			id: getNextMessageId(),
			action: 'Undo',
			kind: 'UNDO_DELETE',
			message: 'Item Deleted',
		};
		dispatch({ type: REPLACE_MESSAGE, kind: 'UNDO_DELETE', message });
	}, [deleteItem]);

	const handleDeleteCitations = useCallback(() => {
		bib.current.clearItems();
		citeproc.current.resetReferences([]);
		if(!state.styleHasBibliography) {
			citeproc.current.initClusters([]);
		}
		dispatch({ type: CLEAR_ALL_MESSAGES });
		setItemUnderReview(null);
		setPermalink(null);
		setTitle('');
		dispatch({ type: BIBLIOGRAPHY_SOURCE_CHANGED });
	}, [state.styleHasBibliography]);

	const handleDismiss = useCallback(id => {
		const message = state.messages.find(m => m.id === id);
		if(message) {
			if(message.kind === 'UNDO_DELETE') {
				lastDeletedItem.current = null;
			}
			dispatch({ type: CLEAR_MESSAGE, id });
		}
	}, [state.messages]);

	const handleGetStartedClick = useCallback(ev => {
		const target = document.querySelector('.zotero-bib-container');
		(new SmoothScroll()).animateScroll(target, ev.currentTarget, { speed: 1000, speedAsDuration: true });
		document.querySelector('.id-input').focus();
	}, []);

	const handleHelpClick = useCallback(ev => {
		const target = document.querySelector('.zbib-illustration');
		(new SmoothScroll()).animateScroll(target, ev.currentTarget, { speed: 1000, speedAsDuration: true, offset: calcOffset() });
	}, []);

	const handleItemCreated = useCallback((item) => {
		addItem(item, false);
		setEditorItem(item);
		dispatch({ type: BIBLIOGRAPHY_SOURCE_CHANGED });
		setPermalink(null);
	}, [addItem]);

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

		if(state.isSentenceCaseStyle) {
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

		citeproc.current.resetReferences(ensureNoBlankItems(bib.current.itemsCSL));
		dispatch({ type: BIBLIOGRAPHY_SOURCE_CHANGED });

		// if edited item is itemUnderReview, update it as well
		if(itemUnderReview && itemUnderReview.key === itemKey) {
			setItemUnderReview(updatedItem);
		}
	}, [handleError, itemUnderReview, state.isSentenceCaseStyle]);

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
			getItemsCSL([item]), state.xml, state.styleHasBibliography, useLegacy.current
			))
		});
		dispatch({ type: BIBLIOGRAPHY_SOURCE_CHANGED });
	}, [addItem, state.xml, multipleItems, state.styleHasBibliography]);

	const handleOpenEditor = useCallback((itemId = null) => {
		if(itemUnderReview && itemId && itemId != itemUnderReview.key) {
			setItemUnderReview(null);
		}

		dispatch({ type: CLEAR_ALL_MESSAGES });
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

		localStorage.setItem('zotero-bib-citation-style', state.selected);
		localStorage.setItem('zotero-bib-extra-citation-styles', JSON.stringify(citationStyles.filter(cs => !cs.isCore)));
		localStorage.setItem('zotero-bib-title', title);

		citeproc.current.recreateEngine({ wrap_url_and_doi: false });
		history.replace('/');
		dispatch({ type: BIBLIOGRAPHY_SOURCE_REPLACED });
	}, [state.selected, citationStyles, history, config, title]);

	const handleReadMoreClick = useCallback(event => {
		const target = document.querySelector('.zbib-illustration');
		(new SmoothScroll()).animateScroll(target, event.currentTarget, {
			header: '.message',
			offset: calcOffset(),
			speed: 1000, speedAsDuration: true,
		});
		dispatch({ type: CLEAR_MESSAGE, kind: 'WELCOME_MESSAGE' });
	}, []);

	const handleStyleInstallerCancel = () => {
		setActiveDialog(null);
	};

	const handleReviewDelete = useCallback(() => {
		handleDeleteEntry(itemUnderReview.item.key);
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
				citationStyle: state.selected,
				items: bib.current.itemsRaw
			});
			setPermalink(`${window.location.origin}/${key}`);
		} catch(e) {
			setPermalink(null);
			history.push('/');
			handleError('Failed to upload bibliography', e);
		}
	}, [state.selected, config, handleError, history, title]);

	const handleScroll = useCallback(() => {
		if(!state.messages.find(m => m.kind === 'WELCOME_MESSAGE')) {
			return;
		}
		const target = document.querySelector('.zbib-illustration');
		const isScrolledToIllustration = window.pageYOffset > target.offsetTop;
		if(isScrolledToIllustration) {
			dispatch({ type: CLEAR_MESSAGE, kind: 'WELCOME_MESSAGE '});
		}
	}, [state.messages]);

	const handleStyleInstallerDelete = useCallback(deleteStyleName => {
		setCitationStyles(citationStyles.filter(cs => cs.name !== deleteStyleName ));
	}, [citationStyles]);

	const handleStyleInstallerSelect = useCallback((newStyleMeta) => {
		const newCitationStyles = getExpandedCitationStyles(citationStyles, newStyleMeta);
		setCitationStyles(newCitationStyles);
		fetchAndSelectStyle(dispatch, newStyleMeta.name);
		localStorage.setItem(
			'zotero-bib-extra-citation-styles',
			JSON.stringify(newCitationStyles.filter(cs => !cs.isCore))
		);
		localStorage.setItem('zotero-bib-citation-style', newStyleMeta.name);
	}, [citationStyles]);

	const handleStyleSwitchConfirm = useCallback(() => {
		confirmStyle(dispatch);
		setActiveDialog(null);
		revertCitationStyle.current = null;
	}, []);

	const handleStyleSwitchCancel = useCallback(() => {
		if(revertCitationStyle.current) {
			fetchAndSelectStyle(dispatch, revertCitationStyle.current, { isConfirmed: true });
			localStorage.setItem('zotero-bib-citation-style', revertCitationStyle.current);
		}
		setActiveDialog(null);
		revertCitationStyle.current = null;
	}, []);

	const handleTitleChange = useCallback(title => {
		dispatch({ type: CLEAR_ALL_MESSAGES });
		setItemUnderReview(null);
		setPermalink(null);
		setTitle(title);
	}, []);

	const handleTranslateIdentifier = useCallback(async (identifier, multipleSelectedItems = null, shouldConfirm = false) => {
		identifier = parseIdentifier(identifier);

		dispatch({ type: CLEAR_ALL_MESSAGES });
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
							dispatch({
								type: POST_MESSAGE,
								message: { id: getNextMessageId(), kind: 'INFO', message: 'No results found', }
							});
							setIsTranslating(false);
							return;
						}
						var rootItems = translationResponse.items.filter(item => !item.parentItem);

						if(rootItems.length > 1) {
							const multipleItems = {
								items: rootItems,
							...(await getOneTimeBibliographyOrFallback(
									getItemsCSL(rootItems), state.xml, state.styleHasBibliography, useLegacy.current
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
								getItemsCSL([translationResponse.items[0]]), state.xml, state.styleHasBibliography, useLegacy.current
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
						dispatch({ type: BIBLIOGRAPHY_SOURCE_CHANGED });
						setItemUnderReview({
							item: translationResponse.items[0],
							...(await getOneTimeBibliographyOrFallback(
							getItemsCSL([translationResponse.items[0]]), state.xml, state.styleHasBibliography, useLegacy.current
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
	}, [addItem, state.xml, handleError, state.styleHasBibliography]);

	const handleUndoDelete = useCallback(() => {
		if(lastDeletedItem.current) {
			addItem(lastDeletedItem.current);
			dispatch({ type: BIBLIOGRAPHY_SOURCE_CHANGED });
			dispatch({ type: CLEAR_MESSAGE, kind: 'UNDO_DELETE' });
			setPermalink(null);
			lastDeletedItem.current = null;
		}
	}, [addItem]);

	const handleVisibilityChange = useCallback(() => {
		if(!isReadOnly && document.visibilityState === 'visible') {
			const storageCitationStyle = localStorage.getItem('zotero-bib-citation-style');
			bib.current.reloadItems();
			citeproc.current.resetReferences(ensureNoBlankItems(bib.current.itemsCSL));
			if(!storageCitationStyle || storageCitationStyle === state.selected) {
				dispatch({ type: BIBLIOGRAPHY_SOURCE_CHANGED });
			} else {
				fetchAndSelectStyle(dispatch, storageCitationStyle);
			}
		}
	}, [state.selected, isReadOnly]);

	const handleSaveToZoteroShow = useCallback(() => {
		setActiveDialog('SAVE_TO_ZOTERO');
	}, []);

	const handleSaveToZoteroHide = useCallback(() => {
		setActiveDialog(null);
	}, []);

	useEffect(() => {
		if(!state.isCiteprocReady || !citationToCopy) {
			return;
		}

		setTimeout(() => {
			const cites = [ {id: citationToCopy, ...citationCopyModifiers }];
			const positions = [{ }];
			setCitationHtml(
				citeproc.current.previewCitationCluster(cites, positions, 'html')
			);
		}, 0);
	}, [state.isCiteprocReady, citationCopyModifiers, citationToCopy]);

	useEffect(() => {
		if(state.bibliographyNeedsRebuild && isStyleReady && state.isConfirmed && isDataReady) {
			buildBibliography();
		}
	}, [buildBibliography, state.bibliographyNeedsRebuild, isStyleReady, state.isConfirmed, isDataReady]);

	useEffect(() => {
		if(typeof(wasDataReady) !== 'undefined' && isDataReady !== wasDataReady) {
			dispatch({ type: BIBLIOGRAPHY_SOURCE_REPLACED });
		}
	}, [isDataReady, wasDataReady]);

	useEffect(() => {
		if(state.bibliographyNeedsRefresh) {
			updateBibliography();
		}
	}, [updateBibliography, state.bibliographyNeedsRefresh])

	useEffect(() => {
		if(typeof(prevCitationStyle) !== 'undefined' && state.selected !== prevCitationStyle) {
			revertCitationStyle.current = prevCitationStyle;
		}
	}, [state.selected, prevCitationStyle]);

	useEffect(() => {
		if(state.isConfirmed === false) {
			setActiveDialog('CONFIRM_SENTENCE_CASE_STYLE');
		}
	}, [state.isConfirmed, state.isSentenceCaseStyle, wasSentenceCaseStyle]);

	useEffect(() => {
		if(!remoteId && !isReadOnly && !localStorage.getItem('zotero-bib-visited')) {
			localStorage.setItem('zotero-bib-visited', 'true');
			displayWelcomeMessage();
		}
	}, [displayWelcomeMessage, isReadOnly, remoteId])

	useEffect(() => {
		if(title !== prevTitle && typeof(prevTitle) !== 'undefined' && !isReadOnly) {
			localStorage.setItem('zotero-bib-title', title);
		}
	}, [isReadOnly, title, prevTitle]);

	useEffect(() => {
		if(isDataReady && isStyleReady && state.isCiteprocReady && !isQueryHandled && location.pathname === '/import') {
			history.replace('/');
			setIsQueryHandled(true);
			(async () => {
				await handleTranslateIdentifier(identifier, null, true);
			})();
		}
	}, [handleTranslateIdentifier, history, identifier, state.isCiteprocReady, isDataReady, isStyleReady, isQueryHandled, location]);

	useEffect(() => {
		document.addEventListener('visibilitychange', handleVisibilityChange);
		return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
	}, [handleVisibilityChange]);

	useEffect(() => {
		document.addEventListener('scroll', handleScroll);
		return () => document.removeEventListener('scroll', handleScroll);
	}, [handleScroll]);

	useEffect(() => {
		document.addEventListener('copy', handleCopyToClipboard, true);

		const params = new URLSearchParams(location.search);
		//citeproc-rs is opt-in, i.e. if truthy then useLegacy = false, defaults to true
		useLegacy.current = !params.get('use_experimental_citeproc') || (['false', '0']).includes(params.get('use_experimental_citeproc'));

		if(remoteId) {
			fetchRemoteBibliography();
		} else {
			bib.current = new ZoteroBib(config);
			bib.current.reloadItems();

			const prefilledIdentifier = params.get('q') || '';
			setIdentifier(prefilledIdentifier);
			setIsDataReady(true);
			fetchAndSelectStyle(
				dispatch,
				localStorage.getItem('zotero-bib-citation-style') || coreCitationStyles.find(cs => cs.isDefault).name,
				{ isConfirmed: true }
			);
		}
	}, []);


	return (<ZBib
		getCopyData = { getCopyData }
		getFileData = { getFileData }
		bibliography = { state.bibliography }
		citationCopyModifiers = { citationCopyModifiers }
		citationHtml = { citationHtml }
		citationStyle = { state.selected }
		citationStyles = { citationStyles }
		editorItem = { editorItem }
		identifier = { identifier }
		isNoteStyle = { state.isNoteStyle }
		isNumericStyle = { state.isNumericStyle }
		isReadOnly={ isReadOnly }
		isReady={ isReady }
		isStylesDataLoading = { isStylesDataLoading }
		isTranslating={ isTranslating }
		isTranslatingMore= { isTranslatingMore }
		itemToConfirm = { itemToConfirm }
		itemUnderReview = { itemUnderReview }
		localCitationsCount = { localCitationsCount }
		messages={ state.messages }
		moreItemsLink = { moreItemsLink }
		multipleChoiceItems = { multipleChoiceItems }
		multipleItems= { multipleItems }
		activeDialog= { activeDialog }
		onCitationCopyDialogOpen = { handleCitationCopyDialogOpen }
		onCitationCopy = { handleCitationCopy }
		onCitationCopyDialogClose = { handleCitationCopyDialogClose }
		onCitationModifierChange = { handleCitationModifierChange }
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
		onHelpClick = { handleHelpClick }
		onReadMore = { handleReadMoreClick }
		onStyleSwitchCancel = { handleStyleSwitchCancel }
		onStyleSwitchConfirm = { handleStyleSwitchConfirm }
		onTranslationRequest = { handleTranslateIdentifier }
		onCitationStyleChanged={ handleCitationStyleChanged }
		onOverride={ handleOverride }
		onUndoDelete = { handleUndoDelete }
		onSaveToZoteroShow = { handleSaveToZoteroShow }
		onSaveToZoteroHide = { handleSaveToZoteroHide }
		permalink = { permalink }
		stylesData={ stylesData }
		styleHasBibliography={ state.styleHasBibliography }
		title = { title }
	/>);
}

export default memo(BibWebContainer);
