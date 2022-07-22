// const appDefaults = require('../src/js/constants/defaults');
const fetch = require('cross-fetch');
const fs = require('fs-extra');
const path = require('path');
const { minify } = require("terser");

const stylesCacheTime = process.env.CITEPROC_JS_CACHE_TIME ?? 86400000;
const citeprocJSURL = 'https://raw.githubusercontent.com/zotero/zotero/master/chrome/content/zotero/xpcom/citeproc.js';


(async () => {
    const citeprocJSPath = path.join(__dirname, '..', 'src', 'static', 'js', 'citeproc.js');

    try {
        const stat = await fs.stat(citeprocJSPath);
        if (new Date() - new Date(stat.mtime) > stylesCacheTime) {
            throw new Error();
        }
    } catch (e) {
        console.log(`Downloading ${citeprocJSURL}`);
        const citeprocJS = (await minify(await (await fetch(citeprocJSURL)).text(), { safari10: true })).code;
        await fs.outputFile(citeprocJSPath, citeprocJS);
        console.log(`citeproc.js has been downloaded, minified and saved to ${citeprocJSPath}`);
    }
})();
