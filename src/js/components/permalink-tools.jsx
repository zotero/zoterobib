'use strict';

const React = require('react');
const PropTypes = require('prop-types');
const ClipboardButton = require('react-clipboard.js').default;

const Button = require('zotero-web-library/lib/component/ui/button');
const Spinner = require('zotero-web-library/lib/component/ui/spinner');

class PermalinkTools extends React.Component {
	state = {
		isSavingPermalink: false,
		isRecentlyCopied: false
	}

	async componentWillReceiveProps(props) {
		if(this.props.permalink != props.permalink) {
			this.setState({
				isSavingPermalink: false
			});
		}
	}

	handleCreateLink() {
		if(!this.props.permalink) {
			this.setState({
				isSavingPermalink: true
			});
			this.props.onSave();
		}
	}

	handleClipoardSuccess() {
		if(this.state.isRecentlyCopied) {
			return;
		}

		this.setState({
			isRecentlyCopied: true
		});

		setTimeout(() => {
			this.setState({
				isRecentlyCopied: false
			});
		}, 1000);
	}

	render() {
		if(this.state.isSavingPermalink) {
			return <Spinner />;
		}

		return this.props.permalink ? (
			<div className="permalink-tools">
				<ClipboardButton
					className="btn btn-primary"
					data-clipboard-text={ this.props.permalink }
					onSuccess={ this.handleClipoardSuccess.bind(this) }
				>
					{ this.state.isRecentlyCopied ? 'Copied!' : 'Copy URL' }
				</ClipboardButton>
				<Button>
					<a href={ this.props.permalink }>
						View
					</a>
				</Button>
			</div>
			) : (
			<Button
				disabled={ Object.keys(this.props.citations).length === 0 }
				className="btn btn-drop-down permalink-button"
				onClick={ this.handleCreateLink.bind(this) }
			>
				Link to This Version
			</Button>
		);
	}

	static defaultProps = {
		citations: {}
	}

	static propTypes = {
		citations: PropTypes.object,
		onSave: PropTypes.func.isRequired,
		permalink: PropTypes.string,
	}
}


module.exports = PermalinkTools;
