import React, { memo } from 'react';
import PropTypes from 'prop-types';
import Button from './ui/button';
import { formatBib, formatFallback } from '../cite';
import { FormattedMessage } from 'react-intl';

const Review = ({ isTranslating, itemUnderReview, onReviewEdit, onReviewDelete, onReviewDismiss, styleHasBibliography }) => {
	const { bibliographyItems, bibliographyMeta } = itemUnderReview || {};
	const html = itemUnderReview ?
		styleHasBibliography ? formatBib(bibliographyItems, bibliographyMeta) : formatFallback(bibliographyItems) :
		'';

	return isTranslating ? (
		<section className="section section-review review">
			<h2>
				<FormattedMessage id="zbib.review.newItem" defaultMessage="New item…" />
			</h2>
		</section>
	) : (
		<section className="section section-review review">
			<h2 className="sr-only">
				<FormattedMessage id="zbib.review.newItem" defaultMessage="New item…" />
			</h2>
			<div className="container">
				<div dangerouslySetInnerHTML={ { __html: html } } />
				<div className="actions">
					<Button
						className="btn-outline-secondary btn-min-width"
						onClick={ onReviewDismiss }
					>
						<FormattedMessage id="zbib.general.close" defaultMessage="Close" />
					</Button>
					<Button
						className="btn-outline-secondary btn-min-width"
						onClick={ onReviewDelete }
					>
						<FormattedMessage id="zbib.general.delete" defaultMessage="Delete" />
					</Button>
					<Button
						className="btn-secondary btn-min-width"
						onClick={ onReviewEdit }
					>
						<FormattedMessage id="zbib.general.edit" defaultMessage="Edit" />
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

export default memo(Review);
