'use strict';

const React = require('react');
const PropTypes = require('prop-types');
const Button = require('zotero-web-library/lib/component/ui/button');
const formatBib = require('../cite');

class Review extends React.PureComponent {
	handleDismiss() {
		this.props.onReviewDismiss();
	}

	handleDelete() {
		this.props.onReviewDelete();
	}

	handleEdit() {
		this.props.onReviewEdit();
	}

	render() {
		const { citations, bibliography, isFallback } = this.props.itemUnderReviewBibliography;
		const html = isFallback ?
			`<ol><li>${citations.join('</li><li>')}</li></ol>` :
			formatBib(bibliography);
		const div = document.createElement('div');
		div.innerHTML = html;

		return (
			<div className="review">
				<div className="bibliography read-only"
					dangerouslySetInnerHTML={ { __html: div.innerHTML } }
				/>
				<div className="actions">
					<Button onClick={ this.handleDismiss.bind(this) }>
						Dismiss
					</Button>
					<Button onClick={ this.handleDelete.bind(this) }>
						Delete
					</Button>
					<Button onClick={ this.handleEdit.bind(this) }>
						Edit
					</Button>
				</div>
			</div>
		);
	}
}

module.exports = Review;
