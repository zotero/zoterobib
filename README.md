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

