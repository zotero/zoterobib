'use strict';

import React from 'react';
import Icon from './icon';

class Spinner extends React.Component {
	render() {
		return <Icon role="progressbar" type="16/spin" width="16" height="16"/>;
	}
}

export default Spinner;
