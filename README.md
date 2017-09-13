# Zotero Bib React Component

Overview
--------
This is a react component that is renders and manages GUI for zotero-bib.

Prerequisites
------------

1. Node JS with npm
1. Running translation-server

Local Demo
----------

Getting The Library

1. `git clone git@github.com:zotero/bib-web.git`

1. `cd bib-web`

1. `npm install`

1. `npm start`

This will serve demo on http://127.0.0.1:8001.

By default the **translations server is expected to be listening on localhost:1969**. If your server is located elsewhere you need to provide the path, e.g. the last step above would look like this:

1. `npm start --zotero-bib-web:translation_server="http://localhost:1234"`


Using in Production
-------------------

To obtain production-ready files use the following npm command:

`npm run build`

By default current host is assumed to proxy request to the translation server, i.e. if serving at http:://example.com/index.html, request to the translation server will use the following url: http:://example.com/web.

If instead you would like client (i.e. browser) talk directly to the translation server (that should be then configured for CORS), it's possible with the following configuration:

    ZoteroBibComponent.init(
            document.getElementById('bib-component'),
            { translationServerUrl: 'http://some-url:1234' }
        );

Or if using within another react app:

    <ZoteroBibComponent config={ { translationServerUrl: 'http://some-url:1234' } }


