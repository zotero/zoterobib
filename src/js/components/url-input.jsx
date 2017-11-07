'use strict';

const React = require('react');
const PropTypes = require('prop-types');
const Spinner = require('zotero-web-library/lib/component/ui/spinner');

class UrlInput extends React.PureComponent {
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
			<div className="url-input-wrap">
				<input
					ref = { i => this.inputField = i }
					autoFocus
					placeholder="Cite a source by entering its URL, ISBN, DOI, or PMID"
					className="zotero-bib-form-url"
					type="text" value={ this.state.url }
					onChange={ this.handleUrlChange.bind(this) }
					onKeyPress={ this.handleKeyboard.bind(this) }
				/>
				<button
					disabled = { this.props.isTranslating || this.state.url.length === 0 }
					onClick={ this.handleTranslateIdentifier.bind(this) }>
						{ 
							this.props.isTranslating ? (
								<Spinner />
							) : 'Cite it'
						}
				</button>
			</div>
		);
	}

	static propTypes = {
		isTranslating: PropTypes.bool,
		onTranslationRequest: PropTypes.func.isRequired,
		url: PropTypes.string,
	}
}

module.exports = UrlInput;