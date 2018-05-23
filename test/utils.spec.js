/* eslint-env mocha */
'use strict';

const assert = require('chai').assert;
const utils = require('../src/js/utils');
const sinon = require('sinon');

class FakeStore {
	constructor() { this.clear(); }
	getItem(key) { return key in this.storage && this.storage[key] || null }
	setItem(key, value) { this.storage[key] = value }
	clear() { this.storage = {} }
}

describe('Zotero Bib utils.js', () => {
	describe('isLikeUrl()', () => {
		it('identifies urls with recognized schema', () => {
			assert.isTrue(utils.isLikeUrl('https://zotero.org'));
			assert.isTrue(utils.isLikeUrl('https://zotero.org/a/b=c&d=f:g;h&i=j/k/l@m-f_o.p+r!!*\'()'));
			assert.isTrue(utils.isLikeUrl('http://zotero.pizza'));
		});

		it('identifies urls without schema', () => {
			assert.isTrue(utils.isLikeUrl('zotero.org'));
			assert.isTrue(utils.isLikeUrl('zotero.pizza'));
			assert.isTrue(utils.isLikeUrl('zotero.org/a/b=c&d=f:g;h&i=j/k/l@m-f_o.p+r!!*\'()'));
		});

		it('ignores urls with unrecognized schema', () => {
			assert.isFalse(utils.isLikeUrl('ftp://zotero.org'));
			assert.isFalse(utils.isLikeUrl('ssh://zotero.pizza'));
			assert.isFalse(utils.isLikeUrl('foobar://zotero.org/a/b=c&d=f:g;h&i=j/k/l@m-f_o.p+r!!*\'()'));
		});

		it('ignores urls that are part of the sentences', () => {
			assert.isFalse(utils.isLikeUrl('go to zotero.org'));
			assert.isFalse(utils.isLikeUrl('http://zotero.pizza has the best pizza'));
			assert.isFalse(utils.isLikeUrl('foobar://zotero.org/a/b=c&d=f:g;h&i=j/k/l@m-f_o.p+r!!*\'() is crazy url'));
		});

		it('does not confuse DOIs as urls', () => {
			assert.isFalse(utils.isLikeUrl('10.1111/j.1600-0587.2010.06629.x'));
		});
	});
	describe('retrieveLocaleSync()', () => {
		const localeXml = '<?xml>locale</xml>';
		var storage;
		var fakeServer;

		beforeEach(() => {
			storage = (global || window).localStorage = new FakeStore();
			(global || window).XMLHttpRequest = sinon.useFakeXMLHttpRequest();
			fakeServer = sinon.fakeServer.create();
			fakeServer.autoRespond = true;
			fakeServer.respondWith(
				"GET",
				"/static/locales/locales-en-GB.xml",
				[200, { "Content-Type": "application/xml" }, localeXml]
			);
			fakeServer.respondWith(
				"GET",
				"/static/locales/locales-foobar.xml",
				[404, { "Content-Type": "text/plain" }, "Not Found"]
			);
		});

		afterEach(() => {
			assert.equal(utils.retrieveLocaleSync('en-GB'), localeXml);
			fakeServer.restore();
		});

		it('retrieves locale from the server & localStorage', () => {
			const localeExpectedCacheId = 'zotero-style-locales-en-GB';
			assert.equal(utils.retrieveLocaleSync('en-GB'), localeXml);
			assert.equal(storage.getItem(localeExpectedCacheId), localeXml);
			assert.equal(utils.retrieveLocaleSync('en-GB'), localeXml);
			assert.equal(fakeServer.requests.length, 1);
		});

		it('returns false when locale is not available', () => {
			assert.isFalse(utils.retrieveLocaleSync('foobar'));
		});
	});
});
