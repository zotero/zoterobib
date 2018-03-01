'use strict';

const React = require('react');
const PropTypes = require('prop-types');
const { withRouter } = require('react-router-dom');
const KeyHandler = require('react-key-handler').default;
const { KEYDOWN } = require('react-key-handler');

const Button = require('zotero-web-library/lib/component/ui/button');
const Icon = require('zotero-web-library/lib/component/ui/icon');
const formatBib = require('../cite');
const { parseTagAndAttrsFromNode } =require('../utils') ;

class Bibliography extends React.PureComponent {
	state = {
		focusedItem: null
	}

	handleEditCitation(itemId) {
		this.props.onEditorOpen(itemId);
	}

	handleDeleteCitation(itemId) {
		this.props.onDeleteEntry(itemId);
	}

	handleFocus(itemId) {
		this.setState({
			focusedItem: itemId
		});
	}

	handleKeyboard(ev) {
		if(this.state.focusedItem) {
			this.props.onEditorOpen(this.state.focusedItem);
			ev.preventDefault();
		}
	}

	render() {
		if(this.props.bibliography.length === 0) {
			return null;
		}

		let html = formatBib(this.props.bibliography);
		let div = document.createElement('div');
		div.innerHTML = html;

		let keyHandlers = [
			<KeyHandler
				key="key-handler-enter"
				keyEventName={ KEYDOWN }
				keyValue="Enter"
				onKeyHandle={ this.handleKeyboard.bind(this) }
			/>,
			<KeyHandler
				key="key-handler-space"
				keyEventName={ KEYDOWN }
				keyValue=" "
				onKeyHandle={ this.handleKeyboard.bind(this) }
			/>,
		];
		return [
			...keyHandlers,
			<ul className="bibliography" key="bibliography">
					{
						Array.from(div.firstChild.children).map((child, i) => {
							let [ itemId ] = this.props.bibliography[0]['entry_ids'][i];
							let { Tag, attrs } = parseTagAndAttrsFromNode(child);
							return (
								<li key={ itemId }
									className="citation"
									onFocus={ this.handleFocus.bind(this, itemId) }
									onClick={ () => this.handleEditCitation(itemId) }
									tabIndex={ 0 }
								>
									<div className="csl-entry-container">
										<Tag
											dangerouslySetInnerHTML={ { __html: child.innerHTML } }
											{ ...attrs }
										/>
									</div>
									{
										!this.props.isReadOnly && (
											<Button onClick={ () => this.handleDeleteCitation(itemId) }>
												<Icon type={ '16/remove-sm' } width="16" height="16" />
											</Button>
										)
									}
								</li>
							);
						})
					}
			</ul>
		];
	}

	static defaultProps = {
		bibliography: []
	}

	static propTypes = {
		bibliography: PropTypes.array,
		isReadOnly: PropTypes.bool,
		match: PropTypes.object,
		onDeleteEntry: PropTypes.func.isRequired,
		onEditorOpen:  PropTypes.func.isRequired,
	}
}


module.exports = withRouter(Bibliography);
