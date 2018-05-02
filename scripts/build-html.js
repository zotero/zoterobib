'use strict';

const cheerio = require('cheerio');
const config = require('config');
const fs = require('fs-extra');
const Handlebars = require('handlebars');
const marked = require('marked');
const path = require('path');

Handlebars.registerHelper('json', context => JSON.stringify(context));

const addAnchors = html => {
	var $ = cheerio.load(html);
	var headers = $('h2, h3');
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
	const faqHTML = addAnchors(
		marked(faqMarkdown.toString(), { smartypants: true })
		// Remove "-" at end of id attributes, which marked substitutes for question marks
		.replace(/(id="[^"]+)-"/g, '$1"')
	);
	const output = await template({ faq: faqHTML });
	await fs.writeFile(dstFile, output);
	console.log('faq page generated');
};

const buildIndexPage = async () => {
	const indexConfig = config.get('indexConfig');
	const srcFile = path.join(__dirname, '..', 'src', 'html', 'index.hbs');
	const dstFile = path.join(__dirname, '..', 'build', 'index');
	const index = await fs.readFile(srcFile);
	const template = Handlebars.compile(index.toString());
	const output = await template({ indexConfig });

	await fs.writeFile(dstFile, output);
	console.log(`index page generated based on ${config.util.getConfigSources().length} config sources`);
};

(async () => {
	const dstDir = path.join(__dirname, '..', 'build');
	await fs.ensureDir(dstDir);
	await Promise.all([buildIndexPage(), buildFaqPage()]);
})();
