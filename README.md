[![CI](https://github.com/zotero/zoterobib/actions/workflows/ci.yml/badge.svg)](https://github.com/zotero/zoterobib/actions/workflows/ci.yml)
# Zotero Bib

Overview
--------
This repo contains code for [Zotero Bib](https://zbib.org/), including React components, translation client, stylesheets and entry-point website.

Prerequisites
------------

1. Node JS with npm
1. Basic command-line tools including rsync
1. Existing translation-server
1. Existing bib-server
1. Existing styles-repo

Local Development version
----------

Getting The Library

1. `git clone --recursive git@github.com:zotero/zoterobib.git`

1. `cd zoterobib`

1. `npm install`

1. `npm start`

This will serve demo on http://127.0.0.1:8001. 

You might need to provide configuration options (see below) in order to get storage and translation to work. 

By default, the development server **proxies translations server requests to localhost:1969**. If your server is located elsewhere you need to provide the url, e.g. the last step above would look like this:

1. `TRANSLATE_URL=http://localhost:1234 npm start`

This will proxy requests from the browser to the specified translation server.

Using in Production
-------------------

To obtain production-ready files use the following npm command:

`npm run build`

Configuration
-------------

It's possible to provide configuration parameters for the build (both in development and production) using configuration files and/or environment variables. 

The easiest way is to copy `config/default.json` to `config/local.json` and place variables there (this file is git ignored and should not be committed). Alternatively environment variables listed in `config/custom-environment-variables.json` can be used. For more details how to provide configurations, see [config npm package](https://github.com/lorenwest/node-config).

Configuration options
--------------

The following configuration options are accepted:

**storeURL**
Specifies url for the *bib-server* api where bibliographies are stored. 

**stylesURL**
Specifies url for the *styles-repo* website. When left empty, default will be used which is https://www.zotero.org/styles-files/styles.json

**translatePrefix**
Specifies an additional prefix for where translation server request should be send. Useful in cases where `translateURL` is left empty so that it's possible to direct requests to a specific endpoint at wherever zotero-bib is being hosted.

**translateURL**
Specifies URL for the *translation-server*. By default localhost is assumed to proxy request to the translation server.

**apiAuthorityPart**
Specifies the authority part of the URL for Zotero API requests. Defaults to `api.zotero.org`.

Development server configuration
--------------

Running `npm start` checks for the following environment variables:

**TRANSLATE_URL**
Where to proxy translation requests, defaults to http://localhost:1969. By default ZoteroBib will send translation requests to `window.location.origin` and dev server should be configured to proxy these requests to a translation server.

**PORT**
On which port should the dev server listen, defaults to 8001.

**NO_HYDRATE**
When accessing a remote bibliography, ZoteroBib can hydrate from pre-rendered HTML to avoid a spinner while loading. For development purposes, a hard-coded bibliography is stored in `hydrate.hbs` and is used to serve any request that includes a remote bibliography ID. To disable this behavior, set `NO_HYDRATE` to `1`, which will serve `index.hbs` instead, meaning the bibliography is always rendered client-side with a spinner.
