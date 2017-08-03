'use strict';

const React = require('react');
const { withRouter } = require('react-router-dom');

class ErrorMessage extends React.Component {
	componentWillReceiveProps(nextProps) {
		if('location' in nextProps && 
			nextProps.location.pathname !== this.props.location.pathname) {
			this.props.onDismiss();
		}
	}

	render() {
		return (
			<div className={ `zotero-bib-error ${ this.props.error ? 'visible' : ''}` }>
				<button 
					className="zotero-bib-error-dismiss"
					onClick={ this.props.onDismiss }
				>x</button>
				{ this.props.error }
			</div>
		);
	}
}

module.exports = withRouter(ErrorMessage);