import balanced from 'balanced-match';
import baseMappings from 'zotero-base-mappings';
import ZoteroBib from 'zotero-translation-client';

import CiteprocWrapper from './citeproc-wrapper';
import { getItemTypes, getItemTypeMeta } from './api-utils';


const ensureNoBlankItems = itemsCSL => itemsCSL.map(item => {
	if(!('author' in item) && !('title' in item) && !('issued' in item)) {
		// there is a risk of this item being skipped by citeproc in makeBibliography so we inject
		// title to make sure it can be edited in bib-web
		return {
			...item,
			title: 'Untitled'
		};
	} else {
		return item;
	}
});

const parseIdentifier = identifier => {
	identifier = identifier.trim();

	// Attempt to extract DOI from DOI URL
	//
	// translation-server does this more broadly after trying the URL, but for a doi.org URL we
	// might as well just use the DOI rather than trying the page first
	const matches = decodeURIComponent(identifier).match(/^https?:\/\/doi.org\/(10(?:\.[0-9]{4,})?\/[^\s]*[^\s.,])$/);
	if(matches) {
		return matches[1];
	}
	return identifier;
};

const isLikeUrl = identifier => {
	return !!identifier.match(/^(https?:\/\/)?[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b(\S*)$/i);
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

const retrieveStylesData = async url => {
	try {
		const response = await fetchWithCachedFallback(url);
		if(!response.ok) { throw new Error(); }
		return await response.json();
	} catch(_) {
		throw new Error('Failed to load styles data');
	}
};

const fetchWithCachedFallback = async url => {
	try {
		return await fetch(url);
	} catch(_) {
		// try to fallback for a cached version
		return await fetch(url, { 'cache': 'force-cache' });
	}
}

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


// TODO: implement retry
const fetchFromPermalink = async url => {
	const response = await fetch(url);
	if(!response.ok) {
		throw new Error(`Unexpected response from the server: ${response.status}: ${response.statusText}`);
	}
	return await response.json();
};

// TODO: implement retry
const saveToPermalink = async (url, data) => {
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
};

const getOneTimeBibliographyOrFallback = async (itemsCSL, citationStyleXml, styleHasBibliography, useLegacy, opts = {}) => {
	var bibliographyItems, bibliographyMeta = null;

	const citeproc = await CiteprocWrapper.new({
		format: 'html',
		style: citationStyleXml,
		wrap_url_and_doi: false,
		...opts
	}, useLegacy);
	citeproc.includeUncited("All");
	citeproc.insertReferences(itemsCSL);

	if(styleHasBibliography) {
		bibliographyItems = citeproc.makeBibliography();
		bibliographyMeta = citeproc.bibliographyMeta();
	} else {
		citeproc.initClusters(
			itemsCSL.map(item => ({ id: item.id, cites: [ { id: item.id } ] }))
		);
		citeproc.setClusterOrder(itemsCSL.map(item => ({ id: item.id })));
		const render = citeproc.fullRender();
		bibliographyItems = itemsCSL.map(item => ({ id: item.id, value: render.allClusters[item.id] }));
	}

	citeproc.free();

	return { bibliographyItems, bibliographyMeta, styleHasBibliography };
};

const whitelist = [
	...(Object.keys(baseMappings).reduce((agg, itemType) => {
		'title' in baseMappings[itemType] && agg.push(baseMappings[itemType]['title']);
		return agg;
	}, [])),
	'title',
	'shortTitle',
];

const isSentenceCase = val => {
	// sanity check, at this point CSL should always be present
	if(!('CSL' in window)) {
		return false;
	}

	let matches = val.match(/^\W*(\w+)(.*?)$/);
	if(matches && matches.length > 2) {
		let [_, firstWord, remainingWords] = matches; // eslint-disable-line no-unused-vars
		let firstLetter = firstWord.substr(0, 1);
		if(firstLetter.toUpperCase() !== firstLetter) {
			// first letter of first word is not uppercase
			return false;
		}
		// count how many words are lowercased, ignoring short words and SKIP_WORDS
		let lowerCaseWords = 0;
		let totalWords = 0;
		remainingWords = remainingWords.match(/(\w+)/g);
		if(remainingWords) {
			remainingWords
				.filter(word => word.length >= 4 || !window.CSL.SKIP_WORDS.includes(word))
				.forEach(word => {
					totalWords++;
					let firstLetter = word.substr(0, 1);
					if(firstLetter.toLowerCase() === firstLetter) {
						lowerCaseWords++;
					}
				});
		}
		let ratio = lowerCaseWords / totalWords;
		return ratio >= 0.5;
	}
};

const processSentenceCase = val => {
	if(isSentenceCase(val)) {
		return val;
	}
	let matches = val.match(/(([^.!?]+)[.!?]+)|([^.!?]+$)/g);
	if(matches) {
		return matches.map(s => {
			// skip special characters at the beginning of the sentence
			const [ _, pre, sentence ] = s.trim().match(/^(['"¡¿“‘„«(]*)(.*)$/); // eslint-disable-line no-unused-vars
			// uppercase first actual letter of the sentence, lowercase rest
			return pre + sentence[0].toUpperCase() + sentence.slice(1).toLowerCase();
		})
		.join(' ');
	} else {
		return val;
	}
};

const processSentenceCaseAPAField = value => {
	var match;
	var sentencesInBrackets = [];
	var rootSentences = '';
	// extract all content in balanced parentheses
	while((match = balanced('(', ')', value))) {
		match.body = processSentenceCase(match.body);
		// process sentences within parentheses
		sentencesInBrackets.push(match);
		rootSentences += match.pre;
		value = match.post;
	}
	rootSentences += value;
	// process "root" sentences separately
	rootSentences = processSentenceCase(rootSentences);

	// re-insert content from parentheses at correct indexes
	var pointer = 0;
	sentencesInBrackets.forEach(sentenceInBrackets => {
		let pre = rootSentences.substr(0, pointer + sentenceInBrackets.start);
		let post = rootSentences.substr(pointer + sentenceInBrackets.start);

		rootSentences = `${pre}(${sentenceInBrackets.body})${post}`;
		pointer += sentenceInBrackets.end + 1;
	});
	return rootSentences;
};

const processSentenceCaseAPAItems = items => {
	const itemsMetaData = JSON.parse(localStorage.getItem('zotero-bib-items-metadata')) || {};
	items.forEach(item => {
		Object.keys(item).forEach(k => {
			if(typeof(item[k]) === 'string' && whitelist.includes(k)) {
				if(!(item.key in itemsMetaData &&
					'apaEditedKeys' in itemsMetaData[item.key] &&
					itemsMetaData[item.key]['apaEditedKeys'].includes(k)
				)) {
					item[k] = processSentenceCaseAPAField(item[k]);
				}
			}
		});
	});

	return items;
};

const processMultipleChoiceItems = async (items, isUrl = false) => {
	const itemTypes = await getItemTypes();
	return Object.entries(items)
		.map(([key, value]) => ({
			key,
			value: typeof value === 'string' ? {
				title: value
			} : {
				...value,
				itemType: (itemTypes.find(it => it.itemType == value.itemType) || {}).localized
			},
			source: isUrl ? 'url' : 'identifier'
		})).filter(itemData => !itemData.value.parentItem); // remove child items if present in multi choice options
};

const removeDuplicatesBy = (fn, array) => {
	var unique = new Set();
	return array.filter(element => {
		const key = fn(element);
		const isNew = !unique.has(key);
		if(isNew) {
			unique.add(key);
		}
		return isNew;
	});
};

const dedupMultipleChoiceItems = items => {
	items.forEach(item => {
		const { title, description, itemType } = item.value;
		const signature = item.key + title + description + itemType;
		item.signature = signature;
	});
	return removeDuplicatesBy(i => i.signature, items);
};

const noop = () => {};

const reverseMap = map => {
	return Object.keys(map).reduce((acc, key) => {
		acc[map[key]] = key;
		return acc;
	}, {});
};

const splice = (array, at, count = 0, ...items) => {
	if (at == null) {
		at = array.length;
	}

	return [
		...array.slice(0, at),
		...items,
		...array.slice(at + count)
	];
};

const getExpandedCitationStyles = (citationStyles, styleMeta) => {
	if(citationStyles.find(cs => cs.name === styleMeta.name)) {
		return citationStyles;
	}

	const newCitationStyles = [
		...citationStyles,
		{
			name: styleMeta.name,
			title: styleMeta.title,
			isDependent: styleMeta.dependent,
			isCore: false
		}
	];

	newCitationStyles.sort((a, b) => a.title.toUpperCase().localeCompare(b.title.toUpperCase()));
	return newCitationStyles;
};

const calcOffset = () => {
	var md = window.matchMedia('(min-width: 768px)');
	return md.matches ? 48 : 24;
}

//TODO: a nicer API for Zotero -> CSL conversion
const getItemsCSL = items => {
	const bib = new ZoteroBib({
		persist: false,
		initialItems: items
	});

	return bib.itemsCSL;
};

const scrollIntoViewIfNeeded = (element, container, opts = {}) => {
	const containerTop = container.scrollTop;
	const containerBottom = containerTop + container.clientHeight;
	const elementTop = element.offsetTop;
	const elementBottom = elementTop + element.clientHeight;

	if(elementTop < containerTop || elementBottom > containerBottom) {
		const before = container.scrollTop;
		element.scrollIntoView(opts);
		const after = container.scrollTop;
		return after - before;
	}
	return 0;
}

const enumerateObjects = (objects, key = 'id', start = 0) => {
	return objects.map((o, i) => ({ ...o, [key]: i + start }));
}

const normalizeLocaleName = locale => {
	const localeSplit = locale.split('-');
	return locale = localeSplit.length > 1 ?
		`${localeSplit[0].toLowerCase()}-${localeSplit[1].toUpperCase()}` :
		localeSplit[0].toLowerCase();
}

const pickBestLocale = (userLocales, supportedLocales, fallback = 'en-US') => {
	if(!Array.isArray(userLocales)) {
		userLocales = [userLocales];
	}

	for(let i = 0; i < userLocales.length; i++) {
		const locale = normalizeLocaleName(userLocales[i]);
		const langCode = locale.substr(0,2);
		const possibleLocales = supportedLocales.filter(supportedLocale => supportedLocale.substr(0, 2) === langCode);

		if(possibleLocales.length === 1) {
			return possibleLocales[0];
		} else if(possibleLocales.length > 0) {
			if(possibleLocales.includes(locale)) {
				return locale;
			}
			const canonical = `${langCode}-${langCode.toUpperCase()}`;
			if(possibleLocales.includes(canonical)) {
				return canonical;
			}

			possibleLocales.sort();
			return possibleLocales[0];
		}

		const matchingLocale = supportedLocales.find(supportedLocale => supportedLocale.startsWith(locale));
		if(matchingLocale) {
			return matchingLocale;
		}
	}
	return fallback;
}

const isDuplicate = (newItem, items = []) => {
	const result = items.find(item =>
		(item.ISBN && (item.ISBN === newItem.ISBN)) ||
		(item.DOI && (item.DOI === newItem.DOI)) ||
		(item.url && (item.url === newItem.url)) ||
		(item.title && (item.title === newItem.title))
	);
	return result ?? false;
}

export {
	calcOffset,
	dedupMultipleChoiceItems,
	ensureNoBlankItems,
	enumerateObjects,
	fetchFromPermalink,
	fetchWithCachedFallback,
	getExpandedCitationStyles,
	getItemsCSL,
	getItemTypes,
	getOneTimeBibliographyOrFallback,
	isDuplicate,
	isLikeUrl,
	noop,
	parseIdentifier,
	pickBestLocale,
	processMultipleChoiceItems,
	processSentenceCaseAPAField,
	processSentenceCaseAPAItems,
	retrieveStylesData,
	reverseMap,
	saveToPermalink,
	scrollIntoViewIfNeeded,
	splice,
	validateItem,
	validateUrl,
};
