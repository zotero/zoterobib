/* eslint-disable react/no-deprecated */
// @TODO: migrate to getDerivedStateFromProps()
import React from 'react';
import PropTypes from 'prop-types';
import copy from 'copy-to-clipboard';
import cx from 'classnames';

import Button from './ui/button';
import Spinner from './ui/spinner';

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
				disabled={ this.props.bibliography.items.length === 0 }
				className="btn-lg btn-outline-secondary btn-min-width"
				onClick={ this.handleCreateLink.bind(this) }
			>
				Create
			</Button>
		);
	}

	static defaultProps = {
		bibliography: {}
	}

	static propTypes = {
		bibliography: PropTypes.object,
		onSave: PropTypes.func.isRequired,
		permalink: PropTypes.string,
	}
}


export default PermalinkTools;
