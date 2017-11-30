'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');
const serveStatic = require('serve-static');
const httpProxy = require('http-proxy');
const argv = require('minimist')(process.argv.slice(2));
const translationServerUrl = argv['t'] || 'http://localhost:1969';
const port = argv['p'] || 8001;

const serve = serveStatic(path.join(__dirname, '..', 'build'), {'index': ['index.html']});
const proxy = httpProxy.createProxyServer();

const server = http.createServer((req, resp) => {
	const fallback = () => {
		fs.readFile(path.join(__dirname, '..', 'build', 'index.html'), (err, buf) => {
			resp.setHeader('Content-Type', 'text/html');
			resp.end(buf);
		});
	};

	if(req.url.startsWith('/web') || req.url.startsWith('/search') || req.url.startsWith('/export')) {
		proxy.web(req, resp, {
			target: `${translationServerUrl}`
		});
		proxy.on('error', () => {
			resp.statusCode = 502;
			resp.statusMessage = 'Translation Server not available';
			resp.end();
		});
	} else {
		serve(req, resp, fallback);
	}
});

server.listen(port);
