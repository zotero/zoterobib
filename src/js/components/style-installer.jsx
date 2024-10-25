import cx from 'classnames';
import PropTypes from 'prop-types';
import { useCallback, useEffect, useReducer, useRef, useId, memo } from 'react';
import { useIntl, FormattedMessage } from 'react-intl';
import { Button, Icon, Spinner } from 'web-common/components';
import { useFocusManager, usePrevious } from 'web-common/hooks';

import Input from './form/input';
import Modal from './modal';
import SearchWorker from 'web-worker:../style-search.worker.js';
import { isTriggerEvent } from '../../../modules/web-common/utils/event';

const searchWorker = new SearchWorker();

const READY = 'READY';
const FILTER_UPDATE = 'FILTER_UPDATE';
const COMPLETE_SEARCH = 'COMPLETE_SEARCH';
const BEGIN_SEARCH = 'BEGIN_SEARCH';

const reducer = (state, action) => {
	if(action.type === READY) {
		return { ...state, isReady: true };
	} else if(action.type === COMPLETE_SEARCH) {
		return { ...state, items: action.items, isSearching: false }
	} else if(action.type === FILTER_UPDATE) {
		return { ...state, filter: action.filter }
	} else if(action.type === BEGIN_SEARCH) {
		return { ...state, filter: action.filter, isSearching: true, selectedIndex: null }
	}
	return state;
}

const StyleItem = memo(props => {
	const { name, title, isCore = false, onDelete, onInstall, isActive, isInstalled, isSelected } = props;
	const id = useId();
	const styleItemRef = useRef(null);
	const { focusNext, focusPrev, receiveFocus, receiveBlur } = useFocusManager(styleItemRef,
		{ isCarousel: false, targetTabIndex: -3, isFocusable: true });

		const handleKeyDown = useCallback(ev => {
		if(ev.key === 'ArrowRight') {
			focusNext(ev, { useCurrentTarget: false });
		} else if(ev.key === 'ArrowLeft') {
			focusPrev(ev, { useCurrentTarget: false });
		} else if(isTriggerEvent(ev)) {
			if(isActive || isCore) {
				return;
			}
			if(isInstalled) {
				onDelete(ev);
			} else {
				onInstall(ev);
			}
		}
	}, [focusNext, focusPrev, isActive, isCore, isInstalled, onDelete, onInstall]);

	return (
		<li
			aria-labelledby={ id }
			data-style={ name }
			className={ cx('style', { selected: isSelected }) }
			tabIndex={-2}
			ref={ styleItemRef }
			onFocus={ receiveFocus }
			onBlur={ receiveBlur }
			onKeyDown={ handleKeyDown }
		>
			<div id={ id } className="style-title">
				{ title }
			</div>
			{
				isActive ? (
					<Button className="btn btn-sm btn-outline-light" disabled>
						<FormattedMessage id="zbib.styleInstaller.active" defaultMessage="Active" />
					</Button>
				) : isCore ? (
					<Button className="btn btn-sm btn-outline-light" disabled>
						<FormattedMessage id="zbib.styleInstaller.default" defaultMessage="Default" />
					</Button>
				) : isInstalled ? (
					<Button
						tabIndex={-3}
						className="btn btn-sm btn-outline-primary"
						onClick={ onDelete }>
						<FormattedMessage id="zbib.styleInstaller.remove" defaultMessage="Remove" />
					</Button>
				) : (
					<Button
						tabIndex={-3}
						className="btn btn-sm btn-outline-secondary"
						onClick={ onInstall }>
						<FormattedMessage id="zbib.styleInstaller.add" defaultMessage="Add" />
					</Button>
				)
			}
		</li>
	);
});

StyleItem.displayName = 'StyleItem';

StyleItem.propTypes = {
	isActive: PropTypes.bool,
	isCore: PropTypes.bool,
	isInstalled: PropTypes.bool,
	name: PropTypes.string,
	onDelete: PropTypes.func,
	onInstall: PropTypes.func,
	title: PropTypes.string,
	isSelected: PropTypes.bool,
}

const StyleInstaller = props => {
	const { activeDialog, citationStyle: activeCitationStyle, citationStyles, isStylesDataLoading,
	onStyleInstallerSelect, onStyleInstallerDelete, onStyleInstallerCancel, stylesData } = props;
	const wasStylesDataLoading = usePrevious(isStylesDataLoading);
	const timeout = useRef(null);
	const [state, dispatch] = useReducer(reducer, {
		filter: '',
		isReady: false,
		isSearching: false,
		items: [],
		selectedIndex: null,
	});
	const intl = useIntl();
	const listRef = useRef(null);
	const { focusNext, focusPrev, focusBySelector, receiveFocus, receiveBlur } = useFocusManager(
		listRef, { isCarousel: false }
	);
	const skipNextFocusRef = useRef(false); // required for modal's scopedTab (focus trap) to work correctly


	const isOpen = activeDialog === 'STYLE_INSTALLER';

	const handleWorkerMessage = useCallback(event => {
		const [messageKind, payload] = event.data;
		switch(messageKind) {
			case 'READY':
				dispatch({ type: READY });
			break;
			case 'FILTER_COMPLETE':
				dispatch({ type: COMPLETE_SEARCH, items: payload });
			break;
		}
	}, []);

	const handleFilterChange = useCallback((newValue) => {
		if(timeout.current) {
			clearTimeout(timeout.current);
		}
		dispatch({ type: FILTER_UPDATE, filter: newValue })

		if(newValue.length > 2) {
			timeout.current = setTimeout(() => {
				dispatch({ type: BEGIN_SEARCH, filter: newValue });
				searchWorker.postMessage(['FILTER', newValue]);
			}, 250);
		}
	}, []);

	const handleCancel = useCallback(() => {
		clearTimeout(timeout.current);
		timeout.current = null;
		dispatch({ type: FILTER_UPDATE, filter: '' });
		onStyleInstallerCancel();
	}, [onStyleInstallerCancel]);

	const handleInstall = useCallback(ev => {
		const styleName = ev.currentTarget.closest('[data-style]').dataset.style;
		const style = state.items.find(cs => cs.name === styleName);
		ev.stopPropagation();
		onStyleInstallerSelect(style);
		handleCancel();
	}, [handleCancel, onStyleInstallerSelect, state.items]);

	const handleDelete = useCallback(ev => {
		const styleEl = ev.currentTarget.closest('[data-style]');
		const otherStyleEl = styleEl.previousElementSibling || styleEl.nextElementSibling;
		const styleName = ev.currentTarget.closest('[data-style]').dataset.style;
		const otherStyleName = otherStyleEl ? otherStyleEl.dataset.style : null;
		ev.stopPropagation();
		onStyleInstallerDelete(styleName);
		if(otherStyleName) {
			focusBySelector(`[data-style="${otherStyleName}"]`);
		}
	}, [focusBySelector, onStyleInstallerDelete]);

	const handleInputKeydown = useCallback((ev) => {
		if(ev.key === 'Escape') {
			handleCancel();
			ev.preventDefault();
		}
	}, [handleCancel]);

	const handleKeyDown = useCallback(ev => {
		if(ev.key === 'ArrowDown') {
			focusNext(ev, { useCurrentTarget: false });
			ev.preventDefault();
		} else if(ev.key === 'ArrowUp') {
			focusPrev(ev, { useCurrentTarget: false });
			ev.preventDefault();
		} else if (ev.key === 'Tab' && !ev.shiftKey) {
			// for the modal's focus trap to work correctly, we need to make sure the focus is moved to the footerRef
			// (scopedTab in react-modal needs focus to be on the last "tabbable" so that it can trap the focus)
			skipNextFocusRef.current = true;
			listRef.current.focus();
			listRef.current.tabIndex = 0;
			listRef.current.dataset.focusRoot = '';
		}
	}, [focusNext, focusPrev]);

	const handleFocus = useCallback((ev) => {
		if (skipNextFocusRef.current) {
			skipNextFocusRef.current = false;
		} else {
			receiveFocus(ev);
		}
	}, [receiveFocus]);

	useEffect(() => {
		if(wasStylesDataLoading === true && isStylesDataLoading === false) {
			searchWorker.postMessage(['LOAD', stylesData]);
		}
	}, [isStylesDataLoading, wasStylesDataLoading, stylesData]);

	useEffect(() => {
		searchWorker.addEventListener('message', handleWorkerMessage);
		return () => {
			searchWorker.removeEventListener('message', handleWorkerMessage);
		}
	}, [handleWorkerMessage]);

	useEffect(() => {
		return () => {
			clearTimeout(timeout.current);
			timeout.current = null
		}
	}, []);

	const title = intl.formatMessage({ id: 'zbib.styleInstaller.title', defaultMessage: 'Add a Citation Style' });

	return (
		<Modal
			isOpen={ isOpen }
			contentLabel={ title }
			className={ cx('style-installer', 'modal', 'modal-lg', { loading: !state.isReady }) }
			onRequestClose={ handleCancel }
		>
			{ state.isReady ? (
			<div className="modal-content" tabIndex={ -1 }>
				<div className="modal-header">
					<h4 className="modal-title text-truncate">
						{ title }
					</h4>
					<Button
						icon
						className="close"
						onClick={ handleCancel }
					>
						<Icon type={ '24/remove' } width="24" height="24" />
					</Button>
				</div>
				<div className="modal-body">
					<Input
						aria-label="Search Citation Styles"
						autoFocus
						className="form-control form-control-lg"
						onChange={ handleFilterChange }
						onKeyDown={ handleInputKeydown }
						placeholder={ intl.formatMessage({ id: 'zbib.styleInstaller.searchPlaceholder', defaultMessage: 'Enter three or more characters to search' }) }
						type="search"
						value={ state.filter }
						isBusy={ state.isSearching }
					/>
						<ul
							aria-label="Citation Styles"
							className="style-list"
							tabIndex={ 0 }
							ref={ listRef }
							onFocus={ handleFocus }
							onBlur={ receiveBlur }
							onKeyDown={ handleKeyDown }
						>
							{
								state.filter.length > 2 ?
								state.items.map(style => {
									const styleData = citationStyles.find(cs => cs.name === style.name);
									return <StyleItem
										key={ style.name }
										onDelete = { handleDelete }
										onInstall = { handleInstall }
										isActive = { style.name === activeCitationStyle }
										isSelected={ state.items[state.selectedIndex] ? state.items[state.selectedIndex].name === style.name : false }
										isInstalled = { !!styleData }
										{ ...style }
										{ ...styleData }
									/>
								}) : citationStyles.map(style => (
									<StyleItem
										key={ style.name }
										onDelete = { handleDelete }
										onInstall = { handleInstall }
										isActive = { style.name === activeCitationStyle }
										isSelected = { state.items[state.selectedIndex] ? state.items[state.selectedIndex].name === style.name : false }
										isInstalled = { true }
										{ ...style }
									/>
								))
							}
						</ul>
				</div>
			</div>
		) : <Spinner /> }
		</Modal>
	);
}

StyleInstaller.propTypes = {
	activeDialog: PropTypes.string,
	citationStyle: PropTypes.string,
	citationStyles: PropTypes.array,
	isStylesDataLoading: PropTypes.bool,
	onStyleInstallerCancel: PropTypes.func.isRequired,
	onStyleInstallerDelete: PropTypes.func.isRequired,
	onStyleInstallerSelect: PropTypes.func.isRequired,
	stylesData: PropTypes.array,
}

export default memo(StyleInstaller);
