'use strict';

const React = require('react');
const PropTypes = require('prop-types');
const ReactModal = require('react-modal');
const KeyHandler = require('react-key-handler').default;
const { KEYDOWN } = require('react-key-handler');
const Button = require('zotero-web-library/lib/component/ui/button');

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
			<ReactModal 
				key="react-modal"
				isOpen={ this.props.isOpen }
				contentLabel={ this.props.title }
				className="modal"
				overlayClassName="overlay"
			>
				<h1 className="title">
					{ this.props.title }
				</h1>
				{ this.props.children }
				<div className="buttons">
					<Button onClick={ () => this.props.onCancel() }>
						{ this.props.cancelLabel }
					</Button>
					<Button 
						className="btn-primary"
						onClick={ () => this.props.onConfirm() }>
						{ this.props.confirmLabel }
					</Button>
				</div>
			</ReactModal>
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