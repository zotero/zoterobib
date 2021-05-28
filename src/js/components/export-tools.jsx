/* eslint-disable react/no-deprecated */
// @TODO: migrate to getDerivedStateFromProps()
import React from 'react';
import PropTypes from 'prop-types';
import { saveAs } from 'file-saver';
import cx from 'classnames';
import copy from 'copy-to-clipboard';

import exportFormats from '../constants/export-formats';
import { withRouter } from 'react-router-dom';
import { default as Dropdown } from 'reactstrap/lib/Dropdown';
import { default as DropdownToggle } from 'reactstrap/lib/DropdownToggle';
import { default as DropdownMenu } from 'reactstrap/lib/DropdownMenu';
import { default as DropdownItem } from 'reactstrap/lib/DropdownItem';
const formatsInDropdown = ['rtf', 'html', 'ris', 'bibtex', 'zotero'];
import Button from './ui/button';

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
		if (format == 'zotero') {
			this.props.onSaveToZoteroShow();
			return;
		}
		try {
			const file = await this.props.getFileData(format);
			saveAs(file);
		} finally {
			this.props.onExported();
		}
	}

	async handleCopy(format) {
		const text = await this.props.getCopyData(format);
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

	handleCopyToClipboardClick() {
		// explicitely hide the dropdown
		this.setState({ 'isDropdownOpen': false });
		this.handleCopy('plain');
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
					<span className={ cx('inline-feedback', { 'active': isCopied }) }>
						<span className="default-text" aria-hidden={ !isCopied }>{ exportFormats['html'].label }</span>
						<span className="shorter feedback" aria-hidden={ isCopied }>Copied!</span>
					</span>
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
		const isCopied = this.state.clipboardConfirmations['plain'];
		return (
			<div className="export-tools">
				<Dropdown
					isOpen={ this.state.isDropdownOpen }
					toggle={ this.handleToggleDropdown.bind(this) }
					className={ cx('btn-group', { 'success': isCopied}) }
				>
					<Button
						disabled={ this.props.bibliography.items.length === 0 }
						className='btn btn-secondary btn-xl copy-to-clipboard'
						onClick={ this.handleCopyToClipboardClick.bind(this) }
					>
						<span className={ cx('inline-feedback', { 'active': isCopied }) }>
							<span className="default-text" aria-hidden={ !isCopied }>{ exportFormats['plain'].label }</span>
							<span className="shorter feedback" aria-hidden={ isCopied }>Copied!</span>
						</span>
					</Button>
					<DropdownToggle
						disabled={ this.props.bibliography.items.length === 0 }
						className="btn btn-secondary btn-xl dropdown-toggle"
						>
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
		bibliography: PropTypes.object,
		match: PropTypes.object,
		onExported: PropTypes.func,
		onSaveToZoteroShow: PropTypes.func.isRequired,
	}
}

export default withRouter(ExportDialog);
