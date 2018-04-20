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

	handleEditCitation(itemId, ev) {
		let selection = window.getSelection();
		if(selection.toString().length) {
			try {
				if(ev.target.closest('.citation') === selection.anchorNode.parentNode.closest('.citation')) {
					return;
				}
			} catch(_) {
				// selection.anchorNode.parentNode might fail in which case we open the editor
			}
		}
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

	renderBibliographyItem(rawItem, content) {
		return (
			<li key={ rawItem.key }
				className="citation"
				onFocus={ this.handleFocus.bind(this, rawItem.key) }
				onMouseUp={ ev => this.handleEditCitation(rawItem.key, ev) }
				tabIndex={ 0 }
			>
				<div className="csl-entry-container">
					{ content }
				</div>
				<Button onClick={ this.handleDeleteCitation.bind(this, rawItem.key) }>
					<Icon type={ '16/remove-sm' } width="16" height="16" />
				</Button>
				<script type="application/vnd.zotero.data+json">
					{ JSON.stringify(rawItem) }
				</script>
			</li>
		);
	}

	render() {
		const { citations, bibliography, isFallback } = this.props.bibliography;
		if(this.props.items.length === 0) {
			return null;
		}

		let html = isFallback ?
			`<ol><li>${citations.join('</li><li>')}</li></ol>` :
			formatBib(bibliography);
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
							isFallback ? this.props.items.map((item, i) => {
								return this.renderBibliographyItem(
									item,
									<span dangerouslySetInnerHTML={ { __html: citations[i] } } />
								);
							}) : Array.from(div.firstChild.children).map((child, i) => {
								let [ itemId ] = bibliography[0]['entry_ids'][i];
								let { Tag, attrs } = parseTagAndAttrsFromNode(child);
								let item = this.props.items.find(i => i.key === itemId);

								return this.renderBibliographyItem(
									item,
									<Tag
										dangerouslySetInnerHTML={ { __html: child.innerHTML } }
										{ ...attrs }
									/>
								);
							})
						}
				</ul>
			];
		}
	}

	static defaultProps = {
		bibliography: []
	}

	static propTypes = {
		bibliography: PropTypes.object,
		isReadOnly: PropTypes.bool,
		items: PropTypes.array,
		match: PropTypes.object,
		onDeleteEntry: PropTypes.func.isRequired,
		onEditorOpen:  PropTypes.func.isRequired,
	}
}


module.exports = withRouter(Bibliography);
