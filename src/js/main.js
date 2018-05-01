'use strict';

const ZoteroBibComponent = require('./bib-component');
const targetDom = document.getElementById('zotero-bib');
const config = JSON.parse(document.getElementById('zotero-bib-config').textContent);

ZoteroBibComponent.init(targetDom, config);
