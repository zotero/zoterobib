/* eslint-disable react/no-deprecated */
// @TODO: migrate to getDerivedStateFromProps()
import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import { default as KeyHandler } from 'react-key-handler';
import { KEYDOWN } from 'react-key-handler';
import { withRouter } from 'react-router-dom';
import Icon from './ui/icon';
import Button from './ui/button';
import { noop } from '../utils';

class Message extends React.Component {
	componentWillReceiveProps(nextProps) {
		if('location' in nextProps &&
			nextProps.location.pathname !== this.props.location.pathname) {
			this.props.onDismiss();
		}
	}

	handleDismiss() {
		switch(this.props.action) {
			case 'Undo': this.props.onDismissUndo(); break;
			case 'Read More': this.props.onDismissReadMore(); break;
		}
	}

	handleAction() {
		switch(this.props.action) {
			case 'Undo': this.props.onUndoDelete(); break;
			case 'Read More': this.props.onReadMore(); break;
		}
	}

	get className() {
		return {
			message: true,
			[this.props.kind]: true
		};
	}

	renderButton() {
		return (
			this.props.href ? (
				<a
				className={ `btn btn-sm btn-outline-inverse-${this.props.kind}` }
				href={ this.props.href }
				>
					{ this.props.action }
				</a>
			): (
				<Button
					className={ `btn-sm btn-outline-inverse-${this.props.kind}` }
					onClick={ this.handleAction.bind(this) }
				>
					{ this.props.action }
				</Button>
			)

		);
	}

	render() {
		return this.props.message ? (
			<div className={ cx(this.className) }>
				<p className="text">
					{ this.props.message }
					{ this.props.action ? this.renderButton() : null }
				</p>
				<button
					className="btn btn-icon close"
					onClick={ this.handleDismiss.bind(this) }
				>
					<Icon type={ '24/remove' } width="24" height="24" />
				</button>
				<KeyHandler
					keyEventName={ KEYDOWN }
					keyValue="Escape"
					onKeyHandle={ this.handleDismiss.bind(this) }
				/>
			</div>
		) : null;
	}

	static defaultProps = {
		onAction: noop
	}

	static propTypes = {
		action: PropTypes.string,
		href: PropTypes.string,
		kind: PropTypes.oneOf(['info', 'success', 'warning', 'error']).isRequired,
		location: PropTypes.object,
		message: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
		onAction: PropTypes.func,
		onDismiss: PropTypes.func.isRequired,
	}
}

export default withRouter(Message);
