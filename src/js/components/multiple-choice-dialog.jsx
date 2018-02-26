'use strict';

const React = require('react');
const PropTypes = require('prop-types');
const KeyHandler = require('react-key-handler').default;
const { KEYDOWN } = require('react-key-handler');
const Button = require('zotero-web-library/lib/component/ui/button');
const Modal = require('./modal');

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
				className="multiple-choice-dialog modal"
				overlayClassName="modal-backdrop"
				onRequestClose={ () => this.props.onMultipleChoiceCancel() }
				appElement={ document.querySelector('main') }
				shouldFocusAfterRender={ false }
			>

				<h1 className="title">
					Please select a citation from the list
				</h1>
				<div className="scroll-container">
					<ul>
						{
							this.props.multipleChoiceItems.map(
								item => {
									return (
										<li
											className="item"
											key={ item.key }
											onClick={ () => this.props.onMultipleChoiceSelect([item]) }
										>
											{ item.value }
										</li>
									);
								}
							)
						}
					</ul>
				</div>
				<div className="buttons">
					<Button onClick={ () => this.props.onMultipleChoiceCancel() }>
						Cancel
					</Button>
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
