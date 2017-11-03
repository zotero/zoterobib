'use strict';

const React = require('react');
const PropTypes = require('prop-types');
const { saveAs } = require('file-saver');
const cx = require('classnames');
const ClipboardButton = require('react-clipboard.js');
const Button = require('zotero-web-library/lib/component/ui/button');
const exportFormats = require('../constants/export-formats');
const { withRouter } = require('react-router-dom');

class ExportDialog extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			permalink: null,
			isGettingPermalink: false,
			clipboardConfirmations: {}
		};
	}

	componentWillReceiveProps(props) {
		// reset status on navigation
		if(this.props.match.params.active != props.match.params.active) {
			this.setState({
				permalink: null,
				isGettingPermalink: false,
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
		}, () => {
			setTimeout(() => {
				this.setState({
					clipboardConfirmations: {
						...this.state.clipboardConfirmations,
						[format]: false
					}
				}, () => {
					if(format !== 'permalink') {
						this.props.onExported();
					}
				});
			}, 500);
		});
	}

	handleDownloadFile(format) {
		const file = this.props.getExportData(format, true);
		saveAs(file);
		this.props.onExported();
	}

	handleGetPermalink() {
		this.setState({ 
			isGettingPermalink: true
		}, async () => {
			const key = await this.props.onSave();
			this.setState({
				permalink: `${window.location.origin}/id/${key}/`,
				isGettingPermalink: false
			});
		});
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
				<div className="hidden-sm-up">
					{
						this.state.permalink ? (
							<div className="permalink-dialog">
								<ClipboardButton
									className="btn"
									data-clipboard-text={ this.state.permalink }
									onSuccess={ this.handleClipoardSuccess.bind(this, 'permalink') }
								>
									{ this.state.clipboardConfirmations['permalink'] ? 'Copied!' : 'Copy' }
								</ClipboardButton>
							</div>
						) : (
							<Button onClick={ this.handleGetPermalink.bind(this) }>
								{
									this.state.isGettingPermalink ? 'Please wait...' : 'Get Permalink'
								}
							</Button>
						)
					}
				</div>
			</div>
		);
	}

	static defaultProps = {
		onExported: () => {}
	}
	
	static propTypes = {
		className: PropTypes.string,
		getExportData: PropTypes.func.isRequired,
		match: PropTypes.object,
		onExported: PropTypes.func,
		onSave: PropTypes.func,
	}
}

module.exports = withRouter(ExportDialog);