import { Fragment, memo, useCallback, useId, useRef } from 'react';
import PropTypes from 'prop-types';
import { Button } from 'web-common/components';
import { formatBib, formatFallback } from 'web-common/cite';
import { FormattedMessage } from 'react-intl';
import { useFocusManager } from 'web-common/hooks';

const Review = ({ isTranslating, itemUnderReview, onReviewEdit, onReviewDelete, onReviewDismiss, styleHasBibliography }) => {
	const { bibliographyItems, bibliographyMeta } = itemUnderReview || {};
	const id = useId();
	const html = itemUnderReview ?
		styleHasBibliography ? formatBib(bibliographyItems, bibliographyMeta) : formatFallback(bibliographyItems) :
		'';
	const toolbarRef = useRef(null);
	const { focusNext, focusPrev, receiveFocus, receiveBlur } = useFocusManager(toolbarRef);

	const handleKeyDown = useCallback(ev => {
		if(ev.key == 'ArrowLeft') {
			focusPrev(ev, { useCurrentTarget: false });
		} else if(ev.key == 'ArrowRight') {
			focusNext(ev, { useCurrentTarget: false });
		}
	}, [focusNext, focusPrev]);

	const resetFocus = useCallback(() => {
		document.querySelector('.id-input').focus();
	}, []);

	const handleReviewDismiss = useCallback(ev => {
		resetFocus();
		onReviewDismiss(ev);
	}, [onReviewDismiss, resetFocus]);

	const handleReviewDelete = useCallback(ev => {
		resetFocus();
		onReviewDelete(ev);
	}, [onReviewDelete, resetFocus]);

	const handleReviewEdit = useCallback(ev => {
		resetFocus();
		onReviewEdit(ev);
	}, [onReviewEdit, resetFocus]);

	return (
        <section
			aria-labelledby={ id }
			className="section section-review review"
		>
			{ isTranslating ? (
					<h2 id={ id }>
						<FormattedMessage id="zbib.review.newItem" defaultMessage="New item…" />
					</h2>
			) : (
			<Fragment>
				<h2 className="sr-only" id={ id }>
					<FormattedMessage id="zbib.review.newItem" defaultMessage="New item…" />
				</h2>
				<div className="container">
					<div dangerouslySetInnerHTML={ { __html: html } } />
					<div
						className="actions"
						role="toolbar"
						tabIndex={ 0 }
						ref={ toolbarRef }
						onKeyDown={ handleKeyDown }
						onFocus={ receiveFocus }
						onBlur={ receiveBlur }
					>
						<Button
							tabIndex={-2}
							className="btn-outline-secondary btn-min-width"
							onClick={handleReviewDismiss }
						>
							<FormattedMessage id="zbib.general.close" defaultMessage="Close" />
						</Button>
						<Button
							tabIndex={-2}
							className="btn-outline-secondary btn-min-width"
							onClick={ handleReviewDelete }
						>
							<FormattedMessage id="zbib.general.delete" defaultMessage="Delete" />
						</Button>
						<Button
							tabIndex={-2}
							className="btn-secondary btn-min-width"
							onClick={ handleReviewEdit }
						>
							<FormattedMessage id="zbib.general.edit" defaultMessage="Edit" />
						</Button>
					</div>
				</div>
			</Fragment>
			)}
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
