import PropTypes from 'prop-types';
import { useCallback, useId, memo } from 'react';
import { FormattedMessage } from 'react-intl';
import { Button, Icon, Spinner } from 'web-common/components';
import { isTriggerEvent } from 'web-common/utils';

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
			tabIndex={ 0 }
		>
			{ badge && <span className="badge badge-light d-sm-none">{ badge }</span> }
			<h5 id={ id } className="title">
				<span className="title-container">
					{ title }
				</span>
				{ badge && <span className="badge badge-light d-xs-none d-sm-inline-block">{ badge }</span> }
			</h5>
			{ item.value.description && (
				<p className="description">
					{item.value.description}
				</p>
			)}
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

	const handleItemSelect = useCallback(ev => {
		if(isTriggerEvent(ev)) {
			const item = getItem(ev, multipleChoiceItems);
			onMultipleChoiceSelect(item);
		}
	}, [multipleChoiceItems, onMultipleChoiceSelect]);

	return (multipleChoiceItems && activeDialog === 'MULTIPLE_CHOICE_DIALOG') ? (
		<Modal
			isOpen={ activeDialog === 'MULTIPLE_CHOICE_DIALOG' }
			contentLabel="Select a Search Result to Add"
			className="multiple-choice-dialog modal modal-lg"
			onRequestClose={ onMultipleChoiceCancel }
		>
			<div className="modal-content" tabIndex={ -1 }>
				<div className="modal-header">
					<h4 className="modal-title text-truncate">
						<FormattedMessage id="zbib.multipleChoice.prompt" defaultMessage="Please select a citation from the list" />
					</h4>
					<Button
						icon
						className="close"
						onClick={ onMultipleChoiceCancel }
					>
						<Icon type={ '24/remove' } width="24" height="24" />
					</Button>
				</div>
				<div className="modal-body">
					<ul
						aria-label="Results"
						className="results"
					>
						{ multipleChoiceItems.map(item => (
							<ChoiceItem
								key={ item.signature }
								item={ item }
								onItemSelect={ handleItemSelect }
							/>
						)) }
					</ul>
					{ moreItemsLink && (
						<div className="more-items-action">
							{ isTranslatingMore ? <Spinner /> : (
								moreItemsLink !== null && (
									<Button
										className="btn-outline-secondary btn-min-width"
										onClick={ onMultipleChoiceMore }
									>
										<FormattedMessage id="zbib.multipleChoice.more" defaultMessage="More…" />
									</Button>
								)
							) }
						</div>
					) }
				</div>
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
