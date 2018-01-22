'use strict';

const React = require('react');
const PropTypes = require('prop-types');
const Spinner = require('zotero-web-library/lib/component/ui/spinner');

class IdInput extends React.PureComponent {
	constructor(props) {
		super(props);
		this.state = {
			url: props.url
		};
	}

	componentWillReceiveProps(nextProps) {
		this.setState({
			url: nextProps.url
		}, () => {
			if(this.props.isTranslating && !nextProps.isTranslating) {
				this.inputField.focus();
			}
		});
	}

	handleUrlChange(ev) {
		this.setState({
			url: ev.target.value
		});
	}

	handleKeyboard(ev) {
		if(ev.key === 'Enter' && this.state.url.length > 0 && !this.props.isTranslating) {
			this.handleTranslateIdentifier();
		}
	}

	handleTranslateIdentifier() {
		this.props.onTranslationRequest(this.state.url);
	}

	render() {
		return (
			<div className="id-input-container">
				<input
					ref = { i => this.inputField = i }
					autoFocus
					placeholder="Enter URL, ISBN, DOI, or PMID"
					className="form-control form-control-lg id-input"
					type="text" value={ this.state.url }
					onChange={ this.handleUrlChange.bind(this) }
					onKeyPress={ this.handleKeyboard.bind(this) }
				/>
				{
					this.props.isTranslating ? (
						<Spinner />
					) : null
				}
			</div>
		);
	}

	static propTypes = {
		isTranslating: PropTypes.bool,
		onTranslationRequest: PropTypes.func.isRequired,
		url: PropTypes.string,
	}
}

module.exports = IdInput;
