import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import { withRouter } from 'react-router-dom';
import { default as KeyHandler } from 'react-key-handler';
import { KEYDOWN } from 'react-key-handler';
import { default as Dropdown } from 'reactstrap/lib/Dropdown';
import { default as DropdownToggle } from 'reactstrap/lib/DropdownToggle';
import { default as DropdownMenu } from 'reactstrap/lib/DropdownMenu';
import { default as DropdownItem } from 'reactstrap/lib/DropdownItem';
import Button from './ui/button';
import Icon from './ui/icon';
import { noop } from '../utils';
// import { getHtmlNodeFromBibliography, makeBibliographyContentIterator } from '../utils' ;


const BibliographyItem = props => {
	const {
		clipboardConfirmations,
		dropdownsOpen,
		isNoteStyle,
		isNumericStyle,
		onCopyCitationDialogOpen, //@TODO
		onDeleteCitation,
		onEditCitation, //@TODO
		onFocus, //@TODO
		onToggleDropdown, //@TODO,
		rawItem,
		renderedItem,
	} = props;

	return (
		<li key={ rawItem.key }
			data-key={ rawItem.key }
			className="citation"
			onFocus={ onFocus }
			onClick={ onEditCitation }
			tabIndex={ 0 }
		>
			<div className="csl-entry-container" dangerouslySetInnerHTML={ { __html: renderedItem.value } } />
			<Dropdown
				isOpen={ dropdownsOpen.includes(rawItem.key) }
				toggle={ onToggleDropdown }
				className="d-md-none"
			>
				<DropdownToggle
					color={ null }
					className="btn-icon dropdown-toggle"
				>
					<Icon type={ '28/dots' } width="28" height="28" />
				</DropdownToggle>
				<DropdownMenu right className="dropdown-menu">
					{ !isNumericStyle && (
						<DropdownItem
							onClick={ onCopyCitationDialogOpen }
							className="btn"
						>
							<span className={ cx('inline-feedback', {
								'active': clipboardConfirmations.includes(rawItem.key)
							}) }>
								<span
								className="default-text"
								aria-hidden={ !clipboardConfirmations.includes(rawItem.key) }>
									{ isNoteStyle ? 'Copy Note' : 'Copy Citation'}
								</span>
								<span
								className="shorter feedback"
								aria-hidden={ clipboardConfirmations.includes(rawItem.key) }>
									Copied!
								</span>
							</span>
						</DropdownItem>
					) }
					<DropdownItem
						onClick={ onEditCitation }
						className="btn"
					>
						Edit
					</DropdownItem>
					<DropdownItem
						onClick={ onEditCitation }
						className="btn"
					>
						Delete
					</DropdownItem>
				</DropdownMenu>
			</Dropdown>
			{ !isNumericStyle && (
				<Button
					title={ isNoteStyle ? 'Copy Note' : 'Copy Citation'}
					className={ cx('d-xs-none d-md-block btn-outline-secondary btn-copy', { success: clipboardConfirmations.includes(rawItem.key) })}
					onClick={ onCopyCitationDialogOpen }
				>
					<Icon type={ '16/copy' } width="16" height="16" />
				</Button>
			) }
			<Button
				title="Delete Entry"
				className="btn-outline-secondary btn-remove"
				onClick={ onDeleteCitation }
			>
				<Icon type={ '16/remove-sm' } width="16" height="16" />
			</Button>
			<script type="application/vnd.zotero.data+json">
				{ JSON.stringify(rawItem) }
			</script>
		</li>
	);
}

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

	handleCopyCitationDialogOpen(itemId, ev) {
		ev.stopPropagation();
		ev.preventDefault();
		this.props.onCitationCopyDialogOpen(itemId);
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

	render() {
		const { items, bibliographyItems, bibliographyMeta } = this.props;

		return (
			<ul className="bibliography" key="bibliography">
				{ bibliographyItems.map((renderedItem, index) => (
					<BibliographyItem
						key={ items[index].key }
						rawItem={ items[index] }
						renderedItem={ renderedItem }
						clipboardConfirmations= { [] /*TODO*/ }
						dropdownsOpen = { []  /*TODO*/ }
						isNoteStyle = { false /*TODO*/ }
						isNumericStyle = { false /*TODO*/ }
						onCopyCitationDialogOpen = { noop }
						onDeleteCitation = { noop }
						onEditCitation = { noop }
						onFocus = { noop }
						onToggleDropdown = { noop }
					/>
				)) }
			</ul>
		);



		// if(bibliography.items.length === 0) {
		// 	return null;
		// }

		// const div = getHtmlNodeFromBibliography(bibliography);

		// @TODO: reimplement
		// if(this.props.isReadOnly) {
		// 	return (
		// 		<React.Fragment>
		// 			{ this.keyHandlers }
		// 			<div className="bibliography read-only"
		// 				dangerouslySetInnerHTML={ { __html: div.innerHTML } }
		// 			/>
		// 			{bibliography.items.map(rawItem => (
		// 				<script key={ rawItem.key } type="application/vnd.zotero.data+json">
		// 					{ JSON.stringify(rawItem) }
		// 				</script>
		// 			))}
		// 		</React.Fragment>
		// 	);
		// } else {
		// 	const bibliographyContentIterator = makeBibliographyContentIterator(
		// 		bibliography, div
		// 	);
		// 	const bibliographyProcessedContent = [];
		// 	for(var [item, content] of bibliographyContentIterator) {
		// 		bibliographyProcessedContent.push(
		// 			this.renderBibliographyItem(item, content)
		// 		);
		// 	}

		// 	return [
		// 		...this.keyHandlers,
		// 		<ul className="bibliography" key="bibliography">
		// 			{ 	 }
		// 		</ul>
		// 	];
		// }
	}

	static defaultProps = {
		bibliography: []
	}

	static propTypes = {
		bibliography: PropTypes.object,
		isNoteStyle: PropTypes.bool,
		isNumericStyle: PropTypes.bool,
		isReadOnly: PropTypes.bool,
		items: PropTypes.array,
		match: PropTypes.object,
		onCitationCopyDialogOpen:  PropTypes.func.isRequired,
		onDeleteEntry: PropTypes.func.isRequired,
		onEditorOpen:  PropTypes.func.isRequired,
	}
}


export default withRouter(Bibliography);
