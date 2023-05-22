import copy from 'copy-to-clipboard';
import cx from 'classnames';
import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useRef, useState, memo } from 'react';
import { FormattedMessage } from 'react-intl';

import { Dropdown,  DropdownMenu, DropdownToggle, DropdownItem } from './ui/dropdown';
import exportFormats from '../constants/export-formats';
import Button from './ui/button';
import { isTriggerEvent } from '../common/event';
import { usePrevious } from '../hooks';

const formatsInDropdown = ['rtf', 'html', 'ris', 'bibtex', 'zotero'];

const ExportOption = memo(({ isCopied, format, handleCopyClick, handleDownloadClick }) => {
	if(exportFormats[format].isCopyable) {
		return (
			<DropdownItem
				data-format={ format }
				key={ format }
				onClick={ handleCopyClick }
				className="btn clipboard-trigger"
			>
				<span className={ cx('inline-feedback', { 'active': isCopied }) }>
					<span className="default-text" aria-hidden={ isCopied }>{ exportFormats['html'].label }</span>
					<span className="shorter feedback" aria-hidden={ !isCopied }>
						<FormattedMessage id="zbib.export.copiedFeedback" defaultMessage="Copied!" />
					</span>
				</span>
			</DropdownItem>
		);
	} else {
		return(
			<DropdownItem
				data-format={ format }
				key={ format }
				onClick={ handleDownloadClick }
				className="btn"
			>
				<span>{ exportFormats[format].label }</span>
			</DropdownItem>
		);
	}
});

ExportOption.displayName = 'ExportOption';
ExportOption.propTypes = {
	format: PropTypes.string,
	handleCopyClick: PropTypes.func,
	handleDownloadClick: PropTypes.func,
	isCopied: PropTypes.bool,
};

const ExportTools = props => {
	const { getCopyData, isHydrated, isReady, itemCount, onDownloadFile, onSaveToZoteroShow } = props;
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const [clipboardConfirmations, setClipboardConfirmations] = useState({});
	const dropdownTimer = useRef(null);
	const whenReadyData = useRef(false);
	const wasReady = usePrevious(isReady);

	const handleClipoardSuccess = useCallback(format => {
		if(clipboardConfirmations[format]) {
			return;
		}

		setClipboardConfirmations({ ...clipboardConfirmations, [format]: true });
		setTimeout(() => {
			setClipboardConfirmations({ ...clipboardConfirmations, [format]: false });
		}, 1000);
	}, [clipboardConfirmations]);

	const copyToClipboard = useCallback(async (format, isTopLevelButton) => {
		if(isTopLevelButton) {
			setIsDropdownOpen(false);
		}
		const text = await getCopyData(format);
		const result = copy(text);
		if(result) {
			handleClipoardSuccess(format);
		}
	}, [getCopyData, handleClipoardSuccess])

	const handleDownloadClick = useCallback(async ev => {
		const format = ev.currentTarget.dataset.format;
		if (format == 'zotero') {
			onSaveToZoteroShow();
			return;
		}
		if(isHydrated && !isReady) {
			whenReadyData.current = { shouldDownload: true, format }
			return;
		}

		onDownloadFile(format);
	}, [isHydrated, isReady, onDownloadFile, onSaveToZoteroShow]);

	const handleToggleDropdown = useCallback(ev => {
		const isFromCopyTrigger = ev.target && ev.target.closest('.clipboard-trigger');
		if(isDropdownOpen && isFromCopyTrigger) {
			dropdownTimer.current = setTimeout(() => {
				setIsDropdownOpen(false);
			}, 950);
			return false;
		}
		clearTimeout(dropdownTimer.current);
		setIsDropdownOpen(!isDropdownOpen);
	}, [isDropdownOpen]);

	const handleCopyClick = useCallback(async ev => {
		if(!isTriggerEvent(ev)) {
			return;
		}

		const format = ev.currentTarget.dataset.format;
		const isTopLevelButton = 'main' in ev.currentTarget.dataset;

		if(isHydrated && !isReady) {
			whenReadyData.current = { shouldCopy: true, format, isTopLevelButton }
			return;
		}
		copyToClipboard(format, isTopLevelButton);
	}, [copyToClipboard, isHydrated, isReady]);

	const isCopied = clipboardConfirmations['plain'];

	useEffect(() => {
		if(isReady && !wasReady && whenReadyData.current) {
			if(whenReadyData.current.shouldCopy) {
				const { format, isTopLevelButton } = whenReadyData.current;
				copyToClipboard(format, isTopLevelButton);
			} else if(whenReadyData.current.shouldDownload) {
				const { format } = whenReadyData.current;
				onDownloadFile(format);
			}
			whenReadyData.current = false;
		}
	}, [copyToClipboard, isReady, onDownloadFile, wasReady]);

	return (
		<div className="export-tools">
			<Dropdown
				isOpen={ isDropdownOpen }
				onToggle={ handleToggleDropdown }
				className={ cx('btn-group', { 'success': isCopied }) }
			>
				<Button
					aria-labelledby="export-tools-copy-to-clipboard"
					data-format="plain"
					data-main
					disabled={ itemCount === 0 }
					className='btn btn-secondary btn-xl copy-to-clipboard'
					onClick={ handleCopyClick }
					onKeyDown={ handleCopyClick }
				>
					<span id="export-tools-copy-to-clipboard" className={ cx('inline-feedback', { 'active': isCopied }) }>
						<span className="default-text" aria-hidden={ isCopied }>{ exportFormats['plain'].label }</span>
						<span className="shorter feedback" aria-hidden={ !isCopied }>
							<FormattedMessage id="zbib.export.copiedFeedback" defaultMessage="Copied!" />
						</span>
					</span>
				</Button>
				<DropdownToggle
					aria-label="Export Options"
					disabled={ itemCount === 0 }
					className="btn btn-secondary btn-xl dropdown-toggle"
				>
					<span className="dropdown-caret" />
				</DropdownToggle>
				<DropdownMenu aria-label="Export Options">
					{ formatsInDropdown.map(format => (
						<ExportOption
							format={ format }
							handleCopyClick = { handleCopyClick }
							handleDownloadClick={ handleDownloadClick }
							isCopied = { !!clipboardConfirmations[format] }
							key={ format }
						/>)
					) }
				</DropdownMenu>
			</Dropdown>
		</div>
	)
}

ExportTools.propTypes = {
	getCopyData: PropTypes.func.isRequired,
	isHydrated: PropTypes.bool,
	isReadOnly: PropTypes.bool,
	isReady: PropTypes.bool,
	itemCount: PropTypes.number,
	onDownloadFile: PropTypes.func.isRequired,
	onSaveToZoteroShow: PropTypes.func.isRequired,
}

export default memo(ExportTools);
