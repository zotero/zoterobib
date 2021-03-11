import React from 'react';
import PropTypes from 'prop-types';

import Button from './ui/button';
import IdInput from './id-input';

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

export default CiteTools;
