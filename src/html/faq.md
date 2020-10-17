# Mick Schroeder's Citation Generator 
# Frequently Asked Questions (FAQ)

<nav>
  <ul>
  	<li><a href="#general">General</a></li>
  	<li><a href="#usage">Usage</a></li>
  	<li><a href="#troubleshooting">Troubleshooting</a></li>
  </ul>
</nav>

## General

### What is Mick Schroeder's Citation Generator?

This is a free and open-source service that helps you build a bibliography automatically from any computer or device, without creating an account or installing any software. 

### How much does it cost?

Nothing! Free! Mick Schroeder's Citation Generator is completely free and open-source.

### How is my query processed?

Queries are processed using [Zotero Translators](https://github.com/zotero/translators) maintained by the community.

### What citation styles can I use?

Supports over 9,000 [CSL](http://citationstyles.org/) styles, including popular styles such as AMA, APA, MLA, NLM, Chicago/Turabian and Vancouver.

You can preview all styles avaiable using the [Zotero Style Repository](https://www.zotero.org/styles).

[github.com/citation-style-language/styles](https://github.com/citation-style-language/styles) is the official repository for Citation Style Language (CSL) styles and is maintained by CSL project members.

For more information, check out [CitationStyles.org](http://citationstyles.org/) and the [repository wiki](https://github.com/citation-style-language/styles/wiki).

All styles are released under the [Creative Commons Attribution-ShareAlike 3.0 Unported license](http://creativecommons.org/licenses/by-sa/3.0/).


### Where is my bibliography stored?

Your bibliography is stored in your browser's local storage by default. You can close the page and return to it later, and your bibliography will still be there — no need to worry about saving your data or logging in.

Note that if you're using private/incognito mode in your browser, your bibliography will be deleted as soon as you close the window.

### How long is my bibliography stored?

Bibliographies are stored in your local browser storage until you delete them or clear your browser's cache. If you're using private/incognito mode in your browser, your bibliography will be deleted as soon as you close the window. Note that some system-cleaning tools might clear the browser storage, and some browsers offer to do so as well as part of a refresh process.

<h3 id="privacy">Is my data private?</h3>

This software was created with the philosophy that your research data belongs to you and should be kept secure and private by default.

Your bibliography is stored on your own computer and isn't accessible to others.

When you add items using the search bar, your search is sent to our server for processing. We log your IP address, browser version, and search terms for a short period of time in order to maintain the service and prevent abuse.

## Usage

### How do I add entries to my bibliography?

The easiest way to add an item is by pasting in a URL. Just open a new browser tab, find what you're looking for, and copy the page's URL from your browser's address bar. Automatically extract bibliographic data from newspaper and magazine articles, library catalogs, journal articles, sites like Amazon and Google Books, and much more.

If saving from a URL doesn't work, or you have a book, printout, or PDF that you can't easily find online, you can copy or type in an [ISBN](https://en.wikipedia.org/wiki/International_Standard_Book_Number), [DOI](https://en.wikipedia.org/wiki/Digital_object_identifier), [PubMed ID](https://en.wikipedia.org/wiki/PubMed#PubMed_identifier), or [arXiv ID](https://arxiv.org/help/arxiv_identifier). Nearly all books include an ISBN on the back cover or in the first few pages, and most recent published articles will include a DOI in the online listing and on the first page. Adding by identifier helps ensure that you're adding the correct version, which is particularly helpful for books with multiple editions.

You can also search for books and articles by title (and optionally author, year, and publisher) — just be sure to review the results to make sure you're adding the right version.

If all else fails, you can enter item details by hand by clicking <i>Manual Entry</i>.

### How do I add parenthetical citations or notes to my paper?

As you write, quickly generate parenthetical citations (APA, MLA) or footnotes/endnotes (Chicago, Turabian) for the specific quotes, facts, or ideas you're including into your paper. Just click the copy icon next to an entry in your bibliography, enter the relevant page range or section of the source that you're citing, and click Copy Citation or Copy Note. You can then paste the citation into your paper.

For styles such as APA and MLA, if you incorporate an author's name into a sentence ("As Smith writes…"), you can use the "Omit Author" option to include only a date and/or page number in the parenthetical citation ("(2015, pp. 12–13)").

### How do I add a completed bibliography to my paper?

If you're using a word processor, you can simply click <i>Copy to Clipboard</i> and paste the formatted bibliography into your document.

With certain combinations of citation styles and word processors (e.g., LibreOffice), some of the formatting may become mangled when you export via the clipboard. In those cases, select <i>Download RTF</i> from the Export drop-down to download a formatted document that you can open in your word processor.

If you're adding your bibliography to a webpage, you can use <i>Copy HTML</i> to copy HTML markup that you can embed in the page.

### How can I export my bibliography to a reference manager?

Select <i>Download RIS</i> or <i>Download BibTeX</i> to download a data file that can be imported into any reference manager. If you're using Zotero and the Zotero Connector, just click the <i>Save to Zotero</i> button in your browser's toolbar.

## Troubleshooting

### I'm getting an error trying to add an item. What do I do?

Some sites have restrictions that prevent [Zotero Translator](https://github.com/zotero/translators) from working, or they're designed in such a way that a URL can't be used to retrieve a given page. Try a different site, or paste in an ISBN, DOI, or other identifier instead.

### I added an item but the data is wrong or incomplete. How can I correct it?

While [Zotero Translator](https://github.com/zotero/translators) is able to extract high-quality metadata from a wide variety of sources, you should always check your entries to make sure they're correct. In some cases it may be necessary to manually edit an entry to clean up what's there or add additional fields.

If there's a site that consistently returns incorrect results, refer to the <a href="https://github.com/zotero/translators/">zotero/translators</a> project. See if there is already an issue open or if you have coding skills, try to fix it yourself.

<h3 id="sentence-case">Why are all the proper nouns in my entries in lowercase when I use some styles?</h3>

Some styles, such as APA, require titles to be in sentence case rather than title case. When you use such a style, Mick Schroeder's Citation Generator will convert the titles of entries to sentence case for you, but you'll need to manually edit some entries to capitalize proper nouns:

<p><b>Title case:</b> <i>Circadian Mood Variations in Twitter Content</i></p>
<p><b>Mick Schroeder's Citation Generator conversion:</b> <i>Circadian mood variations in twitter content</i></p>
<p><b>Sentence case:</b> <i>Circadian mood variations in <span style="color: #e52e3d; font-weight: bold;">T</span>witter content</i></p>

(We know this is annoying, but we think it's less annoying than manually lowercasing all the other words in titles. Some other tools simply ignore this requirement and generate incorrect, title-cased bibliographies, but we try our best to generate citations according to the style you’ve chosen.)

### What if I can't find a style that I need?

If you can't find the style you need just by searching, you can browse the [Zotero Styles Page](https://www.zotero.org/styles) or the [CSL visual editor](http://editor.citationstyles.org/searchByExample/) for style previews and then return to Mick Schroeder's Citation Generator to install the style.

If you're still not able to find what you're looking for, you can [request a new style](https://github.com/citation-style-language/styles/wiki/Requesting-Styles).

### What if the bibliography doesn't match the style?

Styles are maintained by the open-source community to stay up to date with style guide recommendations and publisher requirements.

If you still think there's a mistake, you can report it in the [GitHub Repository](https://github.com/citation-style-language/styles) or just make manual changes to the bibliography before you submit it.

<h3 id="help">Something else isn't working. How can I get help?</h3>

Sorry about that! Please submit an issue to the [GitHub Repository] or if you have coding skills, try to fix it yourself.

[Zotero]: https://www.zotero.org
[GitHub Repository]: https://github.com/mick-schroeder/schroeder-cite
