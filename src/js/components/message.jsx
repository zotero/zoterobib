import React, { memo, useCallback } from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';

import Icon from './ui/icon';
import Button from './ui/button';

const Message = ({ action, id, message, kind, href, onDismiss, onReadMore, onShowDuplicate, onUndoDelete }) => {
	let category;

	switch(kind) {
		case 'UNDO_DELETE': category = 'warning'; break;
		case 'FIRST_CITATION': category = 'success'; break;
		case 'ERROR': category = 'error'; break;
		case 'DUPLICATE': category = 'warning'; break;
		default: category = 'info'; break;
	}

	const handleAction = useCallback(ev => {
		switch(kind) {
			case 'WELCOME_MESSAGE': onReadMore(ev); break;
			case 'UNDO_DELETE': onUndoDelete(); break;
			case 'DUPLICATE': onShowDuplicate(ev); break;
		}
	}, [kind, onReadMore, onShowDuplicate, onUndoDelete]);

	const handleDismiss = useCallback(() => {
		onDismiss(id);
	}, [id, onDismiss]);

	return (
		<div className={ cx('message', category) }>
			<p className="text">
				{ message }
				{ action && (
					href ? (
						<a
							className={ `btn btn-sm btn-outline-inverse-${category}` }
							href={ href }
						>
							{ action }
						</a>
					) : (
						<Button
							className={ `btn-sm btn-outline-inverse-${category}` }
							onClick={ handleAction }
						>
							{ action }
						</Button>
					)
				) }
			</p>
			<button
				className="btn btn-icon close"
				onClick={ handleDismiss }
			>
				<Icon type={ '24/remove' } width="24" height="24" />
			</button>
		</div>
	);
}

Message.propTypes = {
	id: PropTypes.number,
	action: PropTypes.string,
	href: PropTypes.string,
	kind: PropTypes.oneOf(['DUPLICATE', 'ERROR', 'FIRST_CITATION', 'INFO', 'UNDO_DELETE', 'WELCOME_MESSAGE']).isRequired,
	message: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
	onDismiss: PropTypes.func.isRequired,
	onReadMore: PropTypes.func,
	onUndoDelete: PropTypes.func,
	onShowDuplicate: PropTypes.func,
}

export default memo(Message);
