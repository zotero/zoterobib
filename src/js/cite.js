import CiteprocWrapper from './citeproc-wrapper';

const formatFallback = bibliographyItems => {
	return `<ol><li>${bibliographyItems.map(renderedItem => renderedItem.value).join('</li><li>')}</li></ol>`;
}

// adapter from citeproc-rs output
const formatBib = (bibliographyItems, bibliographyMeta) => {
	return formatBibLegacy([
		CiteprocWrapper.metaCiteprocRStoJS(bibliographyMeta),
		bibliographyItems.map(renderedItem => renderedItem.value)
	]);
};

// adapted from https://github.com/zotero/zotero/blob/553d2b00d86f852e051a9d76474993cd0575f7cd/chrome/content/zotero/xpcom/cite.js#L140-L274
const formatBibLegacy = (bib) => {
	var output = [
		bib[0].bibstart,
		...bib[1],
		bib[0].bibend
	];

	var maxOffset = parseInt(bib[0].maxoffset, 10);
	var entrySpacing = parseInt(bib[0].entryspacing, 10);
	var lineSpacing = parseInt(bib[0].linespacing, 10);
	var hangingIndent = bib[0].hangingindent;
	var secondFieldAlign = bib[0]['second-field-align'];

	// Validate input
	if(Number.isNaN(maxOffset)) {
		throw 'Invalid maxoffset';
	}
	if(Number.isNaN(entrySpacing)) {
		throw 'Invalid entryspacing';
	}
	if(Number.isNaN(lineSpacing)) {
		throw 'Invalid linespacing';
	}

	const container = document.createElement('div');
	container.innerHTML = output.join('');
	const bibBody = container.firstChild;
	const leftMarginDivs = container.querySelectorAll('.csl-left-margin');
	const rightInlineDivs = container.querySelectorAll('.csl-right-inline');
	const indentDivs = container.querySelectorAll('.csl-indent');
	const isMultiField = !!leftMarginDivs.length;
	// Padding on the label column, which we need to include when
	// calculating offset of right column
	const rightPadding = .5;

	// One of the characters is usually a period, so we can adjust this down a bit
	maxOffset = Math.max(1, maxOffset - 2);

	// Force a minimum line height
	if(lineSpacing <= 1.35) {
		lineSpacing = 1.35;
	}

	var style = bibBody.getAttribute('style') || '';
	style += 'line-height: ' + lineSpacing + '; ';

	if(hangingIndent) {
		if (isMultiField && !secondFieldAlign) {
			throw ('second-field-align=false and hangingindent=true combination is not currently supported');
		}
		// If only one field, apply hanging indent on root
		else if (!isMultiField) {
			style += 'margin-left: 2em; text-indent:-2em;';
		}
	}

	if(style) {
		bibBody.setAttribute('style', style);
	}

	// csl-entry
	const cslEntries = container.querySelectorAll('.csl-entry');
	for(var i=0, n=cslEntries.length; i<n; i++) {
		const cslEntry = cslEntries[i];
		let divStyle = cslEntry.getAttribute('style') || '';

		if(isMultiField) {
			divStyle += 'clear: left; ';
		}

		if(entrySpacing && i !== n - 1) {
			divStyle += 'margin-bottom: ' + entrySpacing + 'em;';
		}

		if(divStyle) {
			cslEntry.setAttribute('style', divStyle);
		}
	}

	// div.csl-left-margin
	for (let leftMarginDiv of leftMarginDivs) {
		let divStyle = leftMarginDiv.getAttribute('style') || '';

		divStyle = 'float: left; padding-right: ' + rightPadding + 'em;';

		// Right-align the labels if aligning second line, since it looks
		// better and we don't need the second line of text to align with
		// the left edge of the label
		if (secondFieldAlign) {
			divStyle += 'text-align: right; width: ' + maxOffset + 'em;';
		}

		leftMarginDiv.setAttribute('style', divStyle);
	}

	// div.csl-right-inline
	for (let rightInlineDiv of rightInlineDivs) {
		let divStyle = rightInlineDiv.getAttribute('style') || '';
		divStyle = 'margin: 0 .4em 0 ' + (secondFieldAlign ? maxOffset + rightPadding : '0') + 'em;';

		if (hangingIndent) {
			divStyle += 'padding-left: 2em; text-indent:-2em;';
		}

		rightInlineDiv.setAttribute('style', divStyle);
	}

	// div.csl-indent
	for (let indentDiv of indentDivs) {
		indentDiv.setAttribute('style', 'margin: .5em 0 0 2em; padding: 0 0 .2em .5em; border-left: 5px solid #ccc;');
	}

	return container.innerHTML;
};

const getBibliographyFormatParameters = bibliographyMeta =>
	getBibliographyFormatParametersLegacy([CiteprocWrapper.metaCiteprocRStoJS(bibliographyMeta)]);

/**
	 * copied from https://github.com/zotero/zotero/blob/1f5639da4297ac20fd21223d2004a7cfeef72e21/chrome/content/zotero/xpcom/cite.js#L43
	 * Convert formatting data from citeproc-js bibliography object into explicit format
	 * parameters for RTF or word processors
	 * @param {bib} citeproc-js bibliography object
	 * @return {Object} Bibliography style parameters.
 */
const getBibliographyFormatParametersLegacy = bib => {
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

export { formatBib, formatBibLegacy, formatFallback, getBibliographyFormatParameters, getBibliographyFormatParametersLegacy };
