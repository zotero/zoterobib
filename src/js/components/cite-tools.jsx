'use strict';

const React = require('react');
const PropTypes = require('prop-types');

const Button = require('zotero-web-library/src/js/component/ui/button');
const IdInput = require('./id-input');

class CiteTools extends React.PureComponent {
	render() {
		return (
			<div className="cite-tools">
				<IdInput
					identifier={ this.props.identifier }
					isTranslating={ this.props.isTranslating }
					onTranslationRequest={ this.props.onTranslationRequest }
				/>
				<Button onClick={ () => { this.props.onEditorOpen(); } }
					className="btn-sm btn-outline-secondary"
				>
					Manual Entry
				</Button>
			</div>
		);
	}

	static propTypes = {
		isTranslating: PropTypes.bool,
		onEditorOpen: PropTypes.func.isRequired,
		onTranslationRequest: PropTypes.func.isRequired,
		identifier: PropTypes.string,
	}
}

module.exports = CiteTools;
