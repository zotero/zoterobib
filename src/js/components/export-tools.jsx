'use strict';

const React = require('react');
const PropTypes = require('prop-types');
const { saveAs } = require('file-saver');
const cx = require('classnames');

const ClipboardButton = require('react-clipboard.js').default;
const exportFormats = require('../constants/export-formats');
const { withRouter } = require('react-router-dom');
const Dropdown = require('reactstrap/lib/Dropdown').default;
const DropdownToggle = require('reactstrap/lib/DropdownToggle').default;
const DropdownMenu = require('reactstrap/lib/DropdownMenu').default;
const DropdownItem = require('reactstrap/lib/DropdownItem').default;
const formatsInDropdown = ['html', 'rtf', 'ris'];

class ExportDialog extends React.Component {
	state = {
		isDropdownOpen: false,
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

	handleToggleDropdown(ev) {
		const isFromDropdown = ev.target && ev.target.closest('.clipboard-button');
		const isCopied = formatsInDropdown.some(
			format => this.state.clipboardConfirmations[format]
		);
		if(this.state.isDropdownOpen && isFromDropdown && isCopied) {
			this.dropdownTimer = setTimeout(() => {
				this.setState({ 'isDropdownOpen': false });
			}, 1000);
			return false;
		}
		clearTimeout(this.dropdownTimer);
		this.setState({ isDropdownOpen: !this.state.isDropdownOpen });
	}

	renderMenuOption(format) {
		const isCopied = this.state.clipboardConfirmations[format];
		return (
			<DropdownItem key={ format } className="btn">
				{
					exportFormats[format].isCopyable ?
					<ClipboardButton
						className="btn clipboard-button"
						component="div"
						option-text={ this.handleGetText.bind(this, format) }
						onSuccess={ this.handleClipoardSuccess.bind(this, format) }
					>
						<div className={ cx('inline-feedback', { 'active': isCopied }) }>
							<span className="default-text" aria-hidden={ !isCopied }>{ exportFormats['text'].label }</span>
							<span className="shorter feedback" aria-hidden={ isCopied }>Copied!</span>
						</div>
					</ClipboardButton> :
					<span onClick={ this.handleDownloadFile.bind(this, format) }>
						{ exportFormats[format].label }
					</span>
				}
			</DropdownItem>
		);
	}

	render() {
		const isCopied = this.state.clipboardConfirmations['text'];
		return (
			<div className="export-tools">
				<Dropdown
					isOpen={ this.state.isDropdownOpen }
					toggle={ this.handleToggleDropdown.bind(this) }
					className="btn-group"
				>
					<ClipboardButton
						className={ cx('btn btn-secondary btn-xl copy-to-clipboard', { 'feedback': isCopied}) }
						data-text={exportFormats['text'].label}
						option-text={ this.handleGetText.bind(this, 'text') }
						onSuccess={ this.handleClipoardSuccess.bind(this, 'text') }
					>
						<div className={ cx('inline-feedback', { 'active': isCopied }) }>
							<span className="default-text" aria-hidden={ !isCopied }>{ exportFormats['text'].label }</span>
							<span className="shorter feedback" aria-hidden={ isCopied }>Copied!</span>
						</div>
					</ClipboardButton>
					<DropdownToggle className="btn btn-secondary btn-xl dropdown-toggle">
						<span className="dropdown-caret" />
					</DropdownToggle>
					<DropdownMenu className="dropdown-menu">
						{ formatsInDropdown.map(this.renderMenuOption.bind(this)) }
					</DropdownMenu>
				</Dropdown>
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
