import copy from 'copy-to-clipboard';
import cx from 'classnames';
import PropTypes from 'prop-types';
import React, { useCallback, useState, memo } from 'react';

import Button from './ui/button';
import Spinner from './ui/spinner';

const PermalinkTools = ({ bibliography, onSave, permalink }) => {
	const [isSavingPermalink, setIsSavingPermalink] = useState(false);
	const [isRecentlyCopied, setIsRecentlyCopied] = useState(false);

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

	return isSavingPermalink ? (
		<div className="permalink-tools loading">
			<Spinner />
		</div>
	) : permalink ? (
		<div className="permalink-tools">
			<Button
				className={
					cx('btn btn-lg btn-block btn-secondary',
					{ success: isRecentlyCopied})
				}
				data-clipboard-text={ permalink }
				onClick={ handleCopy }
			>
				{ isRecentlyCopied ? 'Copied!' : 'Copy URL' }
			</Button>
			<a
				className="btn btn-lg btn-block btn-secondary"
				href={ permalink }>
				View
			</a>
		</div>
		) : (
		<Button
			disabled={ bibliography.items.length === 0 }
			className="btn-lg btn-outline-secondary btn-min-width"
			onClick={ handleCreateLink }
		>
			Create
		</Button>
	);
}


PermalinkTools.propTypes = {
	bibliography: PropTypes.object,
	onSave: PropTypes.func.isRequired,
	permalink: PropTypes.string,
}

export default memo(PermalinkTools);
