'use strict';

import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import escapeHtml from 'escape-html';

import Input from '../form/input';
import SelectInput from '../form/select';
import TextAreaInput from '../form/text-area';
import { noop } from '../../utils';

class EditableContent extends React.PureComponent {
	get content() {
		return escapeHtml(this.props.value).replace(/\n/g, '<br />');
	}

	get displayValue() {
		const { options, value, display, placeholder } = this.props;

		return value ?
			options && options.find(e => e.value == value).label || display ||  value :
			placeholder;
	}

	render() {
		if(this.props.inputComponent === TextAreaInput) {
			return <span dangerouslySetInnerHTML={ { __html: this.content } } />;
		} else {
			const className = {
				'editable-content': true,
				'placeholder': !this.props.value && this.props.placeholder
			};
			return (
				<span className={ cx(className) }>{ this.displayValue }</span>
			);
		}
	}

	static defaultProps = {
		value: ''
	};

	static propTypes = {
		display: PropTypes.string,
		inputComponent: PropTypes.func,
		options: PropTypes.array,
		placeholder: PropTypes.string,
		value: PropTypes.oneOfType([
			PropTypes.string,
			PropTypes.number
		])
	};
}

class Editable extends React.PureComponent {
	setInput(input) {
		this.props.inputRef(input);
	}

	handleClick(event) {
		this.props.onEditableClick(event);
	}

	handleFocus(event) {
		this.props.onEditableFocus(event);
	}

	get isActive() {
		return (this.props.isActive || this.props.isBusy) && !this.props.isDisabled;
	}

	get isReadOnly() {
		return this.props.isReadOnly || this.props.isBusy;
	}

	get className() {
		return {
			'editable': true,
			'editing': this.isActive,
			'textarea': this.props.inputComponent === TextAreaInput,
			'select': this.props.inputComponent === SelectInput
		};
	}

	renderContent() {
		const hasChildren = typeof this.props.children !== 'undefined';
		return (
			<span className="editable-value">
				{
					hasChildren ?
						this.props.children :
						<EditableContent { ...this.props } />
				}
			</span>
		);
	}

	renderControls() {
		const InputComponent = this.props.inputComponent;
		return (
			<InputComponent
				className="editable-control"
				isReadOnly={ this.isReadOnly }
				ref={ this.setInput.bind(this) }
				{ ...this.props }
			/>
		);
	}

	render() {
		return (
			<div
				tabIndex={ this.isActive ? null : 0 }
				onMouseDown={ this.handleClick.bind(this) }
				onFocus={ this.handleFocus.bind(this) }
				className={ cx(this.className) }
			>
				{ this.isActive ? this.renderControls() : this.renderContent() }
			</div>
		);
	}
	static defaultProps = {
		inputComponent: Input,
		inputRef: noop,
		onEditableClick: noop,
		onEditableFocus: noop,
	};

	static propTypes = {
		children: PropTypes.oneOfType([PropTypes.element, PropTypes.array]),
		inputComponent: PropTypes.func,
		inputRef: PropTypes.func,
		isActive: PropTypes.bool,
		isBusy: PropTypes.bool,
		isDisabled: PropTypes.bool,
		isReadOnly: PropTypes.bool,
	};
}


export default Editable;
