'use strict';

const React = require('react');
const PropTypes = require('prop-types');

const Button = require('zotero-web-library/lib/component/ui/button');
const Confirmation = require('./confirmation');

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
		const entriesCount = Object.keys(this.props.citations).length;
		return [
			<Button
				key="delete-all-button"
				className="btn-sm btn-outline-primary"
				disabled={ Object.keys(this.props.citations).length === 0 }
				onClick={ this.handleDeleteAll.bind(this) }
			>
				Delete All
			</Button>,
			<Confirmation
				key="delete-all-confirmation"
				isOpen={ this.state.isConfirmingDeleteAll }
				onConfirm={ this.handleConfirmDeleteAll.bind(this) }
				onCancel={ this.handleCancelDeleteAll.bind(this) }
				title="Delete all entries?"
				confirmLabel="Delete"
				>
					<p>
						{ entriesCount } { entriesCount > 1 ? 'entries' : 'entry' } will be removed.
					</p>
			</Confirmation>
		];
	}

	static propTypes = {
		citations: PropTypes.object,
		onDeleteCitations: PropTypes.func.isRequired,
	}
}

module.exports = DeleteAllButton;
