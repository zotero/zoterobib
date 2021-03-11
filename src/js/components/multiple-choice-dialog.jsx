import React from 'react';
import PropTypes from 'prop-types';
import { default as KeyHandler } from 'react-key-handler';
import { KEYDOWN } from 'react-key-handler';
import Button from './ui/button';
import Spinner from './ui/spinner';
import Icon from './ui/icon';
import Modal from './modal';

class MultipleChoiceDialog extends React.Component {
	handleSelect(item = this.focusedItem) {
		if(item) {
			this.props.onMultipleChoiceSelect(item);
		}
	}

	handleFocus(item) {
		this.focusedItem = item;
	}

	handleCancel() {
		this.props.onMultipleChoiceCancel();
	}

	handleMore() {
		this.props.onMultipleChoiceMore();
	}

	renderItem(item) {
		let badge = null;
		let title = item.value.title || '';
		if(item.source === 'url') {
			let badges = [];
			let matches = title.match(/^\[([A-Z]*)\]/);
			while(matches) {
				let badge = matches[1]
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
				className="result"
				key={ item.signature }
				onFocus={ this.handleFocus.bind(this, item) }
				onClick={ this.handleSelect.bind(this, item) }
				tabIndex={ 0 }
			>
				{ badge && <span key={badge} className="badge badge-light d-sm-none">{ badge }</span> }
				<h5 className="title">
					<span className="title-container">
						{ title }
					</span>
					{ badge && <span key={badge} className="badge badge-light d-xs-none d-sm-inline-block">{ badge }</span> }
				</h5>
				{ item.value.description && (
					<p className="description">
						{item.value.description}
					</p>
				)}
			</li>
		);
	}

	renderMoreSection() {
		const { isTranslatingMore, moreItemsLink } = this.props;
		if(isTranslatingMore) {
			return <Spinner />;
		} else if(moreItemsLink !== null) {
			return (
				<Button
					className="btn-outline-secondary btn-min-width"
					onClick={ this.handleMore.bind(this) }
				>
					More…
				</Button>
			);
		}
	}

	render() {
		return (
			<Modal
				isOpen={ this.props.isPickingItem }
				contentLabel="Select the entry to add:"
				className="multiple-choice-dialog modal modal-lg"
				onRequestClose={ this.handleCancel.bind(this) }
			>
				<KeyHandler
					keyEventName={ KEYDOWN }
					keyValue="Escape"
					onKeyHandle={ this.handleCancel.bind(this) }
				/>
				<KeyHandler
					keyEventName={ KEYDOWN }
					keyValue="Enter"
					onKeyHandle={ this.handleSelect.bind(this, undefined) }
				/>
				<div className="modal-content" tabIndex={ -1 }>
					<div className="modal-header">
						<h4 className="modal-title text-truncate">
							Please select a citation from the list
						</h4>
						<Button
							className="close"
							onClick={ this.handleCancel.bind(this) }
						>
							<Icon type={ '24/remove' } width="24" height="24" />
						</Button>
					</div>
					<div className="modal-body">
						<ul className="results">
							{ this.props.multipleChoiceItems.map(
								this.renderItem.bind(this)
							) }
						</ul>
						{ this.props.moreItemsLink && (
							<div className="more-items-action">
								{ this.renderMoreSection() }
							</div>
						)}
					</div>
				</div>
			</Modal>
		);
	}

	static defaultProps = {
		multipleChoiceItems: []
	}

	static propTypes = {
		isPickingItem: PropTypes.bool,
		isTranslatingMore: PropTypes.bool,
		moreItemsLink: PropTypes.object,
		multipleChoiceItems: PropTypes.array,
		onMultipleChoiceCancel: PropTypes.func.isRequired,
		onMultipleChoiceMore: PropTypes.func.isRequired,
		onMultipleChoiceSelect: PropTypes.func.isRequired,
	}
}

export default MultipleChoiceDialog;
