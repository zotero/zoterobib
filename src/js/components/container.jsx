import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import ZoteroBib from 'zotero-translation-client';

import { getCiteproc, noop } from '../utils';
import { coreCitationStyles } from '../../../data/citation-styles-data.json';
import defaults from '../constants/defaults';
import ZBib from './zbib';

const BibWebContainer = props => {
	const citeproc = useRef(null);
	const bib = useRef(null);
	const [isCiteprocReady, setIsCiteprocReady] = useState(false);
	const [messages, setMessages] = useState([]);
	const [bibliographyItems, setBibliographyItems] = useState([]);
	const [bibliographyMeta, setBibliographyMeta] = useState({});
	const [citationStyle, setCitationStyle] = useState(
		localStorage.getItem('zotero-bib-citation-style') || coreCitationStyles.find(cs => cs.isDefault).name
	);
	const config = { ...defaults, ...props.config };

	const citationStyles = [
		...coreCitationStyles.map(cs => ({
			...cs, isDependent: 0, parent: null, isCore: true })
		),
		...(JSON.parse(localStorage.getItem('zotero-bib-extra-citation-styles')) || [])
	];
	citationStyles.sort((a, b) => a.title.toUpperCase().localeCompare(b.title.toUpperCase()));

	const handleCitationStyleChanged = useCallback(ev => {
		console.log({ ev });
		setCitationStyle(ev.value);
	}, []);

	const refreshBibliography = useCallback(async (citationStyle) => {
		if(citeproc.current) {
			citeproc.current.free();
		}
		setIsCiteprocReady(false);
		citeproc.current = await getCiteproc(citationStyle);

		citeproc.current.includeUncited("All").unwrap();
		citeproc.current.insertReferences(bib.current.itemsCSL).unwrap();

		let bibliographyMeta = citeproc.current.bibliographyMeta().unwrap();
		let bibliographyItems = citeproc.current.makeBibliography().unwrap();
		setBibliographyItems(bibliographyItems);
		setBibliographyMeta(bibliographyMeta);
		setIsCiteprocReady(true);
	}, []);

	useEffect(() => {
		refreshBibliography(citationStyle);
	}, [citationStyle, refreshBibliography]);

	useEffect(() => {
		bib.current = new ZoteroBib(config);
		bib.current.reloadItems();
		refreshBibliography(citationStyle);
	}, []);

	return (<ZBib
		bibliographyItems={ bibliographyItems }
		bibliographyMeta={ bibliographyMeta }
		citationStyle={ citationStyle }
		citationStyles={ citationStyles }
		isReadOnly={ !isCiteprocReady }
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
		onUndoDelete = { noop }
	/>);
}

export default BibWebContainer;
