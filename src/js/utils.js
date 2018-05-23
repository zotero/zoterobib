'use strict';

const balanced = require('balanced-match');
const api = require('zotero-api-client');
const apiCache = require('zotero-api-client-cache');
const cachedApi = api().use(apiCache());
const load = require('load-script');
const { baseMappings } = require('zotero-web-library/src/js/constants/item');

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
		retrieveItem: itemId => {
			const item = bib.itemsCSL.find(item => item.id === itemId);

			// Don't return URL or accessed information for journal, newspaper, or magazine
			// articles if there's a page number. Equivalent to export.citePaperJournalArticleURL
			// being set in Zotero (as it is by default)
			if (item.type.startsWith('article-') && item.page) {
				delete item.URL;
				delete item.accessed;
			}

			if(!('author' in item) && !('title' in item) && !('issued' in item)) {
				// there is a risk of this item being skipped by citeproc
				// in makeBibliography so we inject title to make sure it
				// can be edited in bib-web
				return {
					...item,
					title: 'Untitled'
				};
			} else {
				return item;
			}
		}
	}, style, lang);
};

const syncRequestAsText = url => {
	let xhr = new XMLHttpRequest();
	xhr.open('GET', url, false);
	xhr.send();
	return xhr.responseText;
};

const parseIdentifier = identifier => {
	identifier = identifier.trim();

	//attemt to extract DOI from doi url:
	const matches = identifier.match(/^https?:\/\/doi.org\/(10(?:\.[0-9]{4,})?\/[^\s]*[^\s.,])$/);
	if(matches) {
		return matches[1];
	}
	return identifier;
};

const isLikeUrl = identifier => {
	return !!identifier.match(/^(https?:\/\/)?[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b(\S*)$/i);
};

const isApa = citationStyle => !!citationStyle.match(/^apa($|-)/);

const isNoteStyle = cslData => !!cslData.match(/citation-format="note.*?"/);
const isNumericStyle = cslData => !!cslData.match(/citation-format="numeric.*?"/);

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
	const matches = styleXml.match(/<link.*?href="?(https?:\/\/[\w.\-/]*)"?.*?rel="?independent-parent"?.*?\/>/i);
	if(matches) {
		// try to extract style id, fallback using url as id
		const idMatches = matches[1].match(/https?:\/\/www\.zotero\.org\/styles\/([\w-]*)/i);
		return await retrieveStyle(idMatches ? idMatches[1] : matches[1]);
	}
	return styleXml;
};

const retrieveStyle = async styleIdOrUrl => {
	let cacheId = `style-${styleIdOrUrl}`;
	let style = localStorage.getItem(cacheId);
	if(!style) {
		let url = styleIdOrUrl.match(/https?:\/\/[\w.\-/]*/gi) ? styleIdOrUrl : `https://www.zotero.org/styles/${styleIdOrUrl}`;
		try {
			let response = await fetch(url);
			if(!response.ok) {
				throw new Error();
			}
			style = await response.text();
			localStorage.setItem(cacheId, style);
		} catch(e) {
			if(!style) {
				throw new Error('Failed to load style');
			}
		}
	}
	// return parent style for dependent citation styles
	style = await getParentStyle(style);
	return style;
};

const retrieveLocaleSync = lang => {
	const cacheId = `zotero-style-locales-${lang}`;
	var locales = localStorage.getItem(cacheId);

	if(!locales) {
		const url = `/static/locales/locales-${lang}.xml`;
		try {
			locales = syncRequestAsText(url);
			localStorage.setItem(cacheId, locales);
		} catch(e) {
			if(!locales) {
				throw new Error('Failed to load locales');
			}
		}
	}
	return locales;
};

const retrieveStylesData = async url => {
	var stylesData;
	try {
		const response = await fetch(url);
		if(!response.ok) {
			throw new Error();
		}
		stylesData = await response.json();
	} catch(_) {
		try {
			const response = await fetch(url, { 'cache': 'force-cache' });
			stylesData = await response.json();
		} catch(_) {
			throw new Error('Failed to load styles data');
		}
	}
	return stylesData;
};

const getItemTypes = async () => {
	return (await cachedApi.itemTypes().get()).getData();
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

const getCitations = (bib, citeproc) => {
	const items = bib.itemsRaw.map(item => item.key);
	const citations = [];
	//@NOTE: this is deprecated but seems to be the only way to reset registry
	//       otherwise previous calls to appendCitationCluster aggregate incorrectly
	//		 Alternatively we could do even more hackier:
	//		 citeproc.registry = new CSL.Registry(citeproc)
	citeproc.restoreProcessorState();
	citeproc.updateItems(items);

	bib.itemsRaw.forEach(item => {
		let outList = citeproc.appendCitationCluster({
			'citationItems': [{ 'id': item.key }],
			'properties': {}
		}, true);
		outList.forEach(listItem => {
			citations[listItem[0]] = listItem[1];
		});
	});
	return citations;
};

const getBibliographyOrFallback = (bib, citeproc) => {
	const items = bib.itemsRaw.map(item => item.key);
	citeproc.updateItems(items);
	const bibliography = citeproc.makeBibliography();
	if(bibliography) {
		return {
			isFallback: false,
			bibliography
		};
	}

	return {
		isFallback: true,
		citations: getCitations(bib, citeproc)
	};
};

const getCitation = (bib, itemId, modifiers, formats, citeproc, isWarm = false) => {
	const items = bib.itemsRaw.map(item => item.key);
	if(!isWarm) {
		citeproc.restoreProcessorState(items.map((key, i) => {
			return {
				citationID: key,
				citationItems: [{ 'id': key }],
				properties: {
					index: i
				}
			};
		}));
	}

	const index = items.indexOf(itemId);
	const pre = items.slice(0, index).map((key, i) => ([key, i]));
	const post = items.slice(index + 1).map((key, i) => ([key, i]));
	const citation = {
		'citationItems': [{ 'id': itemId }],
		'properties': {}
	};

	if(modifiers) {
		for(let i in modifiers) {
			let prop = i == 'suppressAuthor' ? 'suppress-author' : i;
			citation.citationItems[0][prop] = modifiers[i];
		}
	}

	const output = {};
	const validFormats = ['text', 'html'];

	if (!formats || !formats.length) {
		formats = validFormats;
	}

	for (let format of formats.filter(f => validFormats.includes(f))) {
		output[format] = citeproc.previewCitationCluster(citation, pre, post, format);
	}
	return output;
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

const parseTagAndAttrsFromNode = node => {
	let Tag = node.tagName.toLowerCase();
	let attrs = {
		className: node.getAttribute('class') || '',
		style: (node.getAttribute('style') || '')
			.split(';')
			.map(x => x.split(':')
				.map(y => y.trim())
			).reduce((aggr, val) => {
				aggr[val[0].replace(/-([a-z])/g, g => g[1].toUpperCase())] = val[1];
				return aggr;
			}, {})
	};

	return { Tag, attrs };
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
		}));
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

module.exports = {
	dedupMultipleChoiceItems,
	fetchFromPermalink,
	getBibliographyFormatParameters,
	getBibliographyOrFallback,
	getCitation,
	getCiteproc,
	getCSL,
	getItemTypeMeta,
	getItemTypes,
	isApa,
	isLikeUrl,
	isNoteStyle,
	isNumericStyle,
	parseIdentifier,
	parseTagAndAttrsFromNode,
	processMultipleChoiceItems,
	processSentenceCaseAPAField,
	processSentenceCaseAPAItems,
	retrieveLocaleSync,
	retrieveStyle,
	retrieveStylesData,
	saveToPermalink,
	syncRequestAsText,
	validateItem,
	validateUrl,
};
