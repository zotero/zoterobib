'use strict';

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
		let url = `https://raw.githubusercontent.com/citation-style-language/styles/master/${styleId}.csl`;
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

const validateItem = (item, itemTypeFields, itemTypeCreators) => {
	itemTypeFields = itemTypeFields.map(f => f.field);
	itemTypeFields = [...itemTypeFields, 'creators', 'itemKey', 'itemType', 'itemVersion', 'tags'];

	//remove item properties that should not appear on this item type
	for (var prop in item) {
		if(!(itemTypeFields.includes(prop))) {
			delete item[prop];
		}
	}

	//convert item creators to match creators appropriate for this item type
	if(item.creators && Array.isArray(item.creators)) {
		for(var creator of item.creators) {
			if(typeof itemTypeCreators.find(c => c.creatorType === creator.creatorType) === 'undefined') {
				creator.creatorType = itemTypeCreators[0].creatorType;
			}
		}
	}

	//do not allow empty creators array
	if(!item.creators || (Array.isArray(item.creators) && item.creators.length === 0)) {
		item.creators = [{
			creatorType: itemTypeCreators[0].creatorType,
			firstName: '',
			lastName: ''
		}];
	}
};


module.exports = {
	syncRequestAsText,
	validateUrl,
	retrieveLocaleSync,
	retrieveStyle,
	validateItem
};
