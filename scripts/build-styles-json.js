'use strict';

const fetch = require('isomorphic-fetch');
const fs = require('fs-extra');
const path = require('path');
const appDefaults = require('../src/js/constants/defaults');

const styles = [
	'apa',
	'chicago-note-bibliography',
	'modern-language-association',
	'turabian-fullnote-bibliography'
];
const defaultStyle = 'modern-language-association';

(async () => {
	const stylesJsonPath = path.join(__dirname, '..', 'data', 'styles.json');
	const coreStylesPath = path.join(__dirname, '..', 'data', 'citation-styles-data.json');
	var stylesMeta;
	try {
		stylesMeta = await fs.readJson(stylesJsonPath);
		var stat = await fs.stat(stylesJsonPath);
		if(new Date() - new Date(stat.mtime) > appDefaults.stylesCacheTime) {
			throw new Error();
		}
	} catch(e) {
		console.log(`Downloading ${appDefaults.stylesUrl}`);
		stylesMeta = await (await fetch(appDefaults.stylesUrl)).json();
		await fs.outputJson(stylesJsonPath, stylesMeta);
	}
	const coreCitationStyles = styles.map(style => {
		const styleMeta = stylesMeta.find(sm => sm.name === style);
		if(!styleMeta) {
			console.warn(`Could not find name for style ${style}`);
			return;
		}
		return {
			isDefault: style === defaultStyle,
			name: style,
			title: styleMeta.title,
		};
	}).filter(Boolean);
	const citationStylesCount = stylesMeta.length;
	const output = {
		coreCitationStyles,
		citationStylesCount
	};
	await fs.outputJson(coreStylesPath, output);
	console.log('citation-styles-data.json has been generated');
})();
