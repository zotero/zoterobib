/* eslint-disable react/no-deprecated */
// @TODO: migrate to getDerivedStateFromProps()
'use strict';

const React = require('react');
const PropTypes = require('prop-types');
const Input = require('zotero-web-library/src/js/component/form/input');
const Button = require('zotero-web-library/src/js/component/ui/button');

class IdInput extends React.PureComponent {
	state = {
		identifier: ''
	}

	componentDidMount() {
		this.setState({ identifier: this.props.identifier });
	}

	componentWillReceiveProps(nextProps) {
		if(this.props.isTranslating && !nextProps.isTranslating) {
			this.inputField.focus();
		}
		if(this.props.identifier && !nextProps.identifier) {
			this.setState({ identifier: nextProps.identifier });
		}
	}

	handleChange(identifier) {
		this.setState({ identifier });
	}

	handleCite() {
		const { identifier } = this.state;
		if(identifier.length > 0 && !this.props.isTranslating) {
			this.props.onTranslationRequest(identifier);
		}
	}

	render() {
		return (
			<div className="id-input-container">
				<Input
					autoFocus
					className="form-control form-control-lg id-input"
					isBusy={ this.props.isTranslating }
					onBlur={ () => true /* do not commit on blur */ }
					onChange={ this.handleChange.bind(this) }
					onCommit={ this.handleCite.bind(this) }
					placeholder="Enter a URL, PubMed ID (PMID), ISBN, DOI, arXiv ID, or  article title"
					ref = { i => this.inputField = i }
					tabIndex={ 0 }
					type="text"
					value={ this.state.identifier }
				/>
				<Button
					className="btn-lg btn-secondary"
					onClick={ this.handleCite.bind(this) }
				>
					Suggest Citation
				</Button>
			</div>
		);
	}

	static propTypes = {
		identifier: PropTypes.string,
		isTranslating: PropTypes.bool,
		onTranslationRequest: PropTypes.func.isRequired,
	}
}

module.exports = IdInput;
