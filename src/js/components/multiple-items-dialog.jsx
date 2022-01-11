import PropTypes from 'prop-types';
import React, { memo, useEffect, useMemo, useCallback, useState } from 'react';
import { FormattedMessage } from 'react-intl';

import Button from './ui/button';
import Icon from './ui/icon';
import Modal from './modal';
import { formatBib, formatFallback } from '../cite';
import { isTriggerEvent } from '../common/event';
import { usePrevious } from '../hooks';

const MultipleItemsDialog = props => {
	const { activeDialog, multipleItems, onMultipleItemsSelect, onMultipleItemsCancel,  } = props;
	const [selectedItems, setSelectedItems] = useState([]);
	const prevActiveDialog = usePrevious(activeDialog);
	const isOpen = multipleItems && activeDialog === 'MULTIPLE_ITEMS_DIALOG';

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

	const handleItemSelectionChange = useCallback(ev => {
		const itemKey = ev.target.closest('[data-key]').dataset.key;

		if(!isTriggerEvent(ev)) {
			return;
		}

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

	useEffect(() => {
		if(prevActiveDialog !== activeDialog && activeDialog === 'MULTIPLE_ITEMS_DIALOG') {
			setSelectedItems([]);
		}
	}, [activeDialog, prevActiveDialog]);

	return (
		<Modal
			isOpen={ !!isOpen }
			contentLabel="Select the entry to add:"
			className="multiple-choice-dialog modal modal-lg"
			onRequestClose={ handleCancel }
		>
			<div className="modal-content" tabIndex={ -1 }>
				<div className="modal-header">
					<h4 className="modal-title text-truncate">
						<FormattedMessage id="zbib.multipleItems.prompt" defaultMessage="Please select a citation from the list" />
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
							(multipleItems?.bibliographyItems ?? []).map((item, index) => (
								<li key={ item.id }
									data-key={ item.id }
									className="result"
									onKeyDown={ handleItemSelectionChange }
									onClick={ handleItemSelectionChange }
									tabIndex={ 0 }
								>
									<div
										className="csl-entry-container"
										dangerouslySetInnerHTML={
											{ __html: bibliographyRenderedNodes[index]?.innerHTML || item.value }
									} />
									<input
										checked={ selectedItems.includes(item.id) }
										className="checkbox"
										onChange={ handleItemSelectionChange }
										tabIndex={ -1 }
										type="checkbox"
									/>
								</li>
							))
						}
					</ul>
					<div className="more-items-action">
						<Button
							disabled={ selectedItems.length === 0 }
							className="btn-outline-secondary btn-min-width"
							onClick={ handleAddSelected }
						>
							<FormattedMessage id="zbib.multipleItems.confirm" defaultMessage="Add Selected" />
						</Button>
					</div>
				</div>
			</div>
		</Modal>
	)
}

MultipleItemsDialog. propTypes = {
	activeDialog: PropTypes.string,
	multipleChoiceItems: PropTypes.array,
	multipleItems: PropTypes.object,
	onMultipleItemsCancel: PropTypes.func.isRequired,
	onMultipleItemsSelect: PropTypes.func.isRequired,
}

export default memo(MultipleItemsDialog);
