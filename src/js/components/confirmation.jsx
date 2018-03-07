'use strict';

const React = require('react');
const PropTypes = require('prop-types');
const KeyHandler = require('react-key-handler').default;
const { KEYDOWN } = require('react-key-handler');
const Button = require('zotero-web-library/lib/component/ui/button');
const Modal = require('./modal');

class Confirmation extends React.Component {
	handleEscapeKey(ev) {
		ev.preventDefault();
		this.props.onCancel();
	}

	render() {
		return [
			<KeyHandler
				key="key-handler-escape"
				keyEventName={ KEYDOWN }
				keyValue="Escape"
				onKeyHandle={ () => this.props.onCancel() }
			/>,
			<Modal
				key="react-modal"
				className="modal modal-centered"
				isOpen={ this.props.isOpen }
				contentLabel={ this.props.title }
				onRequestClose={ () => this.props.onCancel() }
			>
				<div className="modal-content">
					<div className="modal-header">
						<h4 className="modal-title text-truncate">
							{ this.props.title }
						</h4>
					</div>
					<div className="modal-body">
						{ this.props.children }
					</div>
					<div className="modal-footer">
						<div className="buttons">
							<Button
								className="btn-outline-secondary"
								onClick={ () => this.props.onCancel() }>
								{ this.props.cancelLabel }
							</Button>
							<Button
								className="btn-secondary"
								onClick={ () => this.props.onConfirm() }>
								{ this.props.confirmLabel }
							</Button>
						</div>
					</div>
				</div>
			</Modal>
		];
	}

	static propTypes = {
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

	static defaultProps = {
		cancelLabel: 'Cancel',
		confirmLabel: 'Confirm',
		title: 'Confirmation',
	};
}


module.exports = Confirmation;
