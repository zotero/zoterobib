'use strict';

const React = require('react');
const PropTypes = require('prop-types');
const KeyHandler = require('react-key-handler').default;
const { KEYDOWN } = require('react-key-handler');
const Button = require('zotero-web-library/lib/component/ui/button');
const Modal = require('./modal');
const Icon = require('zotero-web-library/lib/component/ui/icon');

class MultipleChoiceDialog extends React.Component {
	renderItem(item) {
		let badge = null;
		let title = item.value.title;
		if(item.source === 'url') {
			let badges = [];
			let matches = title.match(/^\[([A-Z]*)\]/);
			while(matches) {
				let badge = matches[1]
					.split(' ')
					.map(w => w.substring(0, 1).toUpperCase() + w.substring(1).toLowerCase())
					.join(' ');
				badges.push(badge);
				title = title.substring(matches[0].length);
				matches = title.match(/^\[([A-Z]*)\]/);
			}
			badges = [ ...new Set(badges) ].filter(b => b.length > 1);
			if(badges.length) {
				badge = badges[0];
			}
		} else if(item.value.itemType) {
			badge = item.value.itemType;
		}
		return (
			<li
				className="result"
				key={ item.key }
				onClick={ () => this.props.onMultipleChoiceSelect(item) }
			>
				{ badge && <span key={badge} className="badge badge-light">{ badge }</span> }
				{ title }
				{ item.value.description && (
					<small>
						{item.value.description}
					</small>
				)}
			</li>
		);
	}

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
				<div className="modal-content" tabIndex={ -1 }>
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
							{ this.props.multipleChoiceItems.map(this.renderItem.bind(this)) }
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
