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
		if(this.props.isTranslating) {
			return (
				<section className="section section-review review">
					<h2>New item …</h2>
				</section>
			);
		}

		if(!this.props.itemUnderReviewBibliography) {
			return null;
		}

		const { citations, bibliography, isFallback } = this.props.itemUnderReviewBibliography;
		const html = isFallback ?
			`<ol><li>${citations.join('</li><li>')}</li></ol>` :
			formatBib(bibliography);
		const div = document.createElement('div');
		div.innerHTML = html;
		return (
			<section className="section section-review review">
				<h2 className="sr-only">New item …</h2>
				<div className="container">
					<div
						dangerouslySetInnerHTML={ { __html: div.innerHTML } }
					/>
					<div className="actions">
						<Button
							className="btn-outline-secondary btn-min-width"
							onClick={ this.handleDismiss.bind(this) }
						>
							Close
						</Button>
						<Button
							className="btn-outline-secondary btn-min-width"
							onClick={ this.handleDelete.bind(this) }
						>
							Delete
						</Button>
						<Button
							className="btn-secondary btn-min-width"
							onClick={ this.handleEdit.bind(this) }
						>
							Edit
						</Button>
					</div>
				</div>
			</section>
		);
	}

	static propTypes = {
		isTranslating: PropTypes.bool,
		itemUnderReviewBibliography: PropTypes.object,
		onReviewDelete: PropTypes.func.isRequired,
		onReviewDismiss: PropTypes.func.isRequired,
		onReviewEdit: PropTypes.func.isRequired,
	}
}

module.exports = Review;
