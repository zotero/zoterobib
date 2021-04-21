import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import ZoteroBib from 'zotero-translation-client';

import { getCiteproc, noop } from '../utils';
import { coreCitationStyles } from '../../../data/citation-styles-data.json';
import defaults from '../constants/defaults';
import ZBib from './zbib';

const BibWebContainer = props => {
	const citationStyle = localStorage.getItem('zotero-bib-citation-style') || coreCitationStyles.find(cs => cs.isDefault).name;
	const citeproc = useRef(null);
	const bib = useRef(null);
	const [isCiteprocReady, setIsCiteprocReady] = useState(false);
	const [messages, setMessages] = useState([]);
	const [bibliographyItems, setBibliographyItems] = useState([]);
	const [bibliographyMeta, setBibliographyMeta] = useState({});
	const config = { ...defaults, ...props.config };

	const citationStyles = [
		...coreCitationStyles.map(cs => ({
			...cs, isDependent: 0, parent: null, isCore: true })
		),
		...(JSON.parse(localStorage.getItem('zotero-bib-extra-citation-styles')) || [])
	];
	citationStyles.sort((a, b) => a.title.toUpperCase().localeCompare(b.title.toUpperCase()));

	useEffect(() => {
		(async () => {
			citeproc.current = await getCiteproc(citationStyle);

			bib.current = new ZoteroBib(config);
			bib.current.reloadItems();

			citeproc.current.includeUncited("All").unwrap();
			citeproc.current.insertReferences(bib.current.itemsCSL).unwrap();

			setIsCiteprocReady(true);

			let bibliographyMeta = citeproc.current.bibliographyMeta().unwrap();
			let summary = citeproc.current.batchedUpdates().unwrap();
			let bibliographyItems = citeproc.current.makeBibliography().unwrap();
			setBibliographyItems(bibliographyItems);
			setBibliographyMeta(bibliographyMeta);

			console.log({ bibliographyItems, bibliographyMeta, summary });

		})();
	}, []);

	return (<ZBib
		bibliographyItems={ bibliographyItems }
		bibliographyMeta={ bibliographyMeta }
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
		onUndoDelete = { noop }
	/>);
}

export default BibWebContainer;
