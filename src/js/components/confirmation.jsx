import PropTypes from 'prop-types';
import React, { memo } from 'react';

import { Button } from 'web-common/components';
import Modal from './modal';

const Confirmation = props => {
	const { isOpen, title = 'Confirmation', onCancel, onConfirm, children, cancelLabel = 'Cancel',
		confirmLabel = 'Confirm' } = props;

	return (
		<Modal
			key="react-modal"
			className="modal modal-centered"
			isOpen={ isOpen }
			contentLabel={ title }
			onRequestClose={ onCancel }
		>
			<React.Fragment>
				<div className="modal-content" tabIndex={ -1 }>
					<div className="modal-header">
						<h4 className="modal-title text-truncate">
							{ title }
						</h4>
					</div>
					<div className="modal-body">
						{ children }
					</div>
					<div className="modal-footer">
						<div className="buttons">
							<Button
								className="btn-outline-secondary"
								onClick={ onCancel }>
								{ cancelLabel }
							</Button>
							<Button
								autoFocus
								className="btn-secondary"
								onClick={ onConfirm }>
								{ confirmLabel }
							</Button>
						</div>
					</div>
				</div>
			</React.Fragment>
		</Modal>
	);
}

Confirmation.propTypes = {
	cancelLabel: PropTypes.string,
	confirmLabel: PropTypes.string,
	isOpen: PropTypes.bool,
	children: PropTypes.oneOfType([
		PropTypes.arrayOf(PropTypes.node),
		PropTypes.node
	]),
	onCancel: PropTypes.func.isRequired,
	onConfirm: PropTypes.func.isRequired,
	title: PropTypes.string,
}

export default memo(Confirmation);
