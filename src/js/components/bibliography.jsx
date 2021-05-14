import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import { default as KeyHandler } from 'react-key-handler';
import { KEYDOWN } from 'react-key-handler';
import { default as Dropdown } from 'reactstrap/lib/Dropdown';
import { default as DropdownToggle } from 'reactstrap/lib/DropdownToggle';
import { default as DropdownMenu } from 'reactstrap/lib/DropdownMenu';
import { default as DropdownItem } from 'reactstrap/lib/DropdownItem';
import Button from './ui/button';
import Icon from './ui/icon';
import { noop } from '../utils';
import formatBib from '../cite';
// import { getHtmlNodeFromBibliography, makeBibliographyContentIterator } from '../utils' ;


const KeyHandlers = ({ onKeyHandle }) => {
	return (
		<React.Fragment>
			<KeyHandler
				key="key-handler-enter"
				keyEventName={ KEYDOWN }
				keyValue="Enter"
				onKeyHandle={ onKeyHandle }
			/>
			<KeyHandler
				key="key-handler-space"
				keyEventName={ KEYDOWN }
				keyValue=" "
				onKeyHandle={ onKeyHandle }
			/>
		</React.Fragment>
	);
}

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

const Bibliography = props => {
	const [clipboardConfirmations, setClipboardConfirmations] = useState([]);
	const [dropdownsOpen, setDropdownsOpen] = useState([]);
	const [focusedItem, setFocusedItem] = useState(null);

	const { isReadOnly, items, bibliographyItems, bibliographyMeta, onCitationCopyDialogOpen } = props;

	const bibliographyRendered = formatBib([
		{
			bibstart: bibliographyMeta.formatMeta.markupPre,
			bibend: bibliographyMeta.formatMeta.markupPost,
			hangingindent: bibliographyMeta.hangingIndent,
			maxoffset: bibliographyMeta.maxOffset,
			entryspacing: bibliographyMeta.entrySpacing,
			linespacing: bibliographyMeta.lineSpacing,
			'second-field-align': bibliographyMeta.secondFieldAlign
		},
		bibliographyItems.map((renderedItem, index) => (
			`<div className="csl-entry">${renderedItem.value}</div>`
		)).join('')
	]);


	const handleEditCitation = useCallback((itemId, ev) => {
		// let selection = window.getSelection();
		// if(selection.toString().length) {
		// 	try {
		// 		if(ev.target.closest('.citation') === selection.anchorNode.parentNode.closest('.citation')) {
		// 			return;
		// 		}
		// 	} catch(_) {
		// 		// selection.anchorNode.parentNode might fail in which case we open the editor
		// 	}
		// }
		// if(!this.props.isReadOnly) {
		// 	this.props.onEditorOpen(itemId);
		// }
	}, []);

	const handleDeleteCitation = useCallback((itemId, ev) => {
		// ev.stopPropagation();
		// this.props.onDeleteEntry(itemId);
	}, []);

	const handleFocus = useCallback((itemId) => {
		// this.setState({
		// 	focusedItem: itemId
		// });
	}, []);

	const handleKeyboard = useCallback((ev) => {
		// if(document.activeElement.className == 'citation' && this.state.focusedItem) {
		// 	this.props.onEditorOpen(this.state.focusedItem);
		// 	ev.preventDefault();
		// }
	}, []);

	const handleToggleDropdown = useCallback((itemId, ev) => {
		// const isOpen = this.state.dropdownsOpen.includes(itemId);
		// const dropdownsOpen = isOpen ?
		// 	this.state.dropdownsOpen.filter(i => i !== itemId) :
		// 	[ ...this.state.dropdownsOpen, itemId];

		// this.setState({ dropdownsOpen });
		// ev.preventDefault();
		// ev.stopPropagation();
	}, []);

	const handleCopyCitationDialogOpen = useCallback(ev => {
		ev.stopPropagation();
		ev.preventDefault();
		console.log(ev.currentTarget, ev);
		onCitationCopyDialogOpen(ev.currentTarget.closest('[data-key]').dataset.key);
	}, [onCitationCopyDialogOpen]);


	if(bibliographyItems.length === 0) {
		return null;
	}

	return (
		<React.Fragment>
			<KeyHandlers onKeyHandle={ handleKeyboard } />
			{ isReadOnly ? (
				<React.Fragment>
					<div className="bibliography read-only" dangerouslySetInnerHTML={ { __html: bibliographyRendered } } />
					{ bibliographyItems.map((_renderedItem, index) => (
					<script key={ items[index].key } type="application/vnd.zotero.data+json">
							{ JSON.stringify(items[index]) }
					</script>
					)) }
				</React.Fragment>
			) : (
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
							onCopyCitationDialogOpen = { handleCopyCitationDialogOpen }
							onDeleteCitation = { noop }
							onEditCitation = { noop }
							onFocus = { noop }
							onToggleDropdown = { noop }
						/>
					)) }
				</ul>
			)}
		</React.Fragment>
	);
}


export default Bibliography;
