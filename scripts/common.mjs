import fetch from 'cross-fetch';
import fs from 'fs-extra';

export async function fetchIfNeeded(url, path, cacheTime) {
    try {
        const stat = await fs.stat(path);
        if (Date.now() - new Date(stat.mtime).getTime() > cacheTime) {
            throw new Error('Cache expired');
        }
        return await fs.readFile(path, 'utf8');
    } catch {
        console.log(`Downloading ${url}`);
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to download ${url}: ${response.status} ${response.statusText}`);
        }
        const text = await response.text();
        await fs.outputFile(path, text, 'utf8');
        return text;
    }
}