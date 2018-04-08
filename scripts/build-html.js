'use strict';

const fs = require('fs-extra');
const path = require('path');
const config = require('config');
const marked = require('marked');
const Handlebars = require('handlebars');

(async () => {
	// Index
	var indexConfig = config.get('indexConfig');
	var srcFile = path.join(__dirname, '..', 'src', 'html', 'index.hbs');
	var dstFile = path.join(__dirname, '..', 'build', 'index.html');
	var index = await fs.readFile(srcFile);
	var template = Handlebars.compile(index.toString());
	var output = await template({ indexConfig });
	await fs.writeFile(dstFile, output);
	console.log(`index.html generated based on ${config.util.getConfigSources().length} config sources`);
	
	// Generate FAQ from Markdown source
	var faqMarkdown = await fs.readFile(path.join(__dirname, '..', 'src', 'html', 'faq.md'));
	var faqTemplate = await fs.readFile(path.join(__dirname, '..', 'src', 'html', 'faq.hbs'));
	dstFile = path.join(__dirname, '..', 'build', 'faq.html');
	await fs.ensureDir(path.dirname(dstFile))
	template = Handlebars.compile(faqTemplate.toString());
	var faqHTML = marked(faqMarkdown.toString(), { smartypants: true })
		// Remove "-" at end of id attributes, which marked uses substitutes for question marks
		.replace(/(id="[^"]+)-"/g, '$1"');
	output = await template({ faq: faqHTML });
	await fs.writeFile(dstFile, output);
	console.log(`faq.html generated`);
})();
