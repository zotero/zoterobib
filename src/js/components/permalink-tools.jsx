import copy from 'copy-to-clipboard';
import cx from 'classnames';
import PropTypes from 'prop-types';
import React, { useCallback, useState, memo } from 'react';
import { useIntl, FormattedMessage } from 'react-intl';
import { Button, Spinner } from 'web-common/components';

const PermalinkTools = ({ bibliography, isSafari, onSave, permalink }) => {
	const [isSavingPermalink, setIsSavingPermalink] = useState(false);
	const [isRecentlyCopied, setIsRecentlyCopied] = useState(false);
	const intl = useIntl();

	const handleCreateLink = useCallback(async () => {
		if(!permalink) {
			setIsSavingPermalink(true);
			await onSave();
			setIsSavingPermalink(false);
		}
	}, [onSave, permalink]);

	const handleCopy = useCallback(() => {
		if(copy(permalink) && !isRecentlyCopied) {
			setIsRecentlyCopied(true);
			setTimeout(() => {
				setIsRecentlyCopied(false)
			}, 1000);
		}
	}, [isRecentlyCopied, permalink]);

	return (
		<div className={cx('permalink-tools', { 'loading': isSavingPermalink }) }>
			{ isSavingPermalink ? (
				<Spinner />
			) : permalink ? (
				<div className="btn-wrap">
					<Button
						className={
							cx('btn btn-lg btn-block btn-secondary',
								{ success: isRecentlyCopied })
						}
						data-clipboard-text={permalink}
						onClick={handleCopy}
					>
						{isRecentlyCopied ?
							intl.formatMessage({ id: 'zbib.permalink.copyFeedback', defaultMessage: 'Copied!' }) :
							intl.formatMessage({ id: 'zbib.permalink.copyURL', defaultMessage: 'Copy URL' })
						}
					</Button>
					<a
						className="btn btn-lg btn-block btn-secondary"
						href={permalink}>
						<FormattedMessage id="zbib.permalink.view" defaultMessage="View" />
					</a>
				</div>
			) : (
				<React.Fragment>
					{ isSafari && (
						<div className="safari-warning">
							<p><strong><FormattedMessage
								id="zbib.permalink.safari.warning"
								defaultMessage="If you don't visit zbib.org for 7 days, your browser will automatically remove your bibliography."
							/></strong></p>
							<p><FormattedMessage
								id="zbib.permalink.safari.recommendation"
								defaultMessage="We recommend persisting your bibliography by creating a permalink."
							/></p>
						</div>
					) }
					<Button
						disabled={bibliography.items.length === 0}
						className="btn-lg btn-outline-secondary btn-min-width"
						onClick={handleCreateLink}
					>
						<FormattedMessage id="zbib.permalink.create" defaultMessage="Create" />
					</Button>
				</React.Fragment>
			) }
		</div>
	);
}


PermalinkTools.propTypes = {
	bibliography: PropTypes.object,
	isSafari: PropTypes.bool,
	onSave: PropTypes.func.isRequired,
	permalink: PropTypes.string,
}

export default memo(PermalinkTools);
