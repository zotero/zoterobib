import cx from 'classnames';
import PropTypes from 'prop-types';
import React, { useCallback, useState, memo } from 'react';

import BootDropdownMenu from 'reactstrap/lib/DropdownMenu';

const DropdownMenu = ({ className, onKeyDown, onMouseMove, ...rest}) => {
	const [keyboard, setKeyboard] = useState(false);

	const handleKeyDown = useCallback((...args) => {
		setKeyboard(true);
		if(onKeyDown) {
			onKeyDown(...args);
		}
	}, [onKeyDown]);

	const handleMouseMove = useCallback((...args) => {
		setKeyboard(false);
		if(onMouseMove) {
			onMouseMove(...args);
		}
	}, [onMouseMove]);

	return <BootDropdownMenu
		onKeyDown={ handleKeyDown }
		onMouseMove={ handleMouseMove }
		className={ cx({ 'is-mouse': !keyboard, 'is-keyboard': keyboard }, className) }
		{ ...rest }
	/>
}

DropdownMenu.propTypes = {
	className: PropTypes.string,
	onKeyDown: PropTypes.func,
	onMouseMove: PropTypes.func,
};

export default memo(DropdownMenu);
