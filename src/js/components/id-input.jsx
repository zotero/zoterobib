'use strict';

const React = require('react');
const PropTypes = require('prop-types');
const Input = require('zotero-web-library/lib/component/input');

class IdInput extends React.PureComponent {
	componentWillReceiveProps(nextProps) {
		if(this.props.isTranslating && !nextProps.isTranslating) {
			this.inputField.focus();
		}
	}

	handleCommit(identifier) {
		if(identifier.length > 0 && !this.props.isTranslating) {
			this.props.onTranslationRequest(identifier);
		}
	}

	render() {
		return (
			<div className="id-input-container">
				<Input
					ref = { i => this.inputField = i }
					autoFocus
					selectOnFocus
					tabIndex={ 0 }
					placeholder="Enter URL, ISBN, DOI, or PMID"
					className="form-control form-control-lg id-input"
					type="text"
					value={ this.props.identifier }
					onCommit={ this.handleCommit.bind(this) }
					onBlur={ () => true /* do not commit on blur */ }
					isBusy={ this.props.isTranslating }
				/>
			</div>
		);
	}

	static propTypes = {
		isTranslating: PropTypes.bool,
		onTranslationRequest: PropTypes.func.isRequired,
		identifier: PropTypes.string,
	}
}

module.exports = IdInput;
