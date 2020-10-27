/* eslint-disable react/no-deprecated */
// @TODO: migrate to getDerivedStateFromProps()
'use strict';

const React = require('react');
const PropTypes = require('prop-types');
const { saveAs } = require('file-saver');
const cx = require('classnames');
const copy = require('copy-to-clipboard');

const { withRouter } = require('react-router-dom');

const Button = require('zotero-web-library/src/js/component/ui/button');

class ExportDialog extends React.Component {
	state = {
		clipboardConfirmations: {}
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

	handleCopy(format) {
		
		var text;
		
		if(format === 'filename'){
			text = this.props.getFilenameCopyData(format);
		}
		else {
			text = this.props.getCitationCopyData(format);
		}

		const result = copy(text, {format: 'text/plain'});

		if(result) {
			this.handleClipoardSuccess(format);
		}
	}

	handleCitationCopyToClipboardClick() {
		this.handleCopy('citation');
	}

	handleFilenameCopyToClipboardClick() {
		this.handleCopy('filename');
	}

	render() {
		const isCitationCopied = this.state.clipboardConfirmations['citation'];
		const isFilenameCopied = this.state.clipboardConfirmations['filename'];

		return (
			<div className="export-tools">
					<Button
						disabled={ this.props.items.length === 0 }
						className='btn btn-secondary copy-to-clipboard'
						onClick={ this.handleFilenameCopyToClipboardClick.bind(this) }
					>
						<span className={ cx('inline-feedback', { 'active': isFilenameCopied }) }>
							<span className="default-text" aria-hidden={ !isFilenameCopied }> Copy Filename</span>
							<span className="shorter feedback" aria-hidden={ isFilenameCopied }>Copied!</span>
						</span>
					</Button>
					<Button
						disabled={ this.props.items.length === 0 }
						className='btn btn-secondary copy-to-clipboard'
						onClick={ this.handleCitationCopyToClipboardClick.bind(this) }
					>
						<span className={ cx('inline-feedback', { 'active': isCitationCopied }) }>
							<span className="default-text" aria-hidden={ !isCitationCopied }> Copy Citation</span>
							<span className="shorter feedback" aria-hidden={ isCitationCopied }>Copied!</span>
						</span>
					</Button>
			</div>
		);
	}

	static defaultProps = {
		onExported: () => {}
	}

	static propTypes = {
		getCitationCopyData: PropTypes.func.isRequired,
		getFilenameCopyData: PropTypes.func.isRequired,
		isReadOnly: PropTypes.bool,
		items: PropTypes.array,
		match: PropTypes.object,
		onExported: PropTypes.func,
	}
}

module.exports = withRouter(ExportDialog);
