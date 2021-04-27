import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import { default as Select } from 'react-select';
import { citationStylesCount } from '../../../data/citation-styles-data.json';

class StyleSelector extends React.Component {
	render() {
		return (
			<div className={ cx('style-selector', this.props.className ) }>
				<Select
					clearable={ false }
					searchable={ false}
					value={ this.props.citationStyle }
					options={ [
						...this.props.citationStyles.map(cs => ({
							value: cs.name,
							label: cs.title
						})),
						{
							value: 'install',
							label: `${(Math.floor(citationStylesCount / 100) * 100).toLocaleString()}+ other styles available…`
						}
					] }
					onChange={ this.props.onCitationStyleChanged }
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


export default StyleSelector;
