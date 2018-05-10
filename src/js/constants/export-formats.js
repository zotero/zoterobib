module.exports = {
	'html': {
		extension: 'html',
		mime: 'text/html',
		label: 'Copy HTML',
		isDownloadable: false,
		isCopyable: true
	},
	'text': {
		extension: 'txt',
		mime: 'text/plain',
		label: 'Copy to Clipboard',
		include: 'html',
		isDownloadable: false,
		isCopyable: true
	},
	'rtf': {
		extension: 'rtf',
		mime: 'text/rtf',
		label: 'Download RTF (all word processors)',
		isDownloadable: true,
		isCopyable: false
	},
	'ris': {
		extension: 'ris',
		mime: 'application/x-research-info-systems',
		label: 'Download RIS',
		isDownloadable: true,
		isCopyable: false
	},
	'bibtex': {
		extension: 'bib',
		mime: 'application/x-bibtex',
		label: 'Download BibTeX',
		isDownloadable: true,
		isCopyable: false
	},
	'zotero': {
		label: 'Save to Zotero',
		isDownloadable: true,
		isCopyable: false
	}
};
