import PropTypes from 'prop-types';
import cx from 'classnames';
import { useCallback, useId, memo, useRef } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Button, Icon, Spinner } from 'web-common/components';
import { isTriggerEvent } from 'web-common/utils';
import { useFocusManager } from 'web-common/hooks';

import Modal from './modal';

const ChoiceItem = memo(({ item, onItemSelect }) => {
	const id = useId();
	let badge = null;
	let title = item.value.title || '';

	if(item.source === 'url') {
		let badges = [];
		let matches = title.match(/^\[([A-Z]*)\]/);
		while(matches) {
			const badge = matches[1]
				.split(' ')
				.map(w => w.substring(0, 1).toUpperCase() + w.substring(1).toLowerCase())
				.join(' ');
			badges.push(badge);
			title = title.substring(matches[0].length);
			matches = title.match(/^\[([A-Z]*)\]/);
		}
		badges = [ ...new Set(badges) ].filter(b => b.length > 1);
		if(badges.length) {
			badge = badges[0];
		}
	} else if(item.value.itemType) {
		badge = item.value.itemType;
	}

	return (
		<li
			aria-labelledby={ id }
			className="result"
			data-signature={ item.signature }
			onKeyDown={ onItemSelect }
			onClick={ onItemSelect }
			tabIndex={ -2 }
		>
			{/* { badge && <span className="badge badge-light d-sm-none">{ badge }</span> } */}
			<h5 id={ id } className="title">
				<span className="title-container">
					{ title }
				</span>
				{ badge && <span className="badge badge-light d-xs-none d-sm-inline-block">{ badge }</span> }
			</h5>
			<p className="description">
				{item.value.description}
			</p>
		</li>
	);
});

ChoiceItem.propTypes = {
	item: PropTypes.object,
	onItemSelect: PropTypes.func,
}

ChoiceItem.displayName = 'ChoiceItem';

const getItem = (ev, items) => items.find(item => item.signature === ev.currentTarget.closest('[data-signature]')?.dataset.signature);

const MultipleChoiceDialog = props => {
	const { activeDialog, isTranslatingMore, moreItemsLink, multipleChoiceItems,
	onMultipleChoiceCancel, onMultipleChoiceMore, onMultipleChoiceSelect } = props;
	const listRef = useRef(null);
	const { focusNext, focusPrev, receiveBlur, receiveFocus } = useFocusManager(listRef);
	const persistBtnWidth = useRef(null); // To avoid button size change when spinner is shown, store the button width in a ref when it is firts rendered
	const intl = useIntl();
	const useDescriptionColumn = !!multipleChoiceItems?.some(item => item.value.description);

	const handleItemSelect = useCallback(ev => {
		if(isTriggerEvent(ev)) {
			const item = getItem(ev, multipleChoiceItems);
			onMultipleChoiceSelect(item);
			ev.stopPropagation();
		}
	}, [multipleChoiceItems, onMultipleChoiceSelect]);

	const handleListKeyDown = useCallback(ev => {
		if (ev.key === 'ArrowDown') {
			focusNext(ev, { useCurrentTarget: false });
		} else if (ev.key === 'ArrowUp') {
			focusPrev(ev, { useCurrentTarget: false });
		}
	}, [focusNext, focusPrev]);

	const handleModalAfterOpen = useCallback(() => {
		listRef.current.focus();
	}, []);

	const handleMoreButtonClick = useCallback(() => {
		listRef.current.focus(); // move focus back to the list, because the button will be disabled
		onMultipleChoiceMore();
	}, [onMultipleChoiceMore]);

	const title = intl.formatMessage({ id: 'zbib.multipleChoice.prompt', defaultMessage: 'Please select a citation from the list' });

	return (multipleChoiceItems && activeDialog === 'MULTIPLE_CHOICE_DIALOG') ? (
		<Modal
			isOpen={ activeDialog === 'MULTIPLE_CHOICE_DIALOG' }
			contentLabel={ title }
			className={cx("multiple-choice-dialog modal modal-lg", { 'modal-with-footer': moreItemsLink })}
			onRequestClose={ onMultipleChoiceCancel }
			onAfterOpen={ handleModalAfterOpen }
		>
			<div className="modal-content" tabIndex={ -1 }>
				<div className="modal-header">
					<h4 className="modal-title text-truncate">
						{ title }
					</h4>
					<Button
						title={intl.formatMessage({ id: 'zbib.modal.closeDialog', defaultMessage: 'Close Dialog' })}
						icon
						className="close"
						onClick={ onMultipleChoiceCancel }
					>
						<Icon type={'24/remove'} role="presentation" width="24" height="24" />
					</Button>
				</div>
				<div className="modal-body" tabIndex={-1}>
					<ul
						tabIndex={0}
						ref={listRef}
						onFocus={receiveFocus}
						onBlur={receiveBlur}
						onKeyDown={handleListKeyDown}
						aria-label="Results"
						className={ cx("results", { 'single-column': !useDescriptionColumn }) }
					>
						{ multipleChoiceItems.map(item => (
							<ChoiceItem
								key={ item.signature }
								item={ item }
								onItemSelect={ handleItemSelect }
							/>
						)) }
					</ul>
				</div>
				{moreItemsLink && (
					<div className="modal-footer">
						<div className="selection-count">
							<FormattedMessage
								id="zbib.multipleChoice.selectionCount"
								defaultMessage="{count, plural, one {# item found} other {# items found}}"
								values={{ count: multipleChoiceItems.length }}
							/>
						</div>
						<Button
							ref={ ref => persistBtnWidth.current = ref?.offsetWidth }
							style={ isTranslatingMore ? { width: persistBtnWidth.current } : {} }
							disabled={ isTranslatingMore }
							className="btn-outline-secondary btn-min-width btn-flex"
							onClick={handleMoreButtonClick}
						>
							{ isTranslatingMore ? <Spinner /> : <FormattedMessage id="zbib.multipleChoice.more" defaultMessage="More…" /> }
						</Button>
					</div>
				)}
			</div>
		</Modal>
	) : null;
}

MultipleChoiceDialog.propTypes = {
	activeDialog: PropTypes.string,
	isTranslatingMore: PropTypes.bool,
	moreItemsLink: PropTypes.string,
	multipleChoiceItems: PropTypes.array,
	onMultipleChoiceCancel: PropTypes.func.isRequired,
	onMultipleChoiceMore: PropTypes.func.isRequired,
	onMultipleChoiceSelect: PropTypes.func.isRequired,
}

export default memo(MultipleChoiceDialog);
