'use strict';

const cheerio = require('cheerio');
const config = require('config');
const fs = require('fs-extra');
const Handlebars = require('handlebars');
const marked = require('marked');
const path = require('path');

Handlebars.registerHelper('json', context => JSON.stringify(context));

const addAnchors = html => {
	const $ = cheerio.load(html);
	const headers = $('h2, h3');
	headers.map((_, element) => {
		const id = element.attribs.id;
		$('<a>')
			.attr('href', '#' + id)
			.addClass('anchor-link')
			.text('#')
			.appendTo(element);
	});
	return $.html();
};

const buildFaqPage = async () => {
	const faqMarkdown = await fs.readFile(path.join(__dirname, '..', 'src', 'html', 'faq.md'));
	const faqTemplate = await fs.readFile(path.join(__dirname, '..', 'src', 'html', 'faq.hbs'));
	const dstFile = path.join(__dirname, '..', 'build', 'faq');
	const template = Handlebars.compile(faqTemplate.toString());
	const faqHTML = marked(faqMarkdown.toString(), { smartypants: true })
					// Remove "-" at end of id attributes, which marked substitutes for question marks
						.replace(/(id="[^"]+)-"/g, '$1"');
	const output = addAnchors(await template({ faq: faqHTML }));
	await fs.writeFile(dstFile, output);
	console.log('faq page generated');
};

const buildPage = async pageName => {
	const indexConfig = config.get('indexConfig');
	const srcFile = path.join(__dirname, '..', 'src', 'html', `${pageName}.hbs`);
	const dstFile = path.join(__dirname, '..', 'build', pageName);
	const page = await fs.readFile(srcFile);
	const template = Handlebars.compile(page.toString());
	const output = await template({ indexConfig });

	await fs.writeFile(dstFile, output);
	console.log(`${pageName} page generated based on ${config.util.getConfigSources().length} config sources`);
};

(async () => {
	const dstDir = path.join(__dirname, '..', 'build');
	await fs.ensureDir(dstDir);
	if(process.env.NODE_ENV?.startsWith('prod')) {
		// if doing a production build skip hydrate.hbs 
		await Promise.all([buildPage('index'), buildFaqPage()]);
	} else {
		await Promise.all([buildPage('index'), buildPage('hydrate'), buildFaqPage()]);
	}
})();
