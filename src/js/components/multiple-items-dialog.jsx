import React, { useMemo, useCallback, useRef, memo } from 'react';
import PropTypes from 'prop-types';
import { default as KeyHandler } from 'react-key-handler';
import { KEYDOWN } from 'react-key-handler';
import Button from './ui/button';
import Modal from './modal';
import Icon from './ui/icon';
import { formatBib, formatFallback } from '../cite';

const MultipleItemsDialog = props => {
	const { activeDialog, multipleItems, onMultipleItemsSelect, onMultipleItemsCancel,  } = props;
	const focusedItem = useRef(null);

	const bibliographyRendered = useMemo(() => {
		if(!multipleItems) {
			return null;
		}
		const { bibliographyItems, bibliographyMeta, styleHasBibliography } = multipleItems;
			return (styleHasBibliography && bibliographyMeta) ?
				formatBib(bibliographyItems, bibliographyMeta) :
				formatFallback(bibliographyItems)
		}, [multipleItems]
	);

	const bibliographyRenderedNodes = useMemo(() => {
		if(!bibliographyRendered) {
			return [];
		}
		const div = document.createElement('div');
		div.innerHTML = bibliographyRendered;
		div.querySelectorAll('a').forEach(link => {
			link.setAttribute('rel', 'nofollow');
		});
		return div.firstChild.children;
	}, [bibliographyRendered]);

	const handleFocus = useCallback(ev => {
		focusedItem.current = ev.currentTarget.dataset.key;
	}, [])

	const handleKeyboardConfirm = useCallback(() => {
		if(focusedItem.current) {
			onMultipleItemsSelect(focusedItem.current);
		}
	}, [onMultipleItemsSelect])

	const handleAdd = useCallback(ev => {
		onMultipleItemsSelect(ev.currentTarget.dataset.key);
	}, [onMultipleItemsSelect])

	const handleCancel = useCallback(() => {
		onMultipleItemsCancel();
	}, [onMultipleItemsCancel])

	if(!multipleItems || activeDialog !== 'MULTIPLE_ITEMS_DIALOG') {
		return null;
	}

	return (
		<Modal
			isOpen={ activeDialog === 'MULTIPLE_ITEMS_DIALOG' }
			contentLabel="Select the entry to add:"
			className="multiple-choice-dialog modal modal-lg"
			onRequestClose={ handleCancel }
		>
			<KeyHandler
				keyEventName={ KEYDOWN }
				keyValue="Escape"
				onKeyHandle={ handleCancel }
			/>
			<KeyHandler
				keyEventName={ KEYDOWN }
				keyValue="Enter"
				onKeyHandle={ handleKeyboardConfirm }
			/>
			<div className="modal-content" tabIndex={ -1 }>
				<div className="modal-header">
					<h4 className="modal-title text-truncate">
						Please select a citation from the list
					</h4>
					<Button
						icon
						className="close"
						onClick={ handleCancel }
					>
						<Icon type={ '24/remove' } width="24" height="24" />
					</Button>
				</div>
				<div className="modal-body">
					<ul className="results">
						{
							multipleItems.bibliographyItems.map((item, index) => (
								<li key={ item.id }
									data-key={ item.id }
									className="result"
									onFocus={ handleFocus }
									onClick={ handleAdd }
									tabIndex={ 0 }
								>
									<div
										className="csl-entry-container"
										dangerouslySetInnerHTML={
											{ __html: bibliographyRenderedNodes[index]?.innerHTML || item.value }
									} />
								</li>
							))
						}
					</ul>
				</div>
			</div>
		</Modal>
	)
}

MultipleItemsDialog. propTypes = {
	activeDialog: PropTypes.string,
	multipleItems: PropTypes.object,
	multipleChoiceItems: PropTypes.array,
	onMultipleItemsCancel: PropTypes.func.isRequired,
	onMultipleItemsSelect: PropTypes.func.isRequired,
}

export default memo(MultipleItemsDialog);
