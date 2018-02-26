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
		this.contentRef && this.contentRef.focus({ preventScroll: true });
	}

	render() {
		return <ReactModal
			{ ...this.props }
			shouldFocusAfterRender={ false }
			onAfterOpen={ this.handleModalOpen.bind(this) }
			contentRef={ contentRef => { this.contentRef = contentRef; } }
		/>;
	}

	static propTypes = {
		isOpen: PropTypes.bool,
	}
}

module.exports = Modal;
