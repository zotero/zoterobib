'use strict';

const React = require('react');
const PropTypes = require('prop-types');

var withScrollbarMeasure = ComposedComponent => class extends React.PureComponent {
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

	render() {
		return <ComposedComponent {...this.props } { ...this.state } />;
	}

	static propTypes = {
		isOpen: PropTypes.bool,
	}
};

module.exports = withScrollbarMeasure;
