'use strict';

const React = require('react');
const PropTypes = require('prop-types');
const { saveAs } = require('file-saver');
const cx = require('classnames');
const copy = require('copy-to-clipboard');

const exportFormats = require('../constants/export-formats');
const { withRouter } = require('react-router-dom');
const Dropdown = require('reactstrap/lib/Dropdown').default;
const DropdownToggle = require('reactstrap/lib/DropdownToggle').default;
const DropdownMenu = require('reactstrap/lib/DropdownMenu').default;
const DropdownItem = require('reactstrap/lib/DropdownItem').default;
const formatsInDropdown = ['html', 'rtf', 'ris'];
const Button = require('zotero-web-library/lib/component/ui/button');

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

	handleCopy(format) {
		const text = this.props.getCopyData(format);
		const result = copy(text);
		if(result) {
			this.handleClipoardSuccess(format);
		}
	}

	handleToggleDropdown(ev) {
		const isFromCopyTrigger = ev.target && ev.target.closest('.clipboard-trigger');
		if(this.state.isDropdownOpen && isFromCopyTrigger) {
			this.dropdownTimer = setTimeout(() => {
				this.setState({ 'isDropdownOpen': false });
			}, 950);
			return false;
		}
		clearTimeout(this.dropdownTimer);
		this.setState({ isDropdownOpen: !this.state.isDropdownOpen });
	}

	renderMenuOption(format) {
		const isCopied = this.state.clipboardConfirmations[format];
		if(exportFormats[format].isCopyable) {
			return (
				<DropdownItem
					key={ format }
					onClick={ this.handleCopy.bind(this, format) }
					className="btn clipboard-trigger"
				>
					<div className={ cx('inline-feedback', { 'active': isCopied }) }>
						<span className="default-text" aria-hidden={ !isCopied }>{ exportFormats['html'].label }</span>
						<span className="shorter feedback" aria-hidden={ isCopied }>Copied!</span>
					</div>
				</DropdownItem>
			);
		} else {
			return(
				<DropdownItem
					key={ format }
					onClick={ this.handleDownloadFile.bind(this, format) }
					className="btn"
				>
					<span>{ exportFormats[format].label }</span>
				</DropdownItem>
			);
		}
	}

	render() {
		const isCopied = this.state.clipboardConfirmations['text'];
		return (
			<div className="export-tools">
				<Dropdown
					isOpen={ this.state.isDropdownOpen }
					toggle={ this.handleToggleDropdown.bind(this) }
					className={ cx('btn-group', { 'success': isCopied}) }
				>
					<Button
						className='btn btn-secondary btn-xl copy-to-clipboard'
						onClick={ this.handleCopy.bind(this, 'text') }
					>
						<div className={ cx('inline-feedback', { 'active': isCopied }) }>
							<span className="default-text" aria-hidden={ !isCopied }>{ exportFormats['text'].label }</span>
							<span className="shorter feedback" aria-hidden={ isCopied }>Copied!</span>
						</div>
					</Button>
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
