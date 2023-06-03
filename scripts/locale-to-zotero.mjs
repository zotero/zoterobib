import { fileURLToPath } from 'url';
import * as fs from 'fs/promises';
import { dirname, join, resolve } from 'path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const pathToZotero = process.argv[2] ?? join(ROOT, '..', 'zotero-client');
const pathToZoteroLocalesDir = join(pathToZotero, 'chrome', 'locale', 'en-US', 'zotero');
const localePath = join(ROOT, 'lang', 'tx', 'en-US.json');

try {
    await fs.access(localePath);
} catch (e) {
    console.log(`Could not find locale file at ${resolve(localePath)}. Run build:extract-messages first.`);
    process.exit(1);
}

(async () => {
    try {
        await fs.access(pathToZoteroLocalesDir);
    }
    catch (e) {
        console.log(`Could not find Zotero locale directory at ${resolve(pathToZoteroLocalesDir)}`);
        process.exit(1);
    }

    process.stdout.write(`Copying "${resolve(localePath)}" "${resolve(pathToZoteroLocalesDir)}"... `);
    try {
        await fs.copyFile(join(ROOT, 'lang', 'tx', 'en-US.json'), join(pathToZoteroLocalesDir, 'zoterobib.json'));
        console.log('DONE!');
    }
    catch (e) {
        console.log('FAILED!');
        console.log(e);
        process.exit(1);
    }
})();