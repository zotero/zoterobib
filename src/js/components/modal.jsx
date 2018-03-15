'use strict';

const React = require('react');
const PropTypes = require('prop-types');

const ReactModal = require('react-modal');

class Modal extends React.PureComponent {
	componentWillReceiveProps(props) {
		if(props.isOpen != this.props.isOpen && props.isOpen === true) {
			this.setScrollbar();
		}
		if(props.isOpen != this.props.isOpen && props.isOpen === false) {
			this.resetScrollbar();
		}
	}

	checkScrollbar() {
		const rect = document.body.getBoundingClientRect();
		return rect.left + rect.right < window.innerWidth;
	}

	getScrollbarWidth() {
		const scrollDiv = document.createElement('div');
		scrollDiv.className = 'modal-scrollbar-measure';
		document.body.appendChild(scrollDiv);
		const scrollbarWidth = scrollDiv.getBoundingClientRect().width - scrollDiv.clientWidth;
		document.body.removeChild(scrollDiv);
		return scrollbarWidth;
	}

	setScrollbar() {
		this.previousPadding = parseFloat(document.body.style.paddingRight);
		this.previousPadding = Number.isNaN(this.previousPadding) ? 0 : this.previousPadding;
		const calculatedPadding = this.previousPadding + this.getScrollbarWidth();
		document.body.style.paddingRight = `${calculatedPadding}px`;
	}

	resetScrollbar() {
		document.body.style.paddingRight = `${this.previousPadding}px`;
	}

	handleModalOpen() {
		// remove maxHeight hack that prevents scroll on focus
		this.contentRef.style.maxHeight = null;
		this.contentRef.firstChild.focus();
	}

	render() {
		return <ReactModal
			role="dialog"
			// prevent scroll on focus by setting max height
			style={{ content: { maxHeight: '90%' } }}
			onAfterOpen={ this.handleModalOpen.bind(this) }
			contentRef={ contentRef => { this.contentRef = contentRef; } }
			parentSelector={ () => document.querySelector('.zotero-bib-container') }
			appElement={ document.querySelector('.zotero-bib-inner') }
			className="modal"
			overlayClassName="modal-backdrop"
			{ ...this.props }
		/>;
	}

	static propTypes = {
		isOpen: PropTypes.bool,
	}
}

module.exports = Modal;
