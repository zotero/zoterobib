import cx from 'classnames';
import PropTypes from 'prop-types';
import { Fragment, useCallback, useRef, useState, memo } from 'react';
import { useIntl, FormattedMessage } from 'react-intl';
import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownToggle, Icon } from 'web-common/components';
import { isTriggerEvent, pick } from 'web-common/utils';
import { useFocusManager } from 'web-common/hooks';

import { useDnd } from '../hooks';

const BIB_ITEM = 'BIB_ITEM';

const BibliographyItem = memo(props => {
	const { allowReorder, copySingleState, isDropdownOpen, formattedItem, isFirst, isLast,
		isNoteStyle, isNumericStyle, onCopyCitationDialogOpen, onCopySingle, onDeleteCitation,
		onDelayedCloseDropdown, onEditCitationClick, onReorderCitations, onSelectCitation, onToggleDropdown,
		rawItem
	} = props;
	const listItemRef = useRef(null);
	const containerRef = useRef(null);
	const { focusNext, focusPrev, receiveBlur, receiveFocus } = useFocusManager(
		listItemRef, { targetTabIndex: -3, isFocusable: true, isCarousel: false }
	);
	const intl = useIntl();
	const isCopied = copySingleState.copied && copySingleState.citationKey === rawItem.key;

	const onComplete = useCallback((targetNode, above, current) => {
		const targetKey = targetNode.closest('[data-key]').dataset.key;

		onReorderCitations(current.key, targetKey, above);
	}, [onReorderCitations]);

	const handleMoveTop = useCallback(ev => {
		ev.stopPropagation();
		const srcNode = ev.currentTarget.closest('[data-key]');
		const topNode = srcNode.parentNode.querySelector('[data-key]:first-child');
		onReorderCitations(srcNode.dataset.key, topNode.dataset.key, true);
	}, [onReorderCitations]);

	const handleMoveUp = useCallback(ev => {
		ev.stopPropagation();
		const srcNode = ev.currentTarget.closest('[data-key]');
		const prevNode = srcNode.previousElementSibling;
		onReorderCitations(srcNode.dataset.key, prevNode.dataset.key, true);
	}, [onReorderCitations]);

	const handleMovedown = useCallback(ev => {
		ev.stopPropagation();
		const srcNode = ev.currentTarget.closest('[data-key]');
		const nextNode = srcNode.nextElementSibling;
		onReorderCitations(srcNode.dataset.key, nextNode.dataset.key, false);
	}, [onReorderCitations]);

	const handleCopySingleClick = useCallback(ev => {
		listItemRef.current?.focus();
		ev.stopPropagation();
		ev.preventDefault();
		onDelayedCloseDropdown();
		onCopySingle(ev.currentTarget.closest('[data-key]')?.dataset.key);
	}, [onCopySingle, onDelayedCloseDropdown])

	const handleCopyCitationClick = useCallback(ev => {
		ev.currentTarget.closest('[data-key]')?.focus();
		onCopyCitationDialogOpen(ev);
	}, [onCopyCitationDialogOpen]);

	const handleEditCitationClick = useCallback(ev => {
		ev.currentTarget.closest('[data-key]')?.focus();
		onEditCitationClick(ev);
	}, [onEditCitationClick]);

	const handleDeleteCitationClick = useCallback(ev => {
		const bibItemEl = ev.currentTarget.closest('[data-key]');
		const otherBibItemEl = bibItemEl.previousElementSibling || bibItemEl.nextElementSibling;
		onDeleteCitation(ev);
		if(otherBibItemEl) {
			otherBibItemEl.focus();
		}
	}, [onDeleteCitation]);

	const handleKeyDown = useCallback(ev => {
		if(isTriggerEvent(ev)) {
			onSelectCitation(ev);
		} else if(ev.key === 'ArrowRight') {
			focusNext(ev, { useCurrentTarget: false });
			ev.stopPropagation();
		} else if(ev.key === 'ArrowLeft') {
			focusPrev(ev, { useCurrentTarget: false });
			ev.stopPropagation();
		}
	}, [focusNext, focusPrev, onSelectCitation]);

	const getData = useCallback(
		ev => ({ key: ev.currentTarget.closest('[data-key]').dataset.key }), []
	);

	const { onDrag, onHover, onDrop } = useDnd({
		type: BIB_ITEM,
		data: getData,
		ref: containerRef,
		ghostContainerSelector: '.zotero-bib-container',
		midpointOffset: 12,
		onComplete,
	});

	const copyText = isNoteStyle ?
		intl.formatMessage({ id: 'zbib.citation.copyNote', defaultMessage: 'Copy Note' }) :
		intl.formatMessage({ id: 'zbib.citation.copyCitation', defaultMessage: 'Copy Citation' });

	return (
        <li
			aria-label="Citation"
			key={rawItem.key}
			data-dnd-candidate
			data-key={rawItem.key}
			className="citation-container"
			onClick={onSelectCitation}
			tabIndex={-2}
			onKeyDown={handleKeyDown}
			onMouseOver={onHover}
			onMouseOut={onHover}
			onMouseMove={onHover}
			onMouseUp={onDrop}
			ref={listItemRef}
			onFocus={receiveFocus}
			onBlur={receiveBlur}
		>
			<div className="citation" ref={containerRef}>
				{allowReorder && (
					<div className="drag-handle" onMouseDown={onDrag} onTouchStart={onDrag}>
						<Icon type="24/grip" role="presentation" width="24" height="24" />
					</div>
				)}
				<div
					data-container-key={rawItem.key}
					className="csl-entry-container"
					dangerouslySetInnerHTML={{ __html: formattedItem }}
				/>
				{!isNumericStyle && (
					<Fragment>
					<Button
						icon
						title={copyText}
						className={cx('d-xs-none d-md-block btn-outline-secondary btn-copy')}
						onClick={handleCopyCitationClick}
						tabIndex={ -3 }
					>
						<Icon type={'16/quote'} role="presentation" width="16" height="16" />
					</Button>
					<Button
						icon
						title={intl.formatMessage({ id: 'zbib.citation.copyBibliographyEntry', defaultMessage: 'Copy Bibliography Entry' })}
						disabled={copySingleState.citationKey === rawItem.key}
						className={cx('d-xs-none d-md-block btn-outline-secondary btn-copy',
							{ 'success': isCopied }
						)}
						onClick={handleCopySingleClick}
						tabIndex={-3}
					>
							<Icon type={isCopied ? '16/tick' : '16/copy'} role="presentation" width="16" height="16" />
					</Button>
					</Fragment>
				)}
				<Dropdown
					isOpen={isDropdownOpen}
					onToggle={onToggleDropdown}
					className="citation-options-menu"
				>
					<DropdownToggle
						color={null}
						className="btn-icon dropdown-toggle"
						title="Options"
						tabIndex={-3}
					>
						<Icon type={'28/dots'} role="presentation" width="28" height="28" />
					</DropdownToggle>
					<DropdownMenu aria-label="Options" right>
						{!isNumericStyle && (
							<Fragment>
							<DropdownItem
								onClick={handleCopyCitationClick}
								className="btn d-xs-block d-md-none"
							>
								{copyText}
							</DropdownItem>
							<DropdownItem
								onClick={handleCopySingleClick}
								className={cx('btn clipboard-trigger d-xs-block d-md-none', { success: isCopied })}
							>
								<span className={cx('inline-feedback', { 'active': isCopied })}>
									<span className="default-text" aria-hidden={isCopied}>
										<FormattedMessage id="zbib.citation.copyBibliographyEntry" defaultMessage="Copy Bibliography Entry" />
									</span>
									<span className="shorter feedback" aria-hidden={!isCopied}>
										<FormattedMessage id="zbib.export.copiedFeedback" defaultMessage="Copied!" />
									</span>
								</span>
							</DropdownItem>
							</Fragment>
						)}
						<DropdownItem
							onClick={handleEditCitationClick}
							className="btn"
						>
							<FormattedMessage id="zbib.general.edit" defaultMessage="Edit" />
						</DropdownItem>
						<DropdownItem
							onClick={handleDeleteCitationClick}
							className="btn"
						>
							<FormattedMessage id="zbib.general.delete" defaultMessage="Delete" />
						</DropdownItem>
						{allowReorder && (
							<Fragment>
								<DropdownItem divider />
								{!isFirst && (
									<DropdownItem onClick={handleMoveTop} className="btn">
										<FormattedMessage id="zbib.citation.moveToTop" defaultMessage="Move to Top" />
									</DropdownItem>)}
								{!isFirst && (
									<DropdownItem onClick={handleMoveUp} className="btn">
										<FormattedMessage id="zbib.citation.moveUp" defaultMessage="Move Up" />
									</DropdownItem>)}
								{!isLast && (
									<DropdownItem onClick={handleMovedown} className="btn">
										<FormattedMessage id="zbib.citation.moveDown" defaultMessage="Move Down" />
									</DropdownItem>)}
							</Fragment>
						)}
					</DropdownMenu>
				</Dropdown>
				<Button
					icon
					title={ intl.formatMessage({ id: 'zbib.citation.deleteEntry', defaultMessage: 'Delete Entry' }) }
					className="btn-outline-secondary btn-remove"
					onClick={onDeleteCitation}
					tabIndex={-3}
				>
					<Icon type={'16/remove-sm'} role="presentation" width="16" height="16" />
				</Button>
				<script type="application/vnd.zotero.data+json">
					{JSON.stringify(rawItem)}
				</script>
			</div>
		</li>
    );
});

BibliographyItem.displayName = 'BibliographyItem';

BibliographyItem.propTypes = {
	isDropdownOpen: PropTypes.bool,
	onDelayedCloseDropdown: PropTypes.func,
	allowReorder: PropTypes.bool,
	copySingleState: PropTypes.object,
	dropdownsOpen: PropTypes.array,
	formattedItem: PropTypes.string,
	isFirst: PropTypes.bool,
	isLast: PropTypes.bool,
	isNoteStyle: PropTypes.bool,
	isNumericStyle: PropTypes.bool,
	onCopyCitationDialogOpen: PropTypes.func,
	onCopySingle: PropTypes.func,
	onDeleteCitation: PropTypes.func,
	onEditCitationClick: PropTypes.func,
	onReorderCitations: PropTypes.func,
	onSelectCitation: PropTypes.func,
	onToggleDropdown: PropTypes.func,
	rawItem: PropTypes.object,
}

const Bibliography = props => {
	const dropdownTimer = useRef(null);
	const [dropdownOpen, setDropdownOpen] = useState(null);
	const listRef = useRef(null);
	const { focusNext, focusPrev, receiveBlur, receiveFocus } = useFocusManager(listRef);

	const {
		bibliography, bibliographyRendered, bibliographyRenderedNodes,
		isReadOnly, isSortedStyle, onCitationCopyDialogOpen, onDeleteEntry,
		onEditorOpen, styleHasBibliography,
	} = props;

	const handleSelectCitation = useCallback((ev) => {
		const itemId = ev.currentTarget.closest('[data-key]').dataset.key;
		const selection = window.getSelection();

		// ignore keydown events on buttons
		if (ev.type === 'keydown' && ev.currentTarget !== ev.target) {
			return;
		}

		// ignore click event fired when selecting text
		if (ev.type === 'click' && selection.toString().length) {
			try {
				if (ev.target.closest('.citation') === selection.anchorNode.parentNode.closest('.citation')) {
					return;
				}
			} catch (_) {
				// selection.anchorNode.parentNode might fail in which case we open the editor
			}
		}
		if (!isReadOnly && itemId && isTriggerEvent(ev)) {
			onEditorOpen(itemId);
		}
	}, [isReadOnly, onEditorOpen]);

	const handleEditCitationClick = useCallback((ev) => {
		ev.stopPropagation();
		ev.preventDefault();
		setDropdownOpen(null);
		const itemId = ev.currentTarget.closest('[data-key]').dataset.key;
		onEditorOpen(itemId);
	}, [onEditorOpen]);

	const handleDeleteCitation = useCallback(ev => {
		ev.stopPropagation();
		onDeleteEntry(ev.currentTarget.closest('[data-key]').dataset.key);
	}, [onDeleteEntry]);


	const handleToggleDropdown = useCallback(ev => {
		ev.stopPropagation();
		clearTimeout(dropdownTimer.current);
		const itemId = ev.currentTarget?.closest?.('[data-key]')?.dataset.key;

		if(!itemId) {
			setDropdownOpen(null);
			return;
		}

		const isDropdownOpen = dropdownOpen ===  itemId;
		setDropdownOpen(isDropdownOpen ? null : itemId);
	}, [dropdownOpen]);

	const handleDelayedCloseDropdown = useCallback(() => {
		clearTimeout(dropdownTimer.current);
		dropdownTimer.current = setTimeout(() => {
			setDropdownOpen(null);
		}, 950);
	}, []);

	const handleCopyCitationDialogOpen = useCallback(ev => {
		ev.stopPropagation();
		onCitationCopyDialogOpen(ev.currentTarget.closest('[data-key]').dataset.key);
	}, [onCitationCopyDialogOpen]);

	const handleListKeyDown = useCallback(ev => {
		if (ev.key === 'ArrowDown') {
			focusNext(ev, { useCurrentTarget: false });
		} else if (ev.key === 'ArrowUp') {
			focusPrev(ev, { useCurrentTarget: false });
		}
	}, [focusNext, focusPrev]);

	if (bibliography.items.length === 0) {
		return null;
	}

	return (
        <Fragment>
			{isReadOnly ? (
				<Fragment>
					<div
						suppressHydrationWarning={true}
						className="bibliography read-only"
						dangerouslySetInnerHTML={{ __html: bibliographyRendered }}
					/>
					{bibliography.items.map(renderedItem => (
						<script
							suppressHydrationWarning={true}
							key={renderedItem.id}
							type="application/vnd.zotero.data+json">
							{JSON.stringify(bibliography.lookup[renderedItem.id])}
						</script>
					))}
				</Fragment>
			) : (
				<ul
					aria-label="Bibliography"
					className="bibliography"
					key="bibliography"
					ref={ listRef }
					onFocus={ receiveFocus }
					onBlur={ receiveBlur }
					onKeyDown={ handleListKeyDown }
					tabIndex={0}
				>
					{bibliography.items.map((renderedItem, index) => (
						<BibliographyItem
							{...pick(props, ['copySingleState', 'isNoteStyle', 'isNumericStyle',
								'onCopySingle', 'onReorderCitations']) }
							isDropdownOpen={ dropdownOpen === renderedItem.id }
							formattedItem={bibliographyRenderedNodes?.[index]?.innerHTML || renderedItem.value}
							key={renderedItem.id}
							onCopyCitationDialogOpen={handleCopyCitationDialogOpen}
							onDeleteCitation={handleDeleteCitation}
							onEditCitationClick={handleEditCitationClick}
							onSelectCitation={handleSelectCitation}
							onToggleDropdown={handleToggleDropdown}
							onDelayedCloseDropdown={ handleDelayedCloseDropdown }
							rawItem={bibliography.lookup[renderedItem.id]}
							allowReorder={(!styleHasBibliography || !isSortedStyle) && bibliography.items.length > 1}
							isFirst={index === 0}
							isLast={index === bibliography.items.length - 1}
						/>
					))}
				</ul>
			)}
		</Fragment>
    );
}

Bibliography.propTypes = {
	bibliography: PropTypes.object,
	bibliographyRendered: PropTypes.string,
	bibliographyRenderedNodes: PropTypes.oneOfType([
		PropTypes.array,
		PropTypes.instanceOf(HTMLCollection)
	]),
	isNoteStyle: PropTypes.bool,
	isNumericStyle: PropTypes.bool,
	isReadOnly: PropTypes.bool,
	isSortedStyle: PropTypes.bool,
	onCitationCopyDialogOpen: PropTypes.func,
	onDeleteEntry: PropTypes.func,
	onEditorOpen: PropTypes.func,
	onReorderCitations: PropTypes.func,
	styleHasBibliography: PropTypes.bool,
}

export default memo(Bibliography);
