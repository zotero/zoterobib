import React, { memo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { Button, Icon } from 'web-common/components';
import { isTriggerEvent } from 'web-common/utils';

import Modal from './modal';
import { formatBib, formatFallback } from '../cite';

const ConfirmAddDialog = props => {
	const { activeDialog, onConfirmAddCancel, onConfirmAddConfirm, itemToConfirm,
		styleHasBibliography } = props;
	const isReady = itemToConfirm && activeDialog === 'CONFIRM_ADD_DIALOG';

	const getItemHtml = useCallback(() => {
		const { bibliographyItems, bibliographyMeta } = itemToConfirm;
		const html = styleHasBibliography ? formatBib(bibliographyItems, bibliographyMeta) : formatFallback(bibliographyItems);
		return html;
	}, [itemToConfirm, styleHasBibliography]);

	const handleConfirm = useCallback(ev => {
		if(isTriggerEvent(ev)) {
			onConfirmAddConfirm();
		}
	}, [onConfirmAddConfirm]);

	return isReady ? (
		<Modal
			isOpen={ activeDialog === 'CONFIRM_ADD_DIALOG' }
			contentLabel="Confirm Add Citation"
			className="confirm-add-dialog modal modal-lg"
			onRequestClose={ onConfirmAddCancel }
		>
			<div className="modal-content" tabIndex={ -1 }>
				<div className="modal-header">
					<h4 className="modal-title text-truncate">
						<FormattedMessage id="zbib.dialog.confirmAddThisCitation" defaultMessage="Add this citation to your bibliography?" />
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
							dangerouslySetInnerHTML={ { __html: getItemHtml() } }
						/>
					</div>
					<div className="more-items-action">
						<Button
							autoFocus
							className="btn-outline-secondary btn-min-width"
							onClick={ handleConfirm }
							onKeyDown = { handleConfirm }
						>
							<FormattedMessage id="zbib.general.add" defaultMessage="Add" />
						</Button>
					</div>
				</div>
			</div>
		</Modal>
	) : null;
}

ConfirmAddDialog.propTypes = {
	activeDialog: PropTypes.string,
	itemToConfirm: PropTypes.object,
	onConfirmAddCancel: PropTypes.func.isRequired,
	onConfirmAddConfirm: PropTypes.func.isRequired,
	styleHasBibliography: PropTypes.bool,
}

export default memo(ConfirmAddDialog);
