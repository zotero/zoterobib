import PropTypes from 'prop-types';
import { memo, useEffect, useMemo, useCallback, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Button, Icon } from 'web-common/components';
import { isTriggerEvent } from 'web-common/utils';
import { usePrevious } from 'web-common/hooks';

import Modal from './modal';
import { formatBib, formatFallback } from '../cite';

const MultipleItemsDialog = props => {
	const { activeDialog, multipleItems, onMultipleItemsSelect, onMultipleItemsCancel,  } = props;
	const [selectedItems, setSelectedItems] = useState([]);
	const prevActiveDialog = usePrevious(activeDialog);
	const intl = useIntl();
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

	const handleSelectAll = useCallback(() => {
		setSelectedItems(multipleItems.bibliographyItems.map(item => item.id));
	}, [multipleItems]);

	const handleClearSelection = useCallback(() => {
		setSelectedItems([]);
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
				<div className="modal-body">
					<ul
						aria-label="Results"
						className="results"
					>
						{
							(multipleItems?.bibliographyItems ?? []).map((item, index) => (
								<li
									aria-labelledby={`citation-${item.id}`}
									key={ item.id }
									data-key={ item.id }
									className="result"
									onKeyDown={ handleItemSelectionChange }
									onClick={ handleItemSelectionChange }
									tabIndex={ 0 }
								>
									<div
										id={ `citation-${item.id}` }
										className="csl-entry-container"
										dangerouslySetInnerHTML={
											{ __html: bibliographyRenderedNodes[index]?.innerHTML || item.value }
									} />
									<div>
										<input
											aria-labelledby={`citation-${item.id}`}
											checked={ selectedItems.includes(item.id) }
											className="checkbox"
											onChange={ handleItemSelectionChange }
											tabIndex={ -1 }
											type="checkbox"
										/>
									</div>
								</li>
							))
						}
					</ul>
				</div>
				<div className="modal-footer">
					<div className="selection-count">
						<Button className="btn btn-link" onClick={ handleSelectAll }>
							<FormattedMessage id="zbib.multipleItems.selectAll" defaultMessage="Select All" />
						</Button>
						<Button className="btn btn-link" onClick={ handleClearSelection }>
							<FormattedMessage id="zbib.multipleItems.clearSelection" defaultMessage="Clear Selection" />
						</Button>
					</div>
					<Button
						disabled={selectedItems.length === 0}
						className="btn-outline-secondary btn-min-width"
						onClick={handleAddSelected}
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

MultipleItemsDialog. propTypes = {
	activeDialog: PropTypes.string,
	multipleChoiceItems: PropTypes.array,
	multipleItems: PropTypes.object,
	onMultipleItemsCancel: PropTypes.func.isRequired,
	onMultipleItemsSelect: PropTypes.func.isRequired,
}

export default memo(MultipleItemsDialog);
