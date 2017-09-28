'use strict';

const React = require('react');
const cx = require('classnames');

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
			if(this.props.busy && !nextProps.busy) {
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
		if(ev.key === 'Enter' && this.state.url.length > 0 && !this.props.busy) {
			this.handleTranslateUrl();
		}
	}

	handleTranslateUrl() {
		this.props.onTranslationRequest(this.state.url);
	}

	render() {
		return (
			<div className="url-input-wrap">
				<input
					ref = { i => this.inputField = i }
					autoFocus
					placeholder="Cite a source by entering its url"
					className="zotero-bib-form-url"
					type="text" value={ this.state.url }
					onChange={ this.handleUrlChange.bind(this) }
					onKeyPress={ this.handleKeyboard.bind(this) }
				/>
				<button
					disabled = { this.props.busy || this.state.url.length === 0 }
					className={ cx({ loading: this.props.busy }) }
					onClick={ this.handleTranslateUrl.bind(this) }>
						{ this.props.busy ? '' : 'Cite it' }
				</button>
			</div>
		);
	}
}

module.exports = UrlInput;