import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ZoteroBib from 'zotero-translation-client';
import { useParams, useHistory } from "react-router-dom";
import copy from 'copy-to-clipboard';

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
	const copyData = useRef(null);
	const [isCiteprocReady, setIsCiteprocReady] = useState(false);
	const [isDataReady, setIsDataReady] = useState(false);
	const [activeDialog, setActiveDialog] = useState(false);
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

	const [isStylesDataLoading, setIsStylesDataLoading] = useState(false);
	const [stylesData, setStylesData] = useState(null);

	const [citationToCopy, setCitationToCopy] = useState(null);
	const [citationCopyModifiers, setCitationCopyModifiers] = useState({});
	const [citationHtml, setCitationHtml] = useState(null);

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

	const handleStyleInstallerDelete = (deleteStyleMeta) => {
		setCitationStyles(citationStyles.filter(cs => cs.name !== deleteStyleMeta.name ));
	};

	const handleStyleInstallerSelect = (newStyleMeta) => {
		setCitationStyles(getExpandedCitationStyles(citationStyles, newStyleMeta));
		setCitationStyle(newStyleMeta.name);
	};

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
		bibliographyItems={ bibliographyItems }
		bibliographyMeta={ bibliographyMeta }
		citationCopyModifiers={ citationCopyModifiers }
		citationHtml={ citationHtml }
		citationStyle={ citationStyle }
		citationStyles={ citationStyles }
		isNoteStyle={ isNoteStyle }
		isStylesDataLoading={ isStylesDataLoading }
		isReadOnly={ isReadOnly }
		isReady={ isReady }
		localCitationsCount={ localCitationsCount }
		messages={ messages }
		items={ bib?.current?.items || [] }
		activeDialog={ activeDialog }
		onCitationCopyDialogOpen = { handleCitationCopyDialogOpen }
		onCitationCopy = { handleCitationCopy }
		onCitationCopyDialogClose = { handleCitationCopyDialogClose }
		onCitationModifierChange = { handleCitationModifierChange }
		onClearMessage = { noop }
		onStyleInstallerCancel = { handleStyleInstallerCancel }
		onStyleInstallerDelete = { handleStyleInstallerDelete }
		onStyleInstallerSelect = { handleStyleInstallerSelect }
		onDismissUndo = { noop }
		onHelpClick = { noop }
		onSaveToZoteroHide = { noop }
		onStyleSwitchCancel = { noop }
		onStyleSwitchConfirm = { noop }
		onCitationStyleChanged={ handleCitationStyleChanged }
		onOverride={ handleOverride }
		onUndoDelete = { noop }
		stylesData={ stylesData }
	/>);
}

export default BibWebContainer;
