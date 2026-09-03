import { isLikeZoteroItem } from './utils.js';
import { getZotero } from 'web-common/zotero';
import { requestTranslation, MULTIPLE } from 'web-common/utils';

const defaults = {
	translateURL: typeof window != 'undefined' && window.location.origin || '',
	translatePrefix: '',
	initialItems: [],
	storage: typeof window != 'undefined' && 'localStorage' in window && window.localStorage || {},
	persist: true,
	override: false,
	storagePrefix: 'zotero-bib'
};

class ZoteroTranslationClient {
	constructor(opts) {
		this.opts = {
			...defaults,
			...opts
		};

		if(this.opts.persist && this.opts.storage) {
			if(!('getItem' in this.opts.storage ||
				'setItem' in this.opts.storage ||
				'clear' in this.opts.storage
			)) {
				throw new Error('Invalid storage engine provided');
			}
			if(this.opts.override) {
				this.clearItems();
			}
			this.items = [...this.opts.initialItems, ...this.getItemsStorage()]
				.filter(isLikeZoteroItem);
			this.setItemsStorage(this.items);
		} else {
			this.items = [...this.opts.initialItems].filter(isLikeZoteroItem);
		}
	}

	getItemsStorage() {
		let items = this.opts.storage.getItem(`${this.opts.storagePrefix}-items`);
		return items ? JSON.parse(items) : [];
	}

	setItemsStorage(items) {
		this.opts.storage.setItem(
			`${this.opts.storagePrefix}-items`,
			JSON.stringify(items)
		);
	}

	reloadItems() {
		this.items = this.getItemsStorage();
	}

	addItem(item) {
		if(!isLikeZoteroItem(item)) {
			throw new Error('Failed to add item');
		}
		this.items.push(item);
		if(this.opts.persist) {
			this.setItemsStorage(this.items);
		}
	}

	updateItem(index, item) {
		this.items[index] = item;
		if(this.opts.persist) {
			this.setItemsStorage(this.items);
		}
	}

	removeItem(item) {
		let index = this.items.indexOf(item);
		if(index !== -1) {
			this.items.splice(index, 1);
			if(this.opts.persist) {
				this.setItemsStorage(this.items);
			}
			return item;
		}
		return false;
	}

	clearItems() {
		this.items = [];
		if(this.opts.persist) {
			this.setItemsStorage(this.items);
		}
	}

	get itemsCSL() {
		return this.items.map(i => getZotero().Utilities.Item.itemToCSLJSON({ ...i, uri: i.key, }))
	}

	get itemsRaw() {
		return this.items;
	}

	getTranslateURL(endpoint) {
		return `${this.opts.translateURL}${this.opts.translatePrefix}${endpoint}`;
	}

	async exportItems(format, { init } = {}) {
		const response = await fetch(this.getTranslateURL(`/export?format=${format}`), {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(this.items.filter(i => 'key' in i)),
			...init
		});
		if(response.ok) {
			return await response.text();
		} else {
			throw new Error('Failed to export items');
		}
	}

	translateIdentifier(identifier, { endpoint = '/search', init } = {}) {
		return this.translate(this.getTranslateURL(endpoint), identifier, init);
	}

	translateUrlItems(url, items, { endpoint = '/web', init } = {}) {
		return this.translate(this.getTranslateURL(endpoint), { url, items, session: this.session }, init);
	}

	translateUrl(url, { endpoint = '/web', init } = {}) {
		return this.translate(this.getTranslateURL(endpoint), url, init);
	}

	translateImport(data, { endpoint = '/import', init } = {}) {
		return this.translate(this.getTranslateURL(endpoint), data, init);
	}

	// Keeps the web session for a follow-up request and resolves the `CURRENT_TIMESTAMP` placeholder,
	// which only the Zotero API understands, since items are stored locally
	async translate(url, body, init) {
		const outcome = await requestTranslation(url, body, init);

		if(outcome.session) {
			this.session = outcome.session;
		}

		if(outcome.result === MULTIPLE) {
			outcome.items.forEach(item => {
				if(item.accessDate === 'CURRENT_TIMESTAMP') {
					item.accessDate = getZotero().Date.dateToSQL(new Date(Date.now()), true);
				}
			});
		}

		return outcome;
	}
}

export default ZoteroTranslationClient;
