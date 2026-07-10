import './wdyr';
import SmoothScroll from 'smooth-scroll';
import ZoteroBibComponent from './bib-component';

// required for Safari 10.1
import '@formatjs/intl-getcanonicallocales/polyfill.js'
import '@formatjs/intl-locale/polyfill.js'
// required for Safari <= 12.1
import '@formatjs/intl-pluralrules/polyfill.js'
import '@formatjs/intl-pluralrules/locale-data/en.js' // locale-data for en

const targetDom = document.getElementById('zotero-bib');

// Run Theme update
let theme = localStorage.getItem("theme") ?? "light";

if (document.body.classList.contains("dark") && theme == "light") {
	document.body.classList.remove("dark");
}

else if (theme=="dark") {
	document.body.classList.add("dark");
}

if(targetDom) {
	const config = JSON.parse(document.getElementById('zotero-bib-config').textContent);
	ZoteroBibComponent.init(targetDom, config);
} else {
	new SmoothScroll('main.faq a[href*="#"]', {offset: 16});
}
