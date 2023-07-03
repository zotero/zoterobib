import { useCallback, memo } from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import { useIntl } from 'react-intl';
import { Select, SelectDivider, SelectOption } from 'web-common/components';

import { citationStylesCount } from '../../../data/citation-styles-data.json';

const StyleSelector = ({ className, citationStyle, citationStyles, onCitationStyleChanged }) => {
	const handleMoreStylesTrigger = useCallback(
		() => onCitationStyleChanged('install'), [onCitationStyleChanged]
	);
	const intl = useIntl();

	return (
			<div className={ cx('style-selector', className ) }>
				<Select
					aria-label={ intl.formatMessage({
						id: 'zbib.styleSelector.label',
						defaultMessage: 'Citation Style',
					}) }
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
						option={ {
							value: 'install',
							label: intl.formatMessage({
								id: 'zbib.styleSelector.otherStyles',
								defaultMessage: '{citationStylesCount, plural, other {#+ other styles} } available…',
							}, { citationStylesCount: Math.floor(citationStylesCount / 1000) * 1000 })
						}}
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
