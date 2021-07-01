import React from 'react';
import PropTypes from 'prop-types';
import { default as KeyHandler } from 'react-key-handler';
import { KEYDOWN } from 'react-key-handler';
import Button from './ui/button';
import Modal from './modal';
import Icon from './ui/icon';
import { formatBib, formatFallback } from '../cite';

class ConfirmAddDialog extends React.Component {
	render() {
		const { activeDialog, onConfirmAddCancel, onConfirmAddConfirm, itemToConfirm,
			styleHasBibliography } = this.props;

		if(!itemToConfirm || activeDialog !== 'CONFIRM_ADD_DIALOG') {
			return null;
		}


		const { bibliographyItems, bibliographyMeta } = itemToConfirm;
		const html = styleHasBibliography ? formatBib(bibliographyItems, bibliographyMeta) : formatFallback(bibliographyItems);
		const div = document.createElement('div');
		div.innerHTML = html;

		return (
			<Modal
				isOpen={ activeDialog === 'CONFIRM_ADD_DIALOG' }
				contentLabel="Select the entry to add:"
				className="confirm-add-dialog modal modal-lg"
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
							icon
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
		activeDialog: PropTypes.string,
		itemToConfirm: PropTypes.object,
		onConfirmAddCancel: PropTypes.func.isRequired,
		onConfirmAddConfirm: PropTypes.func.isRequired,
		styleHasBibliography: PropTypes.bool,
	}
}

export default ConfirmAddDialog;
