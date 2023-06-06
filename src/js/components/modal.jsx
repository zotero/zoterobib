import React, { useCallback, useEffect, useRef, memo } from 'react';
import PropTypes from 'prop-types';
import ReactModal from 'react-modal';
import { usePrevious } from 'web-common/hooks';
import { getScrollbarWidth, omit } from 'web-common/utils';

var initialPadding = parseFloat(document.body.style.paddingRight);
initialPadding = Number.isNaN(initialPadding) ? 0 : initialPadding;

const setScrollbar = () => {
	const calculatedPadding = initialPadding + getScrollbarWidth();
	document.body.style.paddingRight = `${calculatedPadding}px`;
}

const resetScrollbar = () => {
	document.body.style.paddingRight = `${initialPadding}px`;
}

const Modal = props => {
	const { isOpen, onAfterOpen = null } = props;
	const contentRef = useRef(null);
	const wasOpen = usePrevious(isOpen);

	const handleModalOpen = useCallback(() => {
		// remove maxHeight hack that prevents scroll on focus
		contentRef.current.style.maxHeight = null;
		contentRef.current.style.overflowY = null;
		if(onAfterOpen) {
			onAfterOpen(contentRef);
		}
	}, [onAfterOpen]);

	useEffect(() => {
		if(isOpen && !wasOpen) {
			setScrollbar();
		} else if(wasOpen && !isOpen) {
			resetScrollbar();
		}
	}, [isOpen, wasOpen])

	useEffect(() => {
		return resetScrollbar;
	}, []);

	return <ReactModal
		role="dialog"
		// prevent scroll on focus by setting max height
		style={{ content: { maxHeight: 'calc(100% - 32px)', overflowY: 'hidden' } }}
		onAfterOpen={ handleModalOpen }
		contentRef={ ref => { contentRef.current = ref; } }
		parentSelector={ () => document.querySelector('.zotero-bib-container') }
		appElement={ document.querySelector('.zotero-bib-inner') }
		className="modal-body"
		overlayClassName="modal-backdrop"
		{ ...omit(props, ['onAfterOpen']) }
	/>;
}

Modal.propTypes = {
	isOpen: PropTypes.bool,
	onAfterOpen: PropTypes.func,
}

export default memo(Modal);
