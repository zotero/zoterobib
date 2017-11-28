'use strict';

const React = require('react');
const PropTypes = require('prop-types');
const cx = require('classnames');
const Select = require('react-select').default;
const { withRouter } = require('react-router-dom');

class StyleSelector extends React.Component {
	render() {
		return (
			<div className={ cx('style-selector', this.props.className ) }>
				<Select
					clearable={ false }
					className="zotero-bib-citation-style-selector"
					value={ this.props.citationStyle }
					options={ this.props.citationStyles }
					onChange={ ev => this.props.onCitationStyleChanged(ev.value) }
				/>
			</div>
		);
	}

	static propTypes = {
		className: PropTypes.string,
		citationStyle: PropTypes.string,
		citationStyles: PropTypes.array,
		onCitationStyleChanged: PropTypes.func
	}
}


module.exports = withRouter(StyleSelector);