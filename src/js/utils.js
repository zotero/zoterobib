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


module.exports = {
	syncRequestAsText,
	validateUrl,
	retrieveLocaleSync,
	retrieveStyle
};
