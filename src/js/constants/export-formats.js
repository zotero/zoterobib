module.exports = {
	'html': {
		extension: 'html',
		mime: 'text/html',
		label: 'Copy as HTML',
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
		label: 'Download RTF',
		isDownloadable: true,
		isCopyable: false
	}
};
