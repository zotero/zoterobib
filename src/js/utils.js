'use strict';

const api = require('zotero-api-client');
const apiCache = require('zotero-api-client-cache');
const cachedApi = api().use(apiCache());

const syncRequestAsText = url => {
	let xhr = new XMLHttpRequest();
	xhr.open('GET', url, false);
	xhr.send();
	return xhr.responseText;
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
		let url = `https://cdn.rawgit.com/citation-style-language/styles/8470b61e/${styleId}.csl`;
		let response = await fetch(url);
		style = await response.text();
		localStorage.setItem(cacheId, style);
	}
	return style;
};

const retrieveLocaleSync = lang => {
	const url = `https://cdn.rawgit.com/citation-style-language/locales/b01a5e4d/locales-${lang}.xml`;
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
		if(!([...itemTypeFields.map(f => f.field), 'creators', 'itemKey', 'itemType', 'itemVersion', 'tags'].includes(prop))) {
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


module.exports = {
	syncRequestAsText,
	validateUrl,
	retrieveLocaleSync,
	retrieveStyle,
	validateItem,
	getItemTypeMeta
};
