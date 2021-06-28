import './wdyr';
import SmoothScroll from 'smooth-scroll';
import ZoteroBibComponent from './bib-component';

const targetDom = document.getElementById('zotero-bib');

if(targetDom) {
	const config = JSON.parse(document.getElementById('zotero-bib-config').textContent);
	ZoteroBibComponent.init(targetDom, config);
} else {
	new SmoothScroll('main.faq a[href*="#"]', {offset: 16});
}
