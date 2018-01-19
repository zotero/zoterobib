'use strict';

const React = require('react');
const PropTypes = require('prop-types');
const { withRouter } = require('react-router-dom');

class ErrorMessage extends React.Component {
	componentWillReceiveProps(nextProps) {
		if('location' in nextProps &&
			nextProps.location.pathname !== this.props.location.pathname) {
			this.props.onDismiss();
		}
	}

	render() {
		return this.props.message ? (
			<div className="message error">
				<button
					className="dismiss"
					onClick={ this.props.onDismiss }
				>x</button>
				<span className="content">
					{ this.props.message }
				</span>
			</div>
		): null;
	}

	static propTypes = {
		onDismiss: PropTypes.func.isRequired,
		message: PropTypes.string,
		location: PropTypes.object
	}
}

module.exports = withRouter(ErrorMessage);
