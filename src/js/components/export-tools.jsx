'use strict';

const React = require('react');
const PropTypes = require('prop-types');
const { saveAs } = require('file-saver');

const ClipboardButton = require('react-clipboard.js').default;
const Button = require('zotero-web-library/lib/component/ui/button');
const exportFormats = require('../constants/export-formats');
const { withRouter } = require('react-router-dom');

class ExportDialog extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			clipboardConfirmations: {}
		};
	}

	componentWillReceiveProps(props) {
		// reset status on navigation
		if(this.props.match.params.active != props.match.params.active) {
			this.setState({
				clipboardConfirmations: {}
			});
		}
	}

	handleClipoardSuccess(format) {
		if(this.state.clipboardConfirmations[format]) {
			return;
		}

		this.setState({
			clipboardConfirmations: {
				...this.state.clipboardConfirmations,
				[format]: true
			}
		});

		setTimeout(() => {
			this.setState({
				clipboardConfirmations: {
					...this.state.clipboardConfirmations,
					[format]: false
				}
			}, this.props.onExported);
		}, 1000);
	}

	async handleDownloadFile(format) {
		try {
			const file = await this.props.getFileData(format);
			saveAs(file);
		} finally {
			this.props.onExported();
		}
	}

	handleGetText(format) {
		return this.props.getCopyData(format);
	}

	render() {
		return (
			<div className="export-tools">
				{
					['text', 'html', 'rtf', 'ris'].map(format => {
						if(exportFormats[format].isCopyable) {
							return (
								<ClipboardButton
									className="btn"
									option-text={ this.handleGetText.bind(this, format) }
									onSuccess={ this.handleClipoardSuccess.bind(this, format) }
									key={ `export-copy-as-${format}` }
								>
									{ this.state.clipboardConfirmations[format] ? 'Copied!' : exportFormats[format].label }
								</ClipboardButton>
							);
						}

						if(exportFormats[format].isDownloadable) {
							return(
								<a
									onClick={ this.handleDownloadFile.bind(this, format) }
									key={ `export-download-as-${format}` } >
									<Button>
										{ exportFormats[format].label }
									</Button>
								</a>
							);
						}
					})
				}
			</div>
		);
	}

	static defaultProps = {
		onExported: () => {}
	}

	static propTypes = {
		getCopyData: PropTypes.func.isRequired,
		getFileData: PropTypes.func.isRequired,
		isReadOnly: PropTypes.bool,
		match: PropTypes.object,
		onExported: PropTypes.func,
	}
}

module.exports = withRouter(ExportDialog);
