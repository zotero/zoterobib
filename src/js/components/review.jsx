import React from 'react';
import PropTypes from 'prop-types';
import Button from './ui/button';
import { formatBib, formatFallback } from '../cite';

const Review = ({ isTranslating, itemUnderReview, onReviewEdit, onReviewDelete, onReviewDismiss, styleHasBibliography }) => {
	const { bibliographyItems, bibliographyMeta } = itemUnderReview;
	const html = styleHasBibliography ? formatBib(bibliographyItems, bibliographyMeta) : formatFallback(bibliographyItems);

	return isTranslating ? (
		<section className="section section-review review">
			<h2>New item…</h2>
		</section>
	) : (
		<section className="section section-review review">
			<h2 className="sr-only">New item …</h2>
			<div className="container">
				<div dangerouslySetInnerHTML={ { __html: html } } />
				<div className="actions">
					<Button
						className="btn-outline-secondary btn-min-width"
						onClick={ onReviewDismiss }
					>
						Close
					</Button>
					<Button
						className="btn-outline-secondary btn-min-width"
						onClick={ onReviewDelete }
					>
						Delete
					</Button>
					<Button
						className="btn-secondary btn-min-width"
						onClick={ onReviewEdit }
					>
						Edit
					</Button>
				</div>
			</div>
		</section>
	);
}

Review.propTypes = {
	isTranslating: PropTypes.bool,
	itemUnderReview: PropTypes.object,
	onReviewDelete: PropTypes.func.isRequired,
	onReviewDismiss: PropTypes.func.isRequired,
	onReviewEdit: PropTypes.func.isRequired,
	styleHasBibliography: PropTypes.bool,
}

export default Review;
