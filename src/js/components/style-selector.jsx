import React, { useCallback, memo } from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';

import Select, { SelectDivider, SelectOption } from './ui/select';
import { citationStylesCount } from '../../../data/citation-styles-data.json';

const StyleSelector = ({ className, citationStyle, citationStyles, onCitationStyleChanged }) => {
	const handleMoreStylesTrigger = useCallback(
		() => onCitationStyleChanged('install'), [onCitationStyleChanged]
	);

	return (
			<div className={ cx('style-selector', className ) }>
				<Select
					clearable={ false }
					searchable={ false}
					value={ citationStyle }
					options={ [
						...citationStyles.map(cs => ({
							value: cs.name,
							label: cs.title
						})),
					] }
					onChange={ onCitationStyleChanged }
				>
					<SelectDivider />
					<SelectOption
						onTrigger={ handleMoreStylesTrigger }
						option={ { label: `${(Math.floor(citationStylesCount / 100) * 100).toLocaleString()}+ other styles available…`, value: 'install' } }
						/>
				</Select>
			</div>
		);
}

StyleSelector.propTypes = {
	className: PropTypes.string,
	citationStyle: PropTypes.string,
	citationStyles: PropTypes.array,
	onCitationStyleChanged: PropTypes.func
}


export default memo(StyleSelector);
