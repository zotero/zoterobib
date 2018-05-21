/* eslint-env mocha */
'use strict';

const assert = require('chai').assert;
const utils = require('../src/js/utils');

describe('Zotero Bib utils.js', () => {
	it('identifies urls', () => {
		assert(utils.isLikeUrl('https://zotero.org'));
		assert(utils.isLikeUrl('https://zotero.org/a/b=c&d=f:g:h'));
		assert(utils.isLikeUrl('http://zotero.pizza'));
		assert(utils.isLikeUrl('zotero.org'));
		assert(utils.isLikeUrl('zotero.pizza'));
		assert(utils.isLikeUrl('zotero.org/a/b=c&d=f:g:h'));
	})

	it('does not confuse DOIs as urls', () => {
		assert.isFalse(utils.isLikeUrl('10.1111/j.1600-0587.2010.06629.x'));
	})
});
