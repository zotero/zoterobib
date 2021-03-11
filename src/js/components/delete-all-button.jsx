import React from 'react';
import PropTypes from 'prop-types';

import Button from './ui/button';
import Confirmation from './confirmation';

class DeleteAllButton extends React.Component {
	state = {
		isConfirmingDeleteAll: false
	}

	handleDeleteAll() {
		this.setState({ isConfirmingDeleteAll: true });
	}

	handleConfirmDeleteAll() {
		this.setState({ isConfirmingDeleteAll: false });
		this.props.onDeleteCitations();
	}

	handleCancelDeleteAll() {
		this.setState({ isConfirmingDeleteAll: false });
	}

	render() {
		const entriesCount = this.props.items.length;
		return [
			<Button
				key="delete-all-button"
				className="btn-sm btn-outline-primary"
				onClick={ this.handleDeleteAll.bind(this) }
			>
				Delete All
			</Button>,
			<Confirmation
				key="delete-all-confirmation"
				isOpen={ this.state.isConfirmingDeleteAll }
				onConfirm={ this.handleConfirmDeleteAll.bind(this) }
				onCancel={ this.handleCancelDeleteAll.bind(this) }
				title="Clear Bibliography?"
				confirmLabel="Delete"
				>
					<p>
						{ entriesCount > 0 && (
							<span>
								{ entriesCount } { entriesCount > 1 ? 'entries' : 'entry' } will be deleted.
							</span>
						)
						}
					</p>
			</Confirmation>
		];
	}

	static propTypes = {
		items: PropTypes.array,
		onDeleteCitations: PropTypes.func.isRequired,
	}
}

export default DeleteAllButton;
