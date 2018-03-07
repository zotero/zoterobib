'use strict';

const React = require('react');
const PropTypes = require('prop-types');
const KeyHandler = require('react-key-handler').default;
const { KEYDOWN } = require('react-key-handler');
const Button = require('zotero-web-library/lib/component/ui/button');
const Modal = require('./modal');
const Icon = require('zotero-web-library/lib/component/ui/icon');

class MultipleChoiceDialog extends React.Component {
	render() {
		return [
			<KeyHandler
				key="key-handler"
				keyEventName={ KEYDOWN }
				keyValue="Escape"
				onKeyHandle={ () => this.props.onMultipleChoiceCancel() }
			/>,
			<Modal
				key="react-modal"
				isOpen={ this.props.isPickingItem }
				contentLabel="Select the entry to add:"
				className="multiple-choice-dialog modal modal-lg modal-centered"
				onRequestClose={ () => this.props.onMultipleChoiceCancel() }
			>
				<div className="modal-content">
					<div className="modal-header">
						<h4 className="modal-title text-truncate">
							Please select a citation from the list
						</h4>
						<Button
							className="close"
							onClick={ () => this.props.onMultipleChoiceCancel() }
						>
							<Icon type={ '24/remove' } width="24" height="24" />
						</Button>
					</div>
					<div className="modal-body">
						<ul className="results">
							{
								this.props.multipleChoiceItems.map(
									item => {
										return (
											<li
												className="result"
												key={ item.key }
												onClick={ () => this.props.onMultipleChoiceSelect([item]) }
											>
												<span className="badge badge-light"></span>
												{ item.value }
											</li>
										);
									}
								)
							}
						</ul>
					</div>
				</div>
			</Modal>
		];
	}

	static defaultProps = {
		multipleChoiceItems: []
	}

	static propTypes = {
		isPickingItem: PropTypes.bool,
		multipleChoiceItems: PropTypes.array,
		onMultipleChoiceCancel: PropTypes.func.isRequired,
		onMultipleChoiceSelect: PropTypes.func.isRequired,
	}
}

module.exports = MultipleChoiceDialog;
