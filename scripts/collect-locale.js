import * as fs from 'fs/promises';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const collectLocale = async (pathToLocales, outputPath) => {
	const files = await fs.readdir(pathToLocales);
	const localeXmls = files.filter(fname => fname.startsWith('locales') && fname.endsWith('.xml'));
	const locales = localeXmls.map(xml => xml.slice(8, -4)).map(locale => {
		const localeSplit = locale.split('-');
		return localeSplit.length > 1 ?
			`${localeSplit[0].toLowerCase()}-${localeSplit[1].toUpperCase()}` :
			localeSplit[0].toLowerCase();
	});

	await fs.mkdir(resolve(dirname(outputPath)), { recursive: true });
	await fs.writeFile(outputPath, JSON.stringify(locales));
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const pathToLocales = `${dirname(fileURLToPath(import.meta.url))}/../third-party/locales`;
	const outputPath = `${dirname(fileURLToPath(import.meta.url))}/../data/supported-locales.json`;
	collectLocale(pathToLocales, outputPath);
}

export default collectLocale;
