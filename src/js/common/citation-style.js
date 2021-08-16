import { fetchWithCachedFallback } from '../utils'
import { omit } from '../immutable';

const stylePropertiesCache = new Map();
const stylesCache = new Map();

const getStyleName = (xmlDoc, rel) => {
	const parentStyleUrl = xmlDoc.querySelector(`info > link[rel="${rel}"]`)?.getAttribute('href');
	if(parentStyleUrl) {
		const idMatches = parentStyleUrl.match(/https?:\/\/www\.zotero\.org\/styles\/([\w-]*)/i);
		if(idMatches) {
			return idMatches[1];
		}
	}
	return null;
}

const checkSentenceCase = citationStyleName => citationStyleName && (checkUppercase(citationStyleName)
		|| !!citationStyleName.match(/^american-medical-association|cite-them-right|^vancouver/));

// Sentence-case styles that capitalize subtitles like APA
const checkUppercase = citationStyleName => citationStyleName && !!citationStyleName.match(/^apa($|-)|^academy-of-management($|-)|^(freshwater-science)/);

const getStyleProperties = citationStyleXml => {
	if(!citationStyleXml) {
		return null;
	}

	if(!stylePropertiesCache.has(citationStyleXml))  {
		const parser = new DOMParser();
		const xmlDoc = parser.parseFromString(citationStyleXml, 'application/xml');
		const citationStyleName = getStyleName(xmlDoc, 'self');
		const parentStyleName = getStyleName(xmlDoc, 'independent-parent');
		const styleHasBibliography = xmlDoc.querySelector('style > bibliography') !== null;
		const isNumericStyle = xmlDoc.querySelector('info > category[citation-format^="numeric"]') !== null;
		const isNoteStyle = xmlDoc.querySelector('info > category[citation-format^="note"]') !== null;
		const isUppercaseSubtitlesStyle = checkUppercase(citationStyleName) || checkUppercase(parentStyleName);
		const isSentenceCaseStyle = checkSentenceCase(citationStyleName) || checkSentenceCase(parentStyleName);
		const defaultLocale = xmlDoc.querySelector('style')?.getAttribute('default-locale');

		stylePropertiesCache.set(citationStyleXml, { citationStyleName, defaultLocale,
			parentStyleName, styleHasBibliography, isNumericStyle, isNoteStyle,
			isUppercaseSubtitlesStyle, isSentenceCaseStyle, });
	}

	return stylePropertiesCache.get(citationStyleXml);
}

const fetchAndParseStyle = async styleName => {
	let styleXml, styleProps;
	if(stylesCache.has(styleName)) {
		styleXml = stylesCache.get(styleName);
	} else {
		const url = `https://www.zotero.org/styles/${styleName}`;
		const response = await fetchWithCachedFallback(url);
		if(!response.ok) {
			throw new Error(`Failed to fetch ${styleName} from ${url}`);
		}
		styleXml = await response.text();
		stylesCache.set(styleName, styleXml);
	}
	styleProps = getStyleProperties(styleXml);
	return { styleName, styleXml, styleProps }
}

const fetchAndParseIndependentStyle = async styleName => {
	const { styleXml, styleProps } = await fetchAndParseStyle(styleName);
	const { styleXml: parentStyleXml, styleProps: parentStyleProps } = (styleProps.parentStyleName ?
		await fetchAndParseStyle(styleProps.parentStyleName) : {});

	return { styleName, styleXml, parentStyleXml, styleProps: {
		...styleProps,
		...omit((parentStyleProps || {}), ['parentStyleName', 'defaultLocale']),
	}};
}

export { fetchAndParseIndependentStyle, getStyleProperties };
