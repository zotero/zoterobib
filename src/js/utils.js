'use strict';

const api = require('zotero-api-client');
const apiCache = require('zotero-api-client-cache');
const cachedApi = api().use(apiCache());
const load = require('load-script');


const getCSL = () => {
	if('CSL' in window) {
		return Promise.resolve(window.CSL);
	}

	return new Promise((resolve, reject) => {
		load('/static/js/citeproc.js', (err) => {
			if (err) {
				reject(err);
			} else {
				resolve(window.CSL);
			}
		});
	});
};

const getCiteproc = async (citationStyle, bib) => {
	const lang = window ? window.navigator.userLanguage || window.navigator.language : null;

	const [ CSL, style ] = await Promise.all([
		getCSL(),
		retrieveStyle(citationStyle)
	]);

	return new CSL.Engine({
		retrieveLocale: retrieveLocaleSync,
		retrieveItem: itemId => bib.itemsCSL.find(item => item.id === itemId)
	}, style, lang);
};

const syncRequestAsText = url => {
	let xhr = new XMLHttpRequest();
	xhr.open('GET', url, false);
	xhr.send();
	return xhr.responseText;
};

const isIdentifier = identifier => {
	identifier = identifier.trim();
	return (
		// DOI
		identifier.match(/^10(?:\.[0-9]{4,})?\/[^\s]*[^\s\.,]$/)
		// ISBN
		|| identifier.replace(/[\u002D\u00AD\u2010-\u2015\u2212]+/g, '')
			.match(/^(?:\D|^)(97[89]\d{10}|\d{9}[\dX])(?!\d)$/)
		// PMID
		|| identifier.match(/^(?:\D|^)(\d{1,9})(?!\d)$/)
	);
};

const validateUrl = url => {
		try {
			url = new URL(url);
			return url.toString();
		} catch(e) {
			try {
				url = new URL(`http://${url}`);
				return url.toString();
			} catch(e) {
				return false;
			}
		}
};

const getParentStyle = async styleXml => {
	const matches = styleXml.match(/<link.*?href="?(https?:\/\/[\w\.\-\/]*)"?.*?rel="?independent-parent"?.*?\/>/i);
	if(matches) {
		// try to extract style id, fallback using url as id
		const idMatches = matches[1].match(/https?:\/\/www\.zotero\.org\/styles\/([\w\-]*)/i);
		return await retrieveStyle(idMatches ? idMatches[1] : matches[1]);
	}
	return styleXml;
};

const retrieveStyle = async styleIdOrUrl => {
	let cacheId = `style-${styleIdOrUrl}`;
	let style = localStorage.getItem(cacheId);
	if(!style) {
		let url = styleIdOrUrl.match(/https?:\/\/[\w\.\-\/]*/gi) ? styleIdOrUrl : `https://www.zotero.org/styles/${styleIdOrUrl}`;
		try {
			if(!response.ok) {
				throw new Error();
			}
			let response = await fetch(url);
			style = await response.text();
			localStorage.setItem(cacheId, style);
		} catch(e) {
			if(!style) {
				throw new Error('Failed to load style, please check your connection');
			}
		}

	}
	// return parent style for dependent citation styles
	style = await getParentStyle(style);
	return style;
};

const retrieveLocaleSync = lang => {
	const url = `/static/locales/locales-${lang}.xml`;
	const retval = syncRequestAsText(url);
	return retval;
};

const retrieveStylesData = async (url, stylesCacheTime) => {
	var stylesData = JSON.parse(localStorage.getItem('zotero-styles-data'));
	var stylesDataTimestamp = localStorage.getItem('zotero-styles-data-timestamp');
	if(!stylesData
		|| !stylesDataTimestamp
		|| Date.now() - stylesDataTimestamp > stylesCacheTime
	) {
		try {
			const response = await fetch(url);
			if(!response.ok) {
				throw new Error();
			}
			stylesData = await response.json();
			localStorage.setItem('zotero-styles-data', JSON.stringify(stylesData));
			localStorage.setItem('zotero-styles-data-timestamp', Date.now());
		} catch(e) {
			if(!stylesData) {
				throw new Error('Failed to load styles data, please check your connection');
			}
		}
	}
	return stylesData;
};

const getItemTypeMeta = async (itemType) => {
	var [itemTypeR, itemTypeFieldsR, creatorTypesR] = await Promise.all([
		cachedApi.itemTypes().get(),
		cachedApi.itemTypeFields(itemType).get(),
		cachedApi.itemTypeCreatorTypes(itemType).get()
	]);

	return {
		itemTypes: itemTypeR.getData(),
		itemTypeFields: itemTypeFieldsR.getData(),
		itemTypeCreatorTypes: creatorTypesR.getData()
	};
};

const validateItem = async item => {
	const { itemTypeFields, itemTypeCreatorTypes } = await getItemTypeMeta(item.itemType);

	//remove item properties that should not appear on this item type
	for (var prop in item) {
		if(!([...itemTypeFields.map(f => f.field), 'creators', 'key', 'itemType', 'version', 'tags'].includes(prop))) {
			delete item[prop];
		}
	}

	//convert item creators to match creators appropriate for this item type
	if(item.creators && Array.isArray(item.creators)) {
		for(var creator of item.creators) {
			if(typeof itemTypeCreatorTypes.find(c => c.creatorType === creator.creatorType) === 'undefined') {
				creator.creatorType = itemTypeCreatorTypes[0].creatorType;
			}
		}
	}
};


//@TODO: implement retry
const fetchFromPermalink = async url => {
	try {
		const response = await fetch(url);
		if(!response.ok) {
			throw new Error(`Unexpected response from the server: ${response.status}: ${response.statusText}`);
		}
		return await response.json();
	} catch(e) {
		throw e;
	}
};

//@TODO: implement retry
const saveToPermalink = async (url, data) => {
	try {
		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(data)
		});

		if(!response.ok) {
			throw new Error(`Unexpected response from the server: ${response.status}: ${response.statusText}`);
		}
		let { key } = await response.json();
		if(!key) {
			throw new Error('Error: Response did not contain a key');
		}
		return key;
	} catch(e) {
		throw e;
	}
};

/**
	 * copied from https://github.com/zotero/zotero/blob/1f5639da4297ac20fd21223d2004a7cfeef72e21/chrome/content/zotero/xpcom/cite.js#L43
	 * Convert formatting data from citeproc-js bibliography object into explicit format
	 * parameters for RTF or word processors
	 * @param {bib} citeproc-js bibliography object
	 * @return {Object} Bibliography style parameters.
 */

const getBibliographyFormatParameters = bib => {
		var bibStyle = {'tabStops':[], 'indent':0, 'firstLineIndent':0,
						'lineSpacing':(240 * bib[0].linespacing),
						'entrySpacing':(240 * bib[0].entryspacing)};
		if(bib[0].hangingindent) {
			bibStyle.indent = 720;				// 720 twips = 0.5 in
			bibStyle.firstLineIndent = -720;	// -720 twips = -0.5 in
		} else if(bib[0]['second-field-align']) {
			// this is a really sticky issue. the below works for first fields that look like "[1]"
			// and "1." otherwise, i have no idea. luckily, this will be good enough 99% of the time.
			var alignAt = 24+bib[0].maxoffset*120;
			bibStyle.firstLineIndent = -alignAt;
			if(bib[0]['second-field-align'] == 'margin') {
				bibStyle.tabStops = [0];
			} else {
				bibStyle.indent = alignAt;
				bibStyle.tabStops = [alignAt];
			}
		}

		return bibStyle;
};

module.exports = {
	fetchFromPermalink,
	getBibliographyFormatParameters,
	getCiteproc,
	getCSL,
	getItemTypeMeta,
	isIdentifier,
	retrieveLocaleSync,
	retrieveStyle,
	retrieveStylesData,
	saveToPermalink,
	syncRequestAsText,
	validateItem,
	validateUrl,
};
