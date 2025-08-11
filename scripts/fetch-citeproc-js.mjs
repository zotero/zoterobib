import fetch from 'cross-fetch';
import fs from 'fs-extra';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { minify } from 'terser';

const stylesCacheTime = process.env.CITEPROC_JS_CACHE_TIME ?? 86400000;
const citeprocJSURL = 'https://raw.githubusercontent.com/zotero/zotero/master/chrome/content/zotero/xpcom/citeproc.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

(async () => {
	const citeprocJSPath = join(__dirname, '..', 'src', 'static', 'js', 'citeproc.js');

	try {
		const stat = await fs.stat(citeprocJSPath);
		if (Date.now() - new Date(stat.mtime).getTime() > stylesCacheTime) {
			throw new Error('Cache expired');
		}
	} catch {
		console.log(`Downloading ${citeprocJSURL}`);
		const response = await fetch(citeprocJSURL);
		const source = await response.text();
		const { code: minified } = await minify(source, { safari10: true });
		await fs.outputFile(citeprocJSPath, minified);
		console.log(`citeproc.js has been downloaded, minified and saved to ${citeprocJSPath}`);
	}
})();
