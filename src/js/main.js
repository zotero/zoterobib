'use strict';

require('babel-regenerator-runtime');

const SmoothScroll = require('smooth-scroll');
const ZoteroBibComponent = require('./bib-component');

const targetDom = document.getElementById('schroeder-cite');

if(targetDom) {
	const config = JSON.parse(document.getElementById('schroeder-cite-config').textContent);
	ZoteroBibComponent.init(targetDom, config);
} else {
	new SmoothScroll('main.faq a[href*="#"]', {offset: 16});
}
