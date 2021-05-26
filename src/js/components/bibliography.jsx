import React, { useCallback, useState, useMemo, memo } from 'react';
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
import { formatBib, formatFallback } from '../cite';


const KeyHandlers = memo(({ onKeyHandle }) => {
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
});

KeyHandlers.displayName = 'KeyHandlers';
KeyHandlers.propTypes = { onKeyHandle: PropTypes.func };

const BibliographyItem = memo(props => {
	const { dropdownsOpen, isNoteStyle, isNumericStyle, onCopyCitationDialogOpen, onDeleteCitation,
	onEditCitation, onFocus, onToggleDropdown, rawItem, renderedItem, } = props;

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
							{ isNoteStyle ? 'Copy Note' : 'Copy Citation' }
						</DropdownItem>
					) }
					<DropdownItem
						onClick={ onEditCitation }
						className="btn"
					>
						Edit
					</DropdownItem>
					<DropdownItem
						onClick={ onDeleteCitation }
						className="btn"
					>
						Delete
					</DropdownItem>
				</DropdownMenu>
			</Dropdown>
			{ !isNumericStyle && (
				<Button
					title={ isNoteStyle ? 'Copy Note' : 'Copy Citation'}
					className={ cx('d-xs-none d-md-block btn-outline-secondary btn-copy')}
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
});

BibliographyItem.displayName = 'BibliographyItem';

BibliographyItem.propTypes = {
	dropdownsOpen: PropTypes.array,
	isNoteStyle: PropTypes.bool,
	isNumericStyle: PropTypes.bool,
	onCopyCitationDialogOpen: PropTypes.func,
	onDeleteCitation: PropTypes.func,
	onEditCitation: PropTypes.func,
	onFocus: PropTypes.func,
	onToggleDropdown: PropTypes.func,
	rawItem: PropTypes.object,
	renderedItem: PropTypes.object,
}

const Bibliography = props => {
	const [dropdownsOpen, setDropdownsOpen] = useState([]);
	const [focusedItem, setFocusedItem] = useState(null);

	const { isNoteStyle, isNumericStyle, isReadOnly, bibliography, onCitationCopyDialogOpen, onDeleteEntry, onEditorOpen,
	styleHasBibliography } = props;

	const bibliographyRendered = useMemo(() => isReadOnly ?
		styleHasBibliography ? formatBib(bibliography.items, bibliography.meta) : formatFallback(bibliography.items)
		: null, [bibliography.items, bibliography.meta, isReadOnly, styleHasBibliography]);

	const handleEditCitation = useCallback((ev) => {
		const itemId = ev.currentTarget.closest('[data-key]').dataset.key;
		const  selection = window.getSelection();

		if(selection.toString().length) {
			try {
				if(ev.target.closest('.citation') === selection.anchorNode.parentNode.closest('.citation')) {
					return;
				}
			} catch(_) {
				// selection.anchorNode.parentNode might fail in which case we open the editor
			}
		}
		if(!isReadOnly) {
			onEditorOpen(itemId);
		}
	}, [isReadOnly, onEditorOpen]);

	const handleDeleteCitation = useCallback(ev => {
		ev.stopPropagation();
		onDeleteEntry(ev.currentTarget.closest('[data-key]').dataset.key);
	}, [onDeleteEntry]);

	const handleFocus = useCallback(ev => {
		const itemId = ev.currentTarget.closest('[data-key]').dataset.key;
		setFocusedItem(itemId);
	}, []);

	const handleKeyboard = useCallback((ev) => {
		if(document.activeElement.className == 'citation' && focusedItem) {
			onEditorOpen(focusedItem);
			ev.preventDefault();
		}
	}, [focusedItem, onEditorOpen]);

	const handleToggleDropdown = useCallback(ev => {
		const itemId = ev.currentTarget.closest('[data-key]').dataset.key;
		const isOpen = dropdownsOpen.includes(itemId);
		const newDropdownsOpen = isOpen ?
			dropdownsOpen.filter(i => i !== itemId) :
			[ ...dropdownsOpen, itemId];

		setDropdownsOpen(newDropdownsOpen);

		ev.preventDefault();
		ev.stopPropagation();
	}, [dropdownsOpen]);

	const handleCopyCitationDialogOpen = useCallback(ev => {
		ev.stopPropagation();
		ev.preventDefault();
		onCitationCopyDialogOpen(ev.currentTarget.closest('[data-key]').dataset.key);
	}, [onCitationCopyDialogOpen]);


	if(bibliography.items.length === 0) {
		return null;
	}

	return (
		<React.Fragment>
			<KeyHandlers onKeyHandle={ handleKeyboard } />
			{ isReadOnly ? (
				<React.Fragment>
					<div className="bibliography read-only" dangerouslySetInnerHTML={ { __html: bibliographyRendered } } />
					{ bibliography.items.map(renderedItem => (
					<script key={ renderedItem.id } type="application/vnd.zotero.data+json">
							{ JSON.stringify(bibliography.lookup[renderedItem.id]) }
					</script>
					)) }
				</React.Fragment>
			) : (
				<ul className="bibliography" key="bibliography">
					{ bibliography.items.map(renderedItem => (
						<BibliographyItem
							key={ renderedItem.id }
							rawItem={ bibliography.lookup[renderedItem.id] }
							renderedItem={ renderedItem }
							dropdownsOpen = { dropdownsOpen }
							isNoteStyle = { isNoteStyle }
							isNumericStyle = { isNumericStyle }
							onCopyCitationDialogOpen = { handleCopyCitationDialogOpen }
							onDeleteCitation = { handleDeleteCitation }
							onEditCitation = { handleEditCitation }
							onFocus = { handleFocus }
							onToggleDropdown = { handleToggleDropdown }
						/>
					)) }
				</ul>
			)}
		</React.Fragment>
	);
}

Bibliography.propTypes = {
	bibliography: PropTypes.object,
	isNoteStyle: PropTypes.bool,
	isNumericStyle: PropTypes.bool,
	isReadOnly: PropTypes.bool,
	onCitationCopyDialogOpen: PropTypes.func,
	onDeleteEntry: PropTypes.func,
	onEditorOpen: PropTypes.func,
	styleHasBibliography: PropTypes.bool,
}


export default memo(Bibliography);
