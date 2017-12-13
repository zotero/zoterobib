'use strict';

const fs = require('fs-extra');
const path = require('path');
const config = require('config');
const Handlebars = require('handlebars');

(async () => {
	const indexConfig = config.get('indexConfig');
	const srcFile = path.join(__dirname, '..', 'src', 'html', 'index.hbs');
	const dstFile = path.join(__dirname, '..', 'build', 'index.html');
	const index = await fs.readFile(srcFile);
	const template = Handlebars.compile(index.toString());
	const output = await template({ indexConfig });
	await fs.writeFile(dstFile, output);
	console.log(`index.html generated based on ${config.util.getConfigSources().length} config sources`);
})();
