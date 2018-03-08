'use strict';

const React = require('react');
const PropTypes = require('prop-types');
const { withRouter } = require('react-router-dom');
const Icon = require('zotero-web-library/lib/component/ui/icon');

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

				<p className="text">
					{ this.props.message }
					{' '}
					<Button
						className="btn-outline-inverse-warning"
						onClick={ this.handleUndo.bind(this) }
					>
						Undo
					</Button>
				</p>
				<button
					className="btn btn-icon close"
					onClick={ this.handleDismiss.bind(this) }
				>
					<Icon type={ '24/remove' } width="24" height="24" />
				</button>
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
