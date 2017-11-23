'use strict';

const React = require('react');
const PropTypes = require('prop-types');
const { withRouter } = require('react-router-dom');

const Button = require('zotero-web-library/lib/component/ui/button');

class UndoMessage extends React.Component {
	componentWillUnmount() {
		if(this.timeout) {
			window.clearTimeout(this.timeout);
			delete this.timeout;
		}
	}

	componentWillReceiveProps(nextProps) {
		if('location' in nextProps && 
			nextProps.location.pathname !== this.props.location.pathname) {
			this.props.onDismiss();
		}

		//show dialog for 5 sec
		if(this.props.message !== nextProps.message && nextProps.message !== null) {
			this.timeout = setTimeout(this.props.onDismiss, 5000);
		}
	}

	handleDismiss() {
		window.clearTimeout(this.timeout);
		delete this.timeout;
		this.props.onDismiss();
	}

	handleUndo() {
		window.clearTimeout(this.timeout);
		delete this.timeout;
		this.props.onUndo();
	}

	render() {
		return this.props.message ? (
			<div className="message warning">
				<button 
					className="dismiss"
					onClick={ this.handleDismiss.bind(this) }
				>x</button>
				<span className="content">
					{ this.props.message }
				</span>
				<Button onClick={ this.handleUndo.bind(this) }>Undo</Button>
			</div>
		) : null;
	}

	static propTypes = {
		onDismiss: PropTypes.func.isRequired,
		onUndo: PropTypes.func.isRequired,
		message: PropTypes.string,
		location: PropTypes.object
	}
}

module.exports = withRouter(UndoMessage);