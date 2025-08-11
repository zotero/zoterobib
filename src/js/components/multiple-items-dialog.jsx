import { Button, Icon } from 'web-common/components';
import { formatBib, formatFallback } from 'web-common/cite';
import { FormattedMessage, useIntl } from 'react-intl';
import { isTriggerEvent } from 'web-common/utils';
import { memo, useEffect, useMemo, useCallback, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { useFocusManager, usePrevious } from 'web-common/hooks';
import PropTypes from 'prop-types';

import Modal from './modal';

const MultipleLitemsList = forwardRef(({ multipleItems, selectedItems, onItemSelectionChange }, ref) => {
	const listRef = useRef(null);
	const { focusNext, focusPrev, receiveBlur, receiveFocus } = useFocusManager(listRef);

	useImperativeHandle(ref, () => ({
		focus: () => listRef.current?.focus()
	}));

	const bibliographyRendered = useMemo(() => {
		if (!multipleItems) {
			return null;
		}
		const { bibliographyItems, bibliographyMeta, styleHasBibliography } = multipleItems;
		return (styleHasBibliography && bibliographyMeta) ?
			formatBib(bibliographyItems, bibliographyMeta) :
			formatFallback(bibliographyItems)
		}, [multipleItems]
	);

	const bibliographyRenderedNodes = useMemo(() => {
		if (!bibliographyRendered) {
			return [];
		}
		const div = document.createElement('div');
		div.innerHTML = bibliographyRendered;
		div.querySelectorAll('a').forEach(link => {
			link.setAttribute('rel', 'nofollow');
		});
		return div.firstChild.children;
	}, [bibliographyRendered]);

	const handleListKeyDown = useCallback(ev => {
		if (ev.key === 'ArrowDown') {
			focusNext(ev, { useCurrentTarget: false });
		} else if (ev.key === 'ArrowUp') {
			focusPrev(ev, { useCurrentTarget: false });
		}
	}, [focusNext, focusPrev]);

	return (
		<ul
			tabIndex={0}
			ref={listRef}
			onFocus={receiveFocus}
			onBlur={receiveBlur}
			onKeyDown={handleListKeyDown}
			aria-label="Results"
			className="results"
		>
			{
				(multipleItems?.bibliographyItems ?? []).map((item, index) => (
					<li
						aria-labelledby={`citation-${item.id}`}
						key={item.id}
						data-key={item.id}
						className="result"
						onClick={onItemSelectionChange}
					>
						<div
							id={`citation-${item.id}`}
							className="csl-entry-container"
							dangerouslySetInnerHTML={
								{ __html: bibliographyRenderedNodes[index]?.innerHTML || item.value }
							} />
						<div className="checkbox-container">
							<input
								aria-labelledby={`citation-${item.id}`}
								checked={selectedItems.includes(item.id)}
								className="checkbox"
								onChange={onItemSelectionChange}
								tabIndex={-2}
								type="checkbox"
							/>
						</div>
					</li>
				))
			}
		</ul>
	)
});

MultipleLitemsList.displayName = 'MultipleLitemsList';

MultipleLitemsList.propTypes = {
	multipleItems: PropTypes.shape({
		bibliographyItems: PropTypes.arrayOf(PropTypes.shape({
			id: PropTypes.string.isRequired,
			value: PropTypes.string.isRequired,
		})).isRequired,
		bibliographyMeta: PropTypes.object,
		styleHasBibliography: PropTypes.bool,
	}),
	selectedItems: PropTypes.arrayOf(PropTypes.string).isRequired,
	onItemSelectionChange: PropTypes.func.isRequired,
}

const MultipleItemsDialog = props => {
	const { activeDialog, multipleItems, onMultipleItemsSelect, onMultipleItemsCancel,  } = props;
	const listRef = useRef(null);
	const footerRef = useRef(null);
	const skipNextFocusRef = useRef(false); // required for modal's scopedTab (focus trap) to work correctly
	const { focusNext, focusPrev, receiveBlur, receiveFocus, resetLastFocused } = useFocusManager(footerRef, { initialQuerySelector: '.btn-outline-secondary:not(:disabled)' });
	const [selectedItems, setSelectedItems] = useState([]);
	const prevActiveDialog = usePrevious(activeDialog);
	const intl = useIntl();
	const isOpen = multipleItems && activeDialog === 'MULTIPLE_ITEMS_DIALOG';

	const handleItemSelectionChange = useCallback(ev => {
		const itemKey = ev.target.closest('[data-key]').dataset.key;

		if(!isTriggerEvent(ev)) {
			return;
		}

		ev.stopPropagation();

		setSelectedItems(selectedItems.includes(itemKey) ?
			selectedItems.filter(i => i != itemKey) :
			[...selectedItems, itemKey]
		);
	}, [selectedItems]);

	const handleAddSelected = useCallback(() => {
		onMultipleItemsSelect(selectedItems);
	}, [selectedItems, onMultipleItemsSelect]);

	const handleCancel = useCallback(() => {
		onMultipleItemsCancel();
	}, [onMultipleItemsCancel])

	const handleSelectAll = useCallback(() => {
		setSelectedItems(multipleItems.bibliographyItems.map(item => item.id));
	}, [multipleItems]);

	const handleClearSelection = useCallback(() => {
		setSelectedItems([]);
	}, []);

	const handleFocus = useCallback((ev) => {
		if (skipNextFocusRef.current) {
			skipNextFocusRef.current = false;
		} else {
			receiveFocus(ev);
		}
	}, [receiveFocus]);

	const handleBlur = useCallback((ev) => {
		// Forget the last focused element every time the footer loses focus
		// This means that, once at least one item is selected, after tabbing to the footer focus goes to the "Add Selected" button
		receiveBlur(ev);
		resetLastFocused();
	}, [receiveBlur, resetLastFocused])

	const handleFooterKeyDown = useCallback((ev) => {
		if (ev.key === 'ArrowRight') {
			focusNext(ev, { useCurrentTarget: false });
		} else if (ev.key === 'ArrowLeft') {
			focusPrev(ev, { useCurrentTarget: false });
		} else if (ev.key === 'Tab' && !ev.shiftKey) {
			// for the modal's focus trap to work correctly, we need to make sure the focus is moved to the footerRef
			// (scopedTab in react-modal needs focus to be on the last "tabbable" so that it can trap the focus)
			skipNextFocusRef.current = true;
			footerRef.current.focus();
			footerRef.current.tabIndex = 0;
			footerRef.current.dataset.focusRoot = '';
		}
	}, [focusNext, focusPrev]);

	const handleModalAfterOpen = useCallback(() => {
		listRef.current.focus();
	}, []);

	useEffect(() => {
		if(prevActiveDialog !== activeDialog && activeDialog === 'MULTIPLE_ITEMS_DIALOG') {
			setSelectedItems([]);
		}
	}, [activeDialog, prevActiveDialog]);

	const title = intl.formatMessage({ id: 'zbib.multipleItems.prompt', defaultMessage: 'Please select citations from the list' });

	return (
		<Modal
			isOpen={ !!isOpen }
			contentLabel={ title }
			className="multiple-items-dialog modal modal-lg modal-with-footer"
			onAfterOpen={ handleModalAfterOpen }
			onRequestClose={ handleCancel }
		>
			<div className="modal-content" tabIndex={ -1 }>
				<div className="modal-header">
					<h4 className="modal-title text-truncate">
						{ title }
					</h4>
					<Button
						title={ intl.formatMessage({ id: 'zbib.modal.closeDialog', defaultMessage: 'Close Dialog' }) }
						icon
						className="close"
						onClick={ handleCancel }
					>
						<Icon type={ '24/remove' } role="presentation" width="24" height="24" />
					</Button>
				</div>
				<div className="modal-body" tabIndex={ -1 }>
					<MultipleLitemsList
						ref={listRef}
						multipleItems={ multipleItems }
						selectedItems={ selectedItems }
						onItemSelectionChange={ handleItemSelectionChange }
					/>
				</div>
				<div
					className="modal-footer"
					ref={footerRef}
					onFocus={handleFocus}
					onBlur={handleBlur}
					onKeyDown={handleFooterKeyDown}
					tabIndex={0}
				>
					<div className="selection-count">
						<Button className="btn btn-link" onClick={ handleSelectAll } tabIndex={-2}>
							<FormattedMessage id="zbib.multipleItems.selectAll" defaultMessage="Select All" />
						</Button>
						<Button className="btn btn-link" onClick={ handleClearSelection } tabIndex={-2}>
							<FormattedMessage id="zbib.multipleItems.clearSelection" defaultMessage="Clear Selection" />
						</Button>
					</div>
					<Button
						disabled={selectedItems.length === 0}
						className="btn-outline-secondary btn-min-width"
						onClick={handleAddSelected}
						tabIndex={-2}
					>
						{ selectedItems.length > 0 ? (
							<FormattedMessage
								id="zbib.multipleItems.confirmWithCount"
								defaultMessage="Add {count, plural, one {# Item} other {# Items}}"
								values={{ count: selectedItems.length }}
							/>
						) : (
							<FormattedMessage id="zbib.multipleItems.confirm" defaultMessage="Add Selected" />
						) }
					</Button>
				</div>
			</div>
		</Modal>
	)
}

MultipleItemsDialog.propTypes = {
	activeDialog: PropTypes.string,
	multipleChoiceItems: PropTypes.array,
	multipleItems: PropTypes.object,
	onMultipleItemsCancel: PropTypes.func.isRequired,
	onMultipleItemsSelect: PropTypes.func.isRequired,
}

export default memo(MultipleItemsDialog);
