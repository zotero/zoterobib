'use strict';

const React = require('react');
const PropTypes = require('prop-types');
const { Link } = require('react-router-dom');

const Button = require('zotero-web-library/lib/component/ui/button');
const UrlInput = require('./url-input');

class CiteTools extends React.PureComponent {
	render() {
		return (
			<div className="cite-tools">
				<UrlInput
					url={ this.props.url }
					isTranslating={ this.props.isTranslating }
					onTranslationRequest={ this.props.onTranslationRequest }
				/>

				<Link to={ '/editor' }>
					<Button>
						Manual Entry
					</Button>
				</Link>
			</div>
		);
	}

	static propTypes = {
		isTranslating: PropTypes.bool,
		onTranslationRequest: PropTypes.func.isRequired,
		url: PropTypes.string,
	}
}

module.exports = CiteTools;
