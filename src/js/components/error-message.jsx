'use strict';

const React = require('react');
const PropTypes = require('prop-types');
const { withRouter } = require('react-router-dom');
const Icon = require('zotero-web-library/lib/component/ui/icon');

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
				<div className="content">
					{ this.props.message }
				</div>
				<button
					className="btn btn-icon close"
					aria-label="Close"
					onClick={ this.props.onDismiss }
				>
					<Icon type={ '24/remove' } width="24" height="24" />
				</button>
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
