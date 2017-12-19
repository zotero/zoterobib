'use strict';

const React = require('react');
const PropTypes = require('prop-types');
const { saveAs } = require('file-saver');
const cx = require('classnames');
const ClipboardButton = require('react-clipboard.js').default;
const Button = require('zotero-web-library/lib/component/ui/button');
const exportFormats = require('../constants/export-formats');
const { withRouter } = require('react-router-dom');

class ExportDialog extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			isGettingPermalink: false,
			clipboardConfirmations: {}
		};
	}

	componentDidUpdate(props) {
		if(this.props.permalink != props.permalink) {
			this.setState({
				isGettingPermalink: false
			});
		}
	}

	componentWillReceiveProps(props) {
		// reset status on navigation
		if(this.props.match.params.active != props.match.params.active) {
			this.setState({
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

	async handleDownloadFile(format) {
		try {
			const file = await this.props.getFileData(format);
			saveAs(file);
		} finally {
			this.props.onExported();
		}
	}

	async handleGetPermalink() {
		this.setState({ 
			isGettingPermalink: true
		});
		await this.props.onSave();
	}

	handleGetText(format) {
		return this.props.getCopyData(format);
	}

	render() {
		return (
			<div className={ cx('export-dialog', this.props.className ) }>
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
				{
					!this.props.isReadOnly && (
						<div className="hidden-sm-up">
							{
								this.props.permalink ? (
									<div className="permalink-dialog">
										<ClipboardButton
											className="btn"
											data-clipboard-text={ this.props.permalink }
											onSuccess={ this.handleClipoardSuccess.bind(this, 'permalink') }
										>
											{ this.state.clipboardConfirmations['permalink'] ? 'Copied!' : 'Copy Link to This Version' }
										</ClipboardButton>
									</div>
								) : (
									<Button onClick={ this.handleGetPermalink.bind(this) }>
										{
											this.state.isGettingPermalink ? 'Please wait…' : 'Copy Link to This Version'
										}
									</Button>
								)
							}
						</div>
					)
				}
			</div>
		);
	}

	static defaultProps = {
		onExported: () => {}
	}
	
	static propTypes = {
		className: PropTypes.string,
		getCopyData: PropTypes.func.isRequired,
		getFileData: PropTypes.func.isRequired,
		isReadOnly: PropTypes.bool,
		match: PropTypes.object,
		onExported: PropTypes.func,
		onSave: PropTypes.func,
		permalink: PropTypes.string
	}
}

module.exports = withRouter(ExportDialog);