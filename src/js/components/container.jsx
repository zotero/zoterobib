import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ZoteroBib from 'zotero-translation-client';
import { useParams, useHistory } from "react-router-dom";


import { fetchFromPermalink, getExpandedCitationStyles, getCiteproc, noop, retrieveIndependentStyle, retrieveStylesData } from '../utils';
import { coreCitationStyles } from '../../../data/citation-styles-data.json';
import defaults from '../constants/defaults';
import ZBib from './zbib';
import { useCitationStyle, usePrevious } from '../hooks';

const BibWebContainer = props => {
	const { id: remoteId } = useParams();
	const history = useHistory();
	const citeproc = useRef(null);
	const bib = useRef(null);
	const [isCiteprocReady, setIsCiteprocReady] = useState(false);
	const [isDataReady, setIsDataReady] = useState(false);
	const wasDataReady = usePrevious(isDataReady);
	const [messages, setMessages] = useState([]);
	const [bibliographyItems, setBibliographyItems] = useState([]);
	const [bibliographyMeta, setBibliographyMeta] = useState({});
	const [citationStyle, setCitationStyle] = useState(
		localStorage.getItem('zotero-bib-citation-style') || coreCitationStyles.find(cs => cs.isDefault).name
	);
	const prevCitationStyle = usePrevious(citationStyle);
	const [citationStyleXml, setCitationStyleXml] = useState(null);
	const [isFetchingStyleXml, setIsFetchingStyleXml] = useState(false);
	const prevCitationStyleXml = usePrevious(citationStyleXml);

	const { isNoteStyle, isNumericStyle, isSentenceCaseStyle, isUppercaseSubtitlesStyle } =
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

	const handleCitationStyleChanged = useCallback(ev => {
		console.log({ ev });
		setCitationStyle(ev.value);
	}, []);

	const handleError = useCallback((message, e) => {
		// TODO: display message
		throw e;
	}, []);

	const handleCitationCopyDialogOpen = useCallback(itemId => {
		// this.clearMessages(); //@TODO
		// setItemUnderReview(null); //@TODO
		// setPopup(CITATION)
		// setCitation(itemId)
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

	const buildBibliography = useCallback(async () => {
		if(citeproc.current) {
			citeproc.current.free();
		}
		setIsCiteprocReady(false);

		citeproc.current = await getCiteproc(citationStyleXml);
		citeproc.current.includeUncited("All").unwrap();
		citeproc.current.insertReferences(bib.current.itemsCSL).unwrap();

		let bibliographyMeta = citeproc.current.bibliographyMeta().unwrap();
		let bibliographyItems = citeproc.current.makeBibliography().unwrap();
		setBibliographyItems(bibliographyItems);
		setBibliographyMeta(bibliographyMeta);
		setIsCiteprocReady(true);
	}, [citationStyleXml]);

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

	const fetchCitationStyleXml = useCallback(async () => {
		setIsFetchingStyleXml(true);
		setCitationStyleXml(await retrieveIndependentStyle(citationStyle));
		setIsFetchingStyleXml(false);
	}, [citationStyle]);

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
	}, []);


	return (<ZBib
		bibliographyItems={ bibliographyItems }
		bibliographyMeta={ bibliographyMeta }
		citationStyle={ citationStyle }
		citationStyles={ citationStyles }
		isReadOnly={ isReadOnly }
		isReady={ isReady }
		localCitationsCount={ localCitationsCount }
		messages={ messages }
		items={ bib?.current?.items || [] }
		onCitationCopy = { noop }
		onCitationCopyCancel = { noop }
		onCitationModifierChange = { noop }
		onClearMessage = { noop }
		onDismissUndo = { noop }
		onHelpClick = { noop }
		onSaveToZoteroHide = { noop }
		onStyleSwitchCancel = { noop }
		onStyleSwitchConfirm = { noop }
		onCitationStyleChanged={ handleCitationStyleChanged }
		onOverride={ handleOverride }
		onUndoDelete = { noop }
	/>);
}

export default BibWebContainer;
