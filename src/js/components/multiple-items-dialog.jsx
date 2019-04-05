'use strict';

const React = require('react');
const PropTypes = require('prop-types');
const KeyHandler = require('react-key-handler').default;
const { KEYDOWN } = require('react-key-handler');
const Button = require('zotero-web-library/src/js/component/ui/button');
const Modal = require('./modal');
const Icon = require('zotero-web-library/src/js/component/ui/icon');
const { getHtmlNodeFromBibliography, makeBibliographyContentIterator } = require('../utils');

class MultipleItemsDialog extends React.Component {
	handleFocus = ev => {
		this.focusedItem = ev.currentTarget.dataset.key;
	}

	handleKeyboardConfirm = () => {
		if(this.focusedItem) {
			this.props.OnMutipleItemsSelect(this.focusedItem);
		}
	}

	handleAdd = ev => {
		this.props.OnMutipleItemsSelect(ev.currentTarget.dataset.key);
	}

	handleCancel = () => {
		this.props.OnMutipleItemsCancel();
	}

	renderItem(item, content) {
		return (
			<li key={ item.key }
				data-key={ item.key }
				className="result"
				onFocus={ this.handleFocus }
				onClick={ this.handleAdd }
				tabIndex={ 0 }
			>
				<div className="csl-entry-container">
					{ content }
				</div>
			</li>
		);
	}

	render() {
		const { isAddingMultiple, multipleItems } = this.props;
		const bibliographyProcessedContent = [];

		if(isAddingMultiple) {
			const div = getHtmlNodeFromBibliography(multipleItems);
			const bibliographyContentIterator = makeBibliographyContentIterator(
				multipleItems, div
			);

			for(var [item, content] of bibliographyContentIterator) {
				bibliographyProcessedContent.push(
					this.renderItem(item, content)
				);
			}
		}

		return (
			<Modal
				isOpen={ isAddingMultiple }
				contentLabel="Select the entry to add:"
				className="multiple-choice-dialog modal modal-lg"
				onRequestClose={ this.handleCancel }
			>
				<KeyHandler
					keyEventName={ KEYDOWN }
					keyValue="Escape"
					onKeyHandle={ this.handleCancel }
				/>
				<KeyHandler
					keyEventName={ KEYDOWN }
					keyValue="Enter"
					onKeyHandle={ this.handleKeyboardConfirm }
				/>
				<div className="modal-content" tabIndex={ -1 }>
					<div className="modal-header">
						<h4 className="modal-title text-truncate">
							Please select a citation from the list
						</h4>
						<Button
							className="close"
							onClick={ this.handleCancel.bind(this) }
						>
							<Icon type={ '24/remove' } width="24" height="24" />
						</Button>
					</div>
					<div className="modal-body">
						<ul className="results">
							{ bibliographyProcessedContent }
						</ul>
					</div>
				</div>
			</Modal>
		);
	}

	static defaultProps = {
		multipleChoiceItems: []
	}

	static propTypes = {
		isAddingMultiple: PropTypes.bool,
		multipleItems: PropTypes.object,
		multipleChoiceItems: PropTypes.array,
		OnMutipleItemsCancel: PropTypes.func.isRequired,
		OnMutipleItemsSelect: PropTypes.func.isRequired,
	}
}

module.exports = MultipleItemsDialog;
