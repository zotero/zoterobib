import React from 'react';
import PropTypes from 'prop-types';
import { default as KeyHandler } from 'react-key-handler';
import { KEYDOWN } from 'react-key-handler';
import Button from './ui/button';
import Modal from './modal';
import Icon from './ui/icon';
import formatBib from '../cite';

class ConfirmAddDialog extends React.Component {
	render() {
		const { onConfirmAddCancel, onConfirmAddConfirm,
			isConfirmingAdd, itemToConfirm } = this.props;

		if(!itemToConfirm) {
			return null;
		}

		const { citations, bibliography, isFallback } = itemToConfirm;
		const html = isFallback ?
			`<ol><li>${citations.join('</li><li>')}</li></ol>` :
			formatBib(bibliography);
		const div = document.createElement('div');
		div.innerHTML = html;

		return (
			<Modal
				isOpen={ isConfirmingAdd }
				contentLabel="Select the entry to add:"
				className="multiple-choice-dialog modal modal-lg"
				onRequestClose={ onConfirmAddCancel }
			>
				<KeyHandler
					keyEventName={ KEYDOWN }
					keyValue="Escape"
					onKeyHandle={ onConfirmAddCancel }
				/>
				<KeyHandler
					keyEventName={ KEYDOWN }
					keyValue="Enter"
					onKeyHandle={ onConfirmAddConfirm }
				/>
				<div className="modal-content" tabIndex={ -1 }>
					<div className="modal-header">
						<h4 className="modal-title text-truncate">
							Add this citation to your bibliography?
						</h4>
						<Button
							className="close"
							onClick={ onConfirmAddCancel }
						>
							<Icon type={ '24/remove' } width="24" height="24" />
						</Button>
					</div>
					<div className="modal-body">
						<div className="results">
							<div
								dangerouslySetInnerHTML={ { __html: div.innerHTML } }
							/>
						</div>
						<div className="more-items-action">
							<Button
								className="btn-outline-secondary btn-min-width"
								onClick={ onConfirmAddConfirm }
							>
								Add
							</Button>
						</div>
					</div>
				</div>
			</Modal>
		);
	}

	static propTypes = {
		isConfirmingAdd: PropTypes.bool,
		itemToConfirm: PropTypes.object,
		onConfirmAddCancel: PropTypes.func.isRequired,
		onConfirmAddConfirm: PropTypes.func.isRequired,
	}
}

export default ConfirmAddDialog;
