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
		if(!this.props.isReadOnly) {
			this.props.onEditorOpen(itemId);
		}
	}

	handleDeleteCitation(itemId, ev) {
		ev.stopPropagation();
		this.props.onDeleteEntry(itemId);
	}

	handleFocus(itemId) {
		this.setState({
			focusedItem: itemId
		});
	}

	handleKeyboard(ev) {
		if(document.activeElement.className == 'citation' && this.state.focusedItem) {
			this.props.onEditorOpen(this.state.focusedItem);
			ev.preventDefault();
		}
	}

	get keyHandlers() {
		return [
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
	}

	renderBibliographyItem(child, i) {
		let [ itemId ] = this.props.bibliography[0]['entry_ids'][i];
		let { Tag, attrs } = parseTagAndAttrsFromNode(child);
		let rawItem = this.props.items.find(i => i.key === itemId);
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
						<Button onClick={ this.handleDeleteCitation.bind(this, itemId) }>
							<Icon type={ '16/remove-sm' } width="16" height="16" />
						</Button>
					)
				}
				<script type="application/vnd.zotero.data+json">
					{ JSON.stringify(rawItem) }
				</script>
			</li>
		);
	}

	render() {
		if(this.props.bibliography.length === 0) {
			return null;
		}

		let html = formatBib(this.props.bibliography);
		let div = document.createElement('div');
		div.innerHTML = html;

		if(this.props.isReadOnly) {
			return (
				<React.Fragment>
					{ this.keyHandlers }
					<div className="bibliography read-only"
						dangerouslySetInnerHTML={ { __html: div.innerHTML } }
					/>
					{this.props.items.map(rawItem => (
						<script key={ rawItem.key } type="application/vnd.zotero.data+json">
							{ JSON.stringify(rawItem) }
						</script>
					))}
				</React.Fragment>
			);
		} else {
			return [
				...this.keyHandlers,
				<ul className="bibliography" key="bibliography">
						{
							Array.from(div.firstChild.children)
								.map(this.renderBibliographyItem.bind(this))
						}
				</ul>
			];
		}
	}

	static defaultProps = {
		bibliography: []
	}

	static propTypes = {
		bibliography: PropTypes.array,
		isReadOnly: PropTypes.bool,
		items: PropTypes.array,
		match: PropTypes.object,
		onDeleteEntry: PropTypes.func.isRequired,
		onEditorOpen:  PropTypes.func.isRequired,
	}
}


module.exports = withRouter(Bibliography);
