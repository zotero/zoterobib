import fs from 'fs-extra';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

import { fetchIfNeeded } from './common.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const stylesCacheTime = process.env.STYLES_CACHE_TIME ?? 86400000;
const stylesURL = 'https://www.zotero.org/styles-files/styles.json';
const renamedStylesURL = 'https://raw.githubusercontent.com/citation-style-language/styles/refs/heads/master/renamed-styles.json'

const styles = [
	'apa',
	'chicago-shortened-notes-bibliography',
	'modern-language-association',
	'turabian-notes-bibliography'
];
const defaultStyle = 'modern-language-association';

(async () => {
	const stylesJsonPath = join(__dirname, '..', 'data', 'styles.json');
	const coreStylesPath = join(__dirname, '..', 'data', 'citation-styles-data.json');
	const renamedStylesPath = join(__dirname, '..', 'data', 'renamed-styles.json');

	const stylesMeta = JSON.parse(await fetchIfNeeded(stylesURL, stylesJsonPath, stylesCacheTime));
	const renamedStyles = JSON.parse(await fetchIfNeeded(renamedStylesURL, renamedStylesPath, stylesCacheTime));
	
	const coreCitationStyles = styles.map(style => {
		if(style in renamedStyles) {
			console.warn(`Core citation style "${style}" has been renamed to "${renamedStyles[style]}". Using the new name.`);
			style = renamedStyles[style];
		}
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
