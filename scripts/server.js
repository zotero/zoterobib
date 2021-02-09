const fs = require('fs');
const path = require('path');
const http = require('http');
const serveStatic = require('serve-static');
const httpProxy = require('http-proxy');
const translateURL = process.env.TRANSLATE_URL ?? 'http://localhost:1969';
const port = process.env.PORT ?? 8001;

const serve = serveStatic(path.join(__dirname, '..', 'build'), { 'index': false });
const proxy = httpProxy.createProxyServer();

const handler = (req, resp) => {
	const fallback = () => {
		fs.readFile(path.join(__dirname, '..', 'build', 'index'), (err, buf) => {
			resp.setHeader('Content-Type', 'text/html');
			resp.end(buf);
		});
	};

	if(req.url.startsWith('/web') || req.url.startsWith('/search') || req.url.startsWith('/export')) {
		proxy.web(req, resp, {
			changeOrigin: true,
			target: `${translateURL}`,
			secure: false
		});
		proxy.on('error', err => {
			resp.statusCode = 502;
			resp.statusMessage = `Translation Server not available at ${translateURL}: ${err}`;
			resp.end();
		});
	} else if (req.url == '/faq') {
		fs.readFile(path.join(__dirname, '..', 'build', 'faq'), (err, buf) => {
			resp.setHeader('Content-Type', 'text/html');
			resp.end(buf);
		});
	} else {
		serve(req, resp, fallback);
	}
};

http.createServer(handler).listen(port);
