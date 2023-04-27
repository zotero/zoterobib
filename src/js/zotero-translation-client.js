import { isLikeZoteroItem, mergeFetchOptions } from './utils.js';
import { Zotero } from './zotero-shim.js';

const defaults = {
	translateURL: typeof window != 'undefined' && window.location.origin || '',
	translatePrefix: '',
	fetchConfig: {},
	initialItems: [],
	request: {},
	storage: typeof window != 'undefined' && 'localStorage' in window && window.localStorage || {},
	persist: true,
	override: false,
	storagePrefix: 'zotero-bib'
};

const [ COMPLETE, MULTIPLE_CHOICES, FAILED ] = [ 'COMPLETE', 'MULTIPLE_CHOICES', 'FAILED' ];
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
		if (!Zotero.Schema.CSL_TYPE_MAPPINGS) {
			throw new Error('Zotero.Schema must be initialized before calling itemsCSL');
		}
		return this.items.map(i => Zotero.Utilities.Item.itemToCSLJSON({ ...i, uri: i.key, }))
	}

	get itemsRaw() {
		return this.items;
	}

	async exportItems(format, opts = {}) {
		let translateURL = `${this.opts.translateURL}/${this.opts.translatePrefix}export?format=${format}`;
		let fetchOptions = mergeFetchOptions({
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(this.items.filter(i => 'key' in i )),
		}, this.opts, opts);
		const response = await fetch(translateURL, fetchOptions);
		if(response.ok) {
			return await response.text();
		} else {
			throw new Error('Failed to export items');
		}
	}

	async translateIdentifier(identifier, { endpoint = '/search', ...opts } = {}) {
		let translateURL = `${this.opts.translateURL}${this.opts.translatePrefix}${endpoint}`;

		let init = mergeFetchOptions({
			method: 'POST',
			headers: {
				'Content-Type': 'text/plain',
			},
			body: identifier,
		}, this.opts, opts);

		return await this.translate(translateURL, init, opts);
	}

	async translateUrlItems(url, items, { endpoint = '/web', ...opts } = {}) {
		let translateURL = `${this.opts.translateURL}${this.opts.translatePrefix}${endpoint}`;
		let data = { url, items, session: this.session, ...this.opts.request };

		let init = mergeFetchOptions({
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(data),
		}, this.opts, opts);

		return await this.translate(translateURL, init, opts);
	}

	async translateUrl(url, { endpoint = '/web', ...opts } = {}) {
		let translateURL = `${this.opts.translateURL}${this.opts.translatePrefix}${endpoint}`;

		let init = mergeFetchOptions({
			method: 'POST',
			headers: {
				'Content-Type': 'text/plain',
			},
			body: url,
		}, this.opts, opts);

		return await this.translate(translateURL, init, opts);
	}

	async translateImport(data, { endpoint = '/import', ...opts } = {}) {
		let translateURL = `${this.opts.translateURL}${this.opts.translatePrefix}${endpoint}`;
		let init = mergeFetchOptions({
			method: 'POST',
			headers: {
				'Content-Type': 'text/plain',
			},
			body: data,
		}, this.opts, opts);

		return await this.translate(translateURL, init, opts);
	}

	async translate(url, fetchOptions, { add = true } = {}) {
		const response = await fetch(url, fetchOptions);
		var items, result, next = null;

		if(response.headers.has('link')) {
			const links = response.headers.get('link');
			const matches = links.match(/<(.*?)>;\s+rel="next"/i);

			if(matches && matches.length > 1) {
				next = matches[1];
			}
		}
		if(response.ok) {
			items = await response.json();
			if(Array.isArray(items)) {
				items.forEach(item => {
					if(item.accessDate === 'CURRENT_TIMESTAMP') {
						const dt = new Date(Date.now());
						item.accessDate = Zotero.Date.dateToSQL(dt, true);
					}
					if(add) {
						this.addItem(item);
					}
				});
			}
			result = Array.isArray(items) ? COMPLETE : FAILED;
		} else if(response.status === 300) {
			var data = await response.json();
			if('items' in data && 'session' in data) {
				this.session = data.session;
				items = data.items;
			} else {
				items = data;
			}
			result = MULTIPLE_CHOICES;
		} else {
			result = FAILED
		}

		return { result, items, response, next };
	}

	static get COMPLETE() { return COMPLETE }
	static get MULTIPLE_CHOICES() { return MULTIPLE_CHOICES }
	static get FAILED() { return FAILED }
}

export default ZoteroTranslationClient;
