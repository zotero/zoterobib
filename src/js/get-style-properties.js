const stylePropertiesCache = new Map();

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

		stylePropertiesCache.set(citationStyleXml, { citationStyleName, parentStyleName, styleHasBibliography,
			isNumericStyle, isNoteStyle, isUppercaseSubtitlesStyle, isSentenceCaseStyle, });
	}

	return stylePropertiesCache.get(citationStyleXml);
}

export { getStyleProperties };
