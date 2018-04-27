'use strict';

const React = require('react');
const PropTypes = require('prop-types');
const cx = require('classnames');
const { withRouter } = require('react-router-dom');
const KeyHandler = require('react-key-handler').default;
const { KEYDOWN } = require('react-key-handler');
const Dropdown = require('reactstrap/lib/Dropdown').default;
const DropdownToggle = require('reactstrap/lib/DropdownToggle').default;
const DropdownMenu = require('reactstrap/lib/DropdownMenu').default;
const DropdownItem = require('reactstrap/lib/DropdownItem').default;
const Button = require('zotero-web-library/lib/component/ui/button');
const Icon = require('zotero-web-library/lib/component/ui/icon');
const formatBib = require('../cite');
const { parseTagAndAttrsFromNode } =require('../utils') ;

class Bibliography extends React.PureComponent {
	state = {
		clipboardConfirmations: [],
		dropdownsOpen: [],
		focusedItem: null
	}

	constructor(props) {
		super(props);
		this.timeouts = {};
	}

	componentWillUnmount() {
		Object.values(this.timeouts).forEach(t => clearTimeout(t));
		this.timeouts = {};
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

	handleCitationCopy(itemId, ev) {
		ev.stopPropagation();
		this.props.onCitationCopy(itemId);
		this.setState({
			clipboardConfirmations: [ ...this.state.clipboardConfirmations, itemId ]
		});
		this.timeouts[itemId] = setTimeout(() => {
			delete this.timeouts[itemId];
			this.setState({
				clipboardConfirmations: this.state.clipboardConfirmations.filter(
					c => c !== itemId
				)
			});
		}, 1000);
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

	handleToggleDropdown(itemId, ev) {
		const isOpen = this.state.dropdownsOpen.includes(itemId);
		const dropdownsOpen = isOpen ?
			this.state.dropdownsOpen.filter(i => i !== itemId) :
			[ ...this.state.dropdownsOpen, itemId];

		this.setState({ dropdownsOpen });
		ev.preventDefault();
		ev.stopPropagation();
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
				onClick={ ev => this.handleEditCitation(rawItem.key, ev) }
				tabIndex={ 0 }
			>
				<div className="csl-entry-container">
					{ content }
				</div>
				<Dropdown
					isOpen={ this.state.dropdownsOpen.includes(rawItem.key) }
					toggle={ this.handleToggleDropdown.bind(this, rawItem.key) }
					className="btn-group d-md-none"
				>
					<DropdownToggle>
						...
					</DropdownToggle>
					<DropdownMenu className="dropdown-menu">
						<DropdownItem
							onClick={ this.handleCitationCopy.bind(this, rawItem.key) }
							className="btn"
						>
							<span className={ cx('inline-feedback', {
								'active': this.state.clipboardConfirmations.includes(rawItem.key)
							}) }>
								<span
								className="default-text"
								aria-hidden={ !this.state.clipboardConfirmations.includes(rawItem.key) }>
									Copy
								</span>
								<span
								className="shorter feedback"
								aria-hidden={ this.state.clipboardConfirmations.includes(rawItem.key) }>
									Copied!
								</span>
							</span>
						</DropdownItem>
						<DropdownItem
							onClick={ this.handleEditCitation.bind(this, rawItem.key) }
							className="btn"
						>
							Edit
						</DropdownItem>
						<DropdownItem
							onClick={ this.handleDeleteCitation.bind(this, rawItem.key) }
							className="btn"
						>
							Delete
						</DropdownItem>
					</DropdownMenu>
				</Dropdown>
				{ this.props.isAuthorStyle && (
					<Button
						className={ cx('d-xs-none d-md-block', { success: this.state.clipboardConfirmations.includes(rawItem.key) })}
						onClick={ this.handleCitationCopy.bind(this, rawItem.key) }>
						<Icon type={ '16/copy' } width="16" height="16" />
						<Icon type={ '16/tick' } width="16" height="16" />
					</Button>
				) }
				<Button
					className="d-xs-none d-md-block"
					onClick={ this.handleDeleteCitation.bind(this, rawItem.key) }
				>
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
		isAuthorStyle: PropTypes.bool,
		isReadOnly: PropTypes.bool,
		items: PropTypes.array,
		match: PropTypes.object,
		onCitationCopy:  PropTypes.func.isRequired,
		onDeleteEntry: PropTypes.func.isRequired,
		onEditorOpen:  PropTypes.func.isRequired,
	}
}


module.exports = withRouter(Bibliography);
