import api from 'zotero-api-client';

// Zbib only uses API for meta requests, these rarely, if ever, change hence are cached for 24 hours
// to improve performance. localStorage is used to record time of the last request, then, if cache
// is fresh, we use ask browser to use `force-cache` caching strategy which will go to the disk
// cache before making requests

const apiCheckCache = key => {
	var cacheTimes = {}, okToUseCache = false;
	try {
		cacheTimes = JSON.parse(localStorage.getItem('zotero-bib-api-cache')) || {};
	} catch(_) {
		// ignore
	}

	if(key in cacheTimes) {
		okToUseCache = (Date.now() - cacheTimes[key]) < 24 * 60 * 60 * 1000;
	}

	if(!okToUseCache) {
		cacheTimes[key] = Date.now();
		localStorage.setItem('zotero-bib-api-cache', JSON.stringify(cacheTimes));
	}

	return okToUseCache;
}

const getItemTypes = async (retryOnFailure = true) => {
	try {
		return (await api()
			.itemTypes()
			.get({ cache: apiCheckCache('itemTypes') ? 'force-cache' : 'default'})
		).getData();
	} catch(e) {
		localStorage.removeItem('zotero-bib-api-cache');
		if(retryOnFailure) {
			return getItemTypes(false);
		} else {
			throw e;
		}
	}
};

const getItemTypeMeta = async (itemType, retryOnFailure = true) => {
	try {
		var [itemTypeR, itemTypeFieldsR, creatorTypesR] = await Promise.all([
			api()
				.itemTypes()
				.get({ cache: apiCheckCache('itemTypes') ? 'force-cache' : 'default'}),
			api()
				.itemTypeFields(itemType)
				.get({ cache: apiCheckCache(`itemTypeFields-${itemType}`) ? 'force-cache' : 'default'}),
			api()
				.itemTypeCreatorTypes(itemType)
				.get({ cache: apiCheckCache(`itemTypeCreatorTypes-${itemType}`) ? 'force-cache' : 'default'})
		]);
	} catch(e) {
		localStorage.removeItem('zotero-bib-api-cache');
		if(retryOnFailure) {
			return getItemTypeMeta(itemType, false);
		} else {
			throw e;
		}
	}

	return {
		itemTypes: itemTypeR.getData(),
		itemTypeFields: itemTypeFieldsR.getData(),
		itemTypeCreatorTypes: creatorTypesR.getData()
	};
};


export { getItemTypes, getItemTypeMeta }
