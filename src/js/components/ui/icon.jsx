import React, { memo } from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';

const Icon = props => {
	const style = {
		color: props.color,
		...props.style
	};

	const basename = props.type.split(/[\\/]/).pop();

	const svgAttr = {
		className: cx(['icon', `icon-${basename}`, props.className]),
		role: 'img',
		style
	};

	if(props.width) {
		svgAttr['width'] = parseInt(props.width, 10);
	}

	if(props.height) {
		svgAttr['height'] = parseInt(props.height, 10);
	}

	if(props.viewBox) {
		svgAttr['viewBox'] = props.viewBox;
	}

	if(props.label) {
		svgAttr['aria-label'] = props.label;
	}

	return (
		<svg { ...svgAttr } viewBox={ props.viewBox}>
			<use
				xlinkHref={ `/static/icons/${props.type}.svg#${basename}`}
			/>
		</svg>
	);
}

Icon.propTypes = {
	className: PropTypes.string,
	color: PropTypes.string,
	height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
	label: PropTypes.string,
	style: PropTypes.object,
	type: PropTypes.string.isRequired,
	viewBox: PropTypes.string,
	width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
}

export default memo(Icon);
