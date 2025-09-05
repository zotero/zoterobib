import fs from 'fs-extra';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { minify } from 'terser';

import { fetchIfNeeded } from './common.mjs';

const citeprocCacheTime = process.env.CITEPROC_JS_CACHE_TIME ?? 86400000;
const citeprocJSURL = 'https://raw.githubusercontent.com/zotero/zotero/master/chrome/content/zotero/xpcom/citeproc.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

(async () => {
	const citeprocJSPath = join(__dirname, '..', 'src', 'static', 'js', 'citeproc.js');
	const source = await fetchIfNeeded(citeprocJSURL, citeprocJSPath, citeprocCacheTime);
	const { code: minified } = await minify(source, { safari10: true });
	await fs.outputFile(citeprocJSPath, minified);
})();
