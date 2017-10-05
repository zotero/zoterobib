const React = require('react');
const { saveAs } = require('file-saver');
const cx = require('classnames');
const ClipboardButton = require('react-clipboard.js');
const Button = require('zotero-web-library/lib/component/ui/button');
const exportFormats = require('../constants/export-formats');
const { withRouter, Link } = require('react-router-dom');

class ExportDialog extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			clipboardConfirmations: {}
		};
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
		}, () => {
			setTimeout(() => {
				this.setState({
					clipboardConfirmations: {
						...this.state.clipboardConfirmations,
						[format]: false
					}
				}, () => {
					this.props.onExported();
				});
			}, 500);
		});
	}

	handleDownloadFile(format) {
		const file = this.props.getExportData(format, true);
		saveAs(file);
		this.props.onExported();
	}

	render() {
		return (
			<div className={ cx('export-dialog', this.props.className ) }>
				{
					Object.keys(exportFormats).map(format => {
						if(exportFormats[format].isCopyable) {
							return (
								<ClipboardButton
									className="btn"
									data-clipboard-text={ this.props.getExportData(format, false) }
									onSuccess={ this.handleClipoardSuccess.bind(this, format) }
									key={ `export-copy-as-${format}` }
								>
									{ this.state.clipboardConfirmations[format] ? 'Copied!' : `Copy as ${exportFormats[format].label}` }
								</ClipboardButton>
							);
						}

						if(exportFormats[format].isDownloadable) {
							return(
								<a 
									onClick={ this.handleDownloadFile.bind(this, format) }
									key={ `export-download-as-${format}` } >
									<Button>
										Download { exportFormats[format].label }
									</Button>
								</a>
							);
						}
					})
				}
			</div>
		);
	}
}

module.exports = withRouter(ExportDialog);