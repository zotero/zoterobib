import cx from 'classnames';
import Dropdown from 'reactstrap/lib/Dropdown';
import DropdownItem from 'reactstrap/lib/DropdownItem';
import DropdownMenu from './ui/dropdown-menu';
import DropdownToggle from 'reactstrap/lib/DropdownToggle';
import PropTypes from 'prop-types';
import React, { useCallback, useRef, useState, useMemo, memo } from 'react';
import { useIntl, FormattedMessage } from 'react-intl';

import Button from './ui/button';
import Icon from './ui/icon';
import { formatBib, formatFallback } from '../cite';
import { isTriggerEvent } from '../common/event';
import { useDnd } from '../hooks';

const BIB_ITEM = 'BIB_ITEM';

const BibliographyItem = memo(props => {
	const { dropdownsOpen, formattedItem, isNoteStyle, isNumericStyle, onCopyCitationDialogOpen, onDeleteCitation,
		onSelectCitation, onEditCitationClick, onReorderCitations, onToggleDropdown, rawItem, } = props;
	const containerRef = useRef(null);
	const intl = useIntl();

	const onComplete = useCallback((targetNode, above, current) => {
		const targetKey = targetNode.closest('[data-key]').dataset.key;

		onReorderCitations(current.key, targetKey, above);
	}, [onReorderCitations]);

	const { onDrag, onHover, onDrop } = useDnd({
		type: BIB_ITEM,
		data: ev => ({ key: ev.currentTarget.closest('[data-key]').dataset.key }),
		ref: containerRef,
		ghostContainerSelector: '.zotero-bib-container',
		midpointOffset: 12,
		onComplete,
	});

	const copyText = isNoteStyle ?
		intl.formatMessage({ id: 'zbib.citation.copyNote' , defaultMessage: 'Copy Note' }) :
		intl.formatMessage({ id: 'zbib.citation.copyCitation', defaultMessage: 'Copy Citation' });

	return (
		<li key={ rawItem.key }
			data-dnd-candidate
			data-key={ rawItem.key }
			className="citation-container"
			onClick={ onSelectCitation }
			tabIndex={ 0 }
			onKeyDown={ onSelectCitation }
			onMouseOver={ onHover }
			onMouseOut={ onHover }
			onMouseMove={ onHover }
			onMouseUp={ onDrop }
		>
			<div className="citation" ref={containerRef}>
				<div className="drag-handle" onMouseDown={onDrag} onTouchStart={onDrag}>
					<Icon type="24/grip" width="24" height="24" />
				</div>
				<div
					data-container-key={rawItem.key}
					className="csl-entry-container"
					dangerouslySetInnerHTML={ { __html: formattedItem } }
				/>
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
					<DropdownMenu right>
						{ !isNumericStyle && (
							<DropdownItem
								onClick={ onCopyCitationDialogOpen }
								className="btn"
							>
								{ copyText }
							</DropdownItem>
						) }
						<DropdownItem
							onClick={ onEditCitationClick }
							className="btn"
						>
							<FormattedMessage id="zbib.general.edit" defaultMessage="Edit" />
						</DropdownItem>
						<DropdownItem
							onClick={ onDeleteCitation }
							className="btn"
						>
							<FormattedMessage id="zbib.general.delete" defaultMessage="Delete" />
						</DropdownItem>
					</DropdownMenu>
				</Dropdown>
				{ !isNumericStyle && (
					<Button
						icon
						title={ copyText }
						className={ cx('d-xs-none d-md-block btn-outline-secondary btn-copy')}
						onClick={ onCopyCitationDialogOpen }
					>
						<Icon type={ '16/copy' } width="16" height="16" />
					</Button>
				) }
				<Button
					icon
					title="Delete Entry"
					className="btn-outline-secondary btn-remove"
					onClick={ onDeleteCitation }
				>
					<Icon type={ '16/remove-sm' } width="16" height="16" />
				</Button>
				<script type="application/vnd.zotero.data+json">
					{ JSON.stringify(rawItem) }
				</script>
			</div>
		</li>
	);
});

BibliographyItem.displayName = 'BibliographyItem';

BibliographyItem.propTypes = {
	dropdownsOpen: PropTypes.array,
	formattedItem: PropTypes.string,
	isNoteStyle: PropTypes.bool,
	isNumericStyle: PropTypes.bool,
	onCopyCitationDialogOpen: PropTypes.func,
	onDeleteCitation: PropTypes.func,
	onEditCitationClick: PropTypes.func,
	onSelectCitation: PropTypes.func,
	onToggleDropdown: PropTypes.func,
	rawItem: PropTypes.object,
}

const Bibliography = props => {
	const [dropdownsOpen, setDropdownsOpen] = useState([]);

	const { isNoteStyle, isNumericStyle, isReadOnly, bibliography, onCitationCopyDialogOpen, onDeleteEntry, onEditorOpen,
		onReorderCitations, styleHasBibliography } = props;

	const bibliographyRendered = useMemo(() => {
			return (styleHasBibliography && bibliography.meta) ?
				formatBib(bibliography.items, bibliography.meta) :
				formatFallback(bibliography.items)
		}, [bibliography, styleHasBibliography]
	);

	const bibliographyRenderedNodes = useMemo(() => {
		const div = document.createElement('div');
		div.innerHTML = bibliographyRendered;
		div.querySelectorAll('a').forEach(link => {
			link.setAttribute('rel', 'nofollow');
		});
		return div.firstChild.children;
	}, [bibliographyRendered]);

	const handleSelectCitation = useCallback((ev) => {
		const itemId = ev.currentTarget.closest('[data-key]').dataset.key;
		const selection = window.getSelection();

		// ignore keydown events on buttons
		if(ev.type === 'keydown' && ev.currentTarget !== ev.target) {
			return;
		}

		// ignore click event fired when selecting text
		if(ev.type === 'click' && selection.toString().length) {
			try {
				if(ev.target.closest('.citation') === selection.anchorNode.parentNode.closest('.citation')) {
					return;
				}
			} catch(_) {
				// selection.anchorNode.parentNode might fail in which case we open the editor
			}
		}
		if(!isReadOnly && itemId && isTriggerEvent(ev)) {
			onEditorOpen(itemId);
		}
	}, [isReadOnly, onEditorOpen]);

	const handleEditCitationClick = useCallback((ev) => {
		const itemId = ev.currentTarget.closest('[data-key]').dataset.key;
		onEditorOpen(itemId);
	}, [onEditorOpen]);

	const handleDeleteCitation = useCallback(ev => {
		ev.stopPropagation();
		onDeleteEntry(ev.currentTarget.closest('[data-key]').dataset.key);
	}, [onDeleteEntry]);


	const handleToggleDropdown = useCallback(ev => {
		var newDropdownsOpen;
		try {
			const itemId = ev.currentTarget.closest('[data-key]').dataset.key
			newDropdownsOpen = dropdownsOpen.includes(itemId) ?
				dropdownsOpen.filter(i => i !== itemId) :
				[ ...dropdownsOpen, itemId];
			ev.preventDefault();
			ev.stopPropagation();
		} catch(_) {
			newDropdownsOpen = [];
		}

		setDropdownsOpen(newDropdownsOpen);
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
			{ isReadOnly ? (
				<React.Fragment>
					<div
						suppressHydrationWarning={ true }
						className="bibliography read-only"
						dangerouslySetInnerHTML={ { __html: bibliographyRendered } }
					/>
					{ bibliography.items.map(renderedItem => (
					<script
						suppressHydrationWarning={ true }
						key={ renderedItem.id }
						type="application/vnd.zotero.data+json">
							{ JSON.stringify(bibliography.lookup[renderedItem.id]) }
					</script>
					)) }
				</React.Fragment>
			) : (
				<ul className="bibliography" key="bibliography">
					{ bibliography.items.map((renderedItem, index) => (
						<BibliographyItem
							dropdownsOpen = { dropdownsOpen }
							formattedItem={ bibliographyRenderedNodes[index]?.innerHTML || renderedItem.value }
							isNoteStyle = { isNoteStyle }
							isNumericStyle = { isNumericStyle }
							key={ renderedItem.id }
							onCopyCitationDialogOpen = { handleCopyCitationDialogOpen }
							onDeleteCitation = { handleDeleteCitation }
							onEditCitationClick = { handleEditCitationClick }
							onReorderCitations={ onReorderCitations }
							onSelectCitation = { handleSelectCitation }
							onToggleDropdown = { handleToggleDropdown }
							rawItem={ bibliography.lookup[renderedItem.id] }
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
