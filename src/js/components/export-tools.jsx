'use strict';

const React = require('react');
const PropTypes = require('prop-types');
const { saveAs } = require('file-saver');

const ClipboardButton = require('react-clipboard.js').default;
const exportFormats = require('../constants/export-formats');
const { withRouter } = require('react-router-dom');
const Dropdown = require('@trendmicro/react-dropdown').default;
const { DropdownToggle, DropdownMenu, MenuItem } = require('@trendmicro/react-dropdown');

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

	renderMenuOption(format) {
		return (
			<MenuItem key={ format }>
				{
					exportFormats[format].isCopyable ?
					<ClipboardButton
						component="span"
						option-text={ this.handleGetText.bind(this, format) }
						onSuccess={ this.handleClipoardSuccess.bind(this, format) }
					>
						{ exportFormats[format].label }
					</ClipboardButton> :
					<span onClick={ this.handleDownloadFile.bind(this, format) }>
						{ exportFormats[format].label }
					</span>
				}
			</MenuItem>
		);
	}

	render() {
		return (
			<div className="export-tools">
				<div className="btn-group">
					<ClipboardButton
						className="btn btn-secondary btn-xl copy-to-clipboard"
						data-text={exportFormats['text'].label}
						option-text={ this.handleGetText.bind(this, 'text') }
						onSuccess={ this.handleClipoardSuccess.bind(this, 'text') }
					>
						<span>
							{ this.state.clipboardConfirmations['text'] ? 'Copied!' : exportFormats['text'].label }
						</span>
					</ClipboardButton>
					<Dropdown className="dropdown">
						<DropdownToggle className="btn btn-secondary btn-xl dropdown-toggle">
						</DropdownToggle>
						<DropdownMenu>
							{ ['html', 'rtf', 'ris'].map(this.renderMenuOption.bind(this)) }
						</DropdownMenu>
					</Dropdown>
				</div>
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
