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
	const sys = {
		retrieveLocale: retrieveLocaleSync,
		retrieveItem: itemId => bib.itemsCSL.find(item => item.id === itemId)
	};
	const [ CSL, style ] = await Promise.all([
		getCSL(),
		retrieveStyle(citationStyle)
	]);

	return new CSL.Engine(sys, style);
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
		identifier.match(/^10\.[0-9]{4,}\/[^\s]*[^\s\.,]$/)
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


const retrieveStyle = async styleId => {
	let cacheId = `style-${styleId}`;
	let style = localStorage.getItem(cacheId);
	if(!style) {
		// let url = `https://www.zotero.org/styles/${styleId}`;
		let url = `https://cdn.rawgit.com/citation-style-language/styles/8470b61e/${styleId}.csl`;
		let response = await fetch(url);
		style = await response.text();
		localStorage.setItem(cacheId, style);
	}
	return style;
};

const retrieveLocaleSync = lang => {
	const url = `/static/locales/locales-${lang}.xml`;
	const retval = syncRequestAsText(url);
	return retval;
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


module.exports = {
	fetchFromPermalink,
	getCiteproc,
	getCSL,
	getItemTypeMeta,
	isIdentifier,
	retrieveLocaleSync,
	retrieveStyle,
	saveToPermalink,
	syncRequestAsText,
	validateItem,
	validateUrl,
};
