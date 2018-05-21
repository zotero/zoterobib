/* eslint-env mocha */
'use strict';

const assert = require('chai').assert;
const utils = require('../src/js/utils');

describe('Zotero Bib utils.js', () => {
	it('identifies urls with recognized schema', () => {
		assert.isTrue(utils.isLikeUrl('https://zotero.org'));
		assert.isTrue(utils.isLikeUrl('https://zotero.org/a/b=c&d=f:g;h&i=j/k/l@m-f_o.p+r!!*\'()'));
		assert.isTrue(utils.isLikeUrl('http://zotero.pizza'));
	})

	it('identifies urls without schema', () => {
		assert.isTrue(utils.isLikeUrl('zotero.org'));
		assert.isTrue(utils.isLikeUrl('zotero.pizza'));
		assert.isTrue(utils.isLikeUrl('zotero.org/a/b=c&d=f:g;h&i=j/k/l@m-f_o.p+r!!*\'()'));
	})

	it('ignores urls with unrecognized schema', () => {
		assert.isFalse(utils.isLikeUrl('ftp://zotero.org'));
		assert.isFalse(utils.isLikeUrl('ssh://zotero.pizza'));
		assert.isFalse(utils.isLikeUrl('foobar://zotero.org/a/b=c&d=f:g;h&i=j/k/l@m-f_o.p+r!!*\'()'));
	})

	it('ignores urls that are part of the sentences', () => {
		assert.isFalse(utils.isLikeUrl('go to zotero.org'));
		assert.isFalse(utils.isLikeUrl('http://zotero.pizza has the best pizza'));
		assert.isFalse(utils.isLikeUrl('foobar://zotero.org/a/b=c&d=f:g;h&i=j/k/l@m-f_o.p+r!!*\'() is crazy url'));
	})

	it('does not confuse DOIs as urls', () => {
		assert.isFalse(utils.isLikeUrl('10.1111/j.1600-0587.2010.06629.x'));
	})
});
