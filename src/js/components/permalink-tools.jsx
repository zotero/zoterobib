/* eslint-disable react/no-deprecated */
// @TODO: migrate to getDerivedStateFromProps()
'use strict';

const React = require('react');
const PropTypes = require('prop-types');
const copy = require('copy-to-clipboard');
const cx = require('classnames');

const Button = require('zotero-web-library/src/js/component/ui/button');
const Spinner = require('zotero-web-library/src/js/component/ui/spinner');

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

	handleCopy() {
		const result = copy(this.props.permalink);
		if(result) {
			this.handleClipoardSuccess();
		}
	}

	render() {
		if(this.state.isSavingPermalink) {
			return (
				<div className="permalink-tools loading">
					<Spinner />
				</div>
			);
		}

		return this.props.permalink ? (
			<div className="permalink-tools">
				<Button
					className={
						cx('btn btn-lg btn-block btn-secondary',
						{ success: this.state.isRecentlyCopied})
					}
					data-clipboard-text={ this.props.permalink }
					onClick={ this.handleCopy.bind(this) }
				>
					{ this.state.isRecentlyCopied ? 'Copied!' : 'Copy URL' }
				</Button>
				<a
					className="btn btn-lg btn-block btn-secondary"
					href={ this.props.permalink }>
					View
				</a>
			</div>
			) : (
			<Button
				disabled={ this.props.items.length === 0 }
				className="btn-lg btn-outline-secondary btn-min-width"
				onClick={ this.handleCreateLink.bind(this) }
			>
				Create
			</Button>
		);
	}

	static defaultProps = {
		items: []
	}

	static propTypes = {
		items: PropTypes.array,
		onSave: PropTypes.func.isRequired,
		permalink: PropTypes.string,
	}
}


module.exports = PermalinkTools;
