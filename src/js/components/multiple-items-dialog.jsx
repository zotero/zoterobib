import React from 'react';
import PropTypes from 'prop-types';
import { default as KeyHandler } from 'react-key-handler';
import { KEYDOWN } from 'react-key-handler';
import Button from './ui/button';
import Modal from './modal';
import Icon from './ui/icon';

class MultipleItemsDialog extends React.Component {
	handleFocus = ev => {
		this.focusedItem = ev.currentTarget.dataset.key;
	}

	handleKeyboardConfirm = () => {
		if(this.focusedItem) {
			this.props.onMultipleItemsSelect(this.focusedItem);
		}
	}

	handleAdd = ev => {
		this.props.onMultipleItemsSelect(ev.currentTarget.dataset.key);
	}

	handleCancel = () => {
		this.props.onMultipleItemsCancel();
	}

	render() {
		const { activeDialog, multipleItems } = this.props;

		if(!multipleItems || activeDialog !== 'MULTIPLE_ITEMS_DIALOG') {
			return null;
		}

		return (
			<Modal
				isOpen={ activeDialog === 'MULTIPLE_ITEMS_DIALOG' }
				contentLabel="Select the entry to add:"
				className="multiple-choice-dialog modal modal-lg"
				onRequestClose={ this.handleCancel }
			>
				<KeyHandler
					keyEventName={ KEYDOWN }
					keyValue="Escape"
					onKeyHandle={ this.handleCancel }
				/>
				<KeyHandler
					keyEventName={ KEYDOWN }
					keyValue="Enter"
					onKeyHandle={ this.handleKeyboardConfirm }
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
							{
								multipleItems.bibliographyItems.map(item => (
									<li key={ item.id }
										data-key={ item.id }
										className="result"
										onFocus={ this.handleFocus }
										onClick={ this.handleAdd }
										tabIndex={ 0 }
									>
										<div className="csl-entry-container">
											{ item.value }
										</div>
									</li>
								))
							}
						</ul>
					</div>
				</div>
			</Modal>
		);
	}

	static propTypes = {
		activeDialog: PropTypes.string,
		multipleItems: PropTypes.object,
		multipleChoiceItems: PropTypes.array,
		onMultipleItemsCancel: PropTypes.func.isRequired,
		onMultipleItemsSelect: PropTypes.func.isRequired,
	}
}

export default MultipleItemsDialog;
