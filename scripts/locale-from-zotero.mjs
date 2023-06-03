import { fileURLToPath } from 'url';
import * as fs from 'fs/promises';
import { dirname, join, resolve } from 'path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const pathToZotero = process.argv[2] ?? join(ROOT, '..', 'zotero-client');
const pathToZoteroLocalesDir = join(pathToZotero, 'chrome', 'locale');
const localeDirPath = join(ROOT, 'lang', 'tx');


(async () => {
    try {
        await fs.access(pathToZoteroLocalesDir);
    }
    catch (e) {
        console.log(`Could not find Zotero locale directory at ${resolve(pathToZoteroLocalesDir)}`);
        process.exit(1);
    }

    const foundLocales = (await fs.readdir(pathToZoteroLocalesDir, { withFileTypes: true }))
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name)
        // Valid locale codes only
        .filter(name => /^[a-z]{2}(-[A-Z]{2})?$/.test(name));

    const promises = [];
    for (const locale of foundLocales) {
        if (locale === 'en-US') {
            continue;
        }
        const pathToZoteroBibJson = join(pathToZoteroLocalesDir, locale, 'zotero', 'zoterobib.json');
        try {
            await fs.access(pathToZoteroBibJson);
            console.log(`Found ${locale} locale file at ${pathToZoteroBibJson}`)
        }
        catch (e) {
            continue;
        }
        const pathToLocaleJson = join(localeDirPath, `${locale}.json`);
        promises.push(await fs.copyFile(pathToZoteroBibJson, pathToLocaleJson));
    }
    await Promise.all(promises);
    console.log(`Copied ${promises.length} locale files to ${localeDirPath}`);
})();