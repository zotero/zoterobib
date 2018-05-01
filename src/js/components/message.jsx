'use strict';

const React = require('react');
const PropTypes = require('prop-types');
const cx = require('classnames');
const KeyHandler = require('react-key-handler').default;
const { KEYDOWN } = require('react-key-handler');
const { withRouter } = require('react-router-dom');
const Icon = require('zotero-web-library/lib/component/ui/icon');
const Button = require('zotero-web-library/lib/component/ui/button');
const { noop } = require('zotero-web-library/lib/utils');

class Message extends React.Component {
	componentDidMount() {
		if(this.props.autoDismiss) {
			this.timeout = setTimeout(this.props.onDismiss, 5000);
		}
	}

	componentWillUnmount() {
		if(this.timeout) {
			clearTimeout(this.timeout);
			delete this.timeout;
		}
	}

	componentWillReceiveProps(nextProps) {
		if('location' in nextProps &&
			nextProps.location.pathname !== this.props.location.pathname) {
			this.props.onDismiss();
		}
	}

	handleDismiss() {
		clearTimeout(this.timeout);
		delete this.timeout;
		this.props.onDismiss();
	}

	handleAction(event) {
		clearTimeout(this.timeout);
		delete this.timeout;
		this.props.onAction(event);
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
				className={ `btn btn-outline-inverse-${this.props.kind}` }
				href={ this.props.href }
				>
					{ this.props.action }
				</a>
			): (
				<Button
					className={ `btn-outline-inverse-${this.props.kind}` }
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
		autoDismiss: PropTypes.bool,
		href: PropTypes.string,
		kind: PropTypes.oneOf(['info', 'success', 'warning', 'error']).isRequired,
		location: PropTypes.object,
		message: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
		onAction: PropTypes.func,
		onDismiss: PropTypes.func.isRequired,
	}
}

module.exports = withRouter(Message);
