import React, { useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';

import { useLocation } from "react-router-dom";
import { default as KeyHandler } from 'react-key-handler';
import { KEYDOWN } from 'react-key-handler';
import Icon from './ui/icon';
import Button from './ui/button';
import { usePrevious } from '../hooks/';

const Message = ({ action, id, message, kind, href, onDismiss, onReadMore, onUndoDelete }) => {
	const location = useLocation();
	const prevLocation = usePrevious(location);
	let category;

	switch(kind) {
		case 'UNDO_DELETE': category = 'warning'; break;
		case 'FIRST_CITATION': category = 'success'; break;
		default: category = 'info'; break;
	}

	const handleAction = useCallback(ev => {
		switch(kind) {
			case 'WELCOME_MESSAGE': onReadMore(ev); break;
			case 'UNDO_DELETE': onUndoDelete(); break;
		}
	}, [kind, onReadMore, onUndoDelete]);

	const handleDismiss = useCallback(() => {
		onDismiss(id);
	}, [id, onDismiss]);

	useEffect(() => {
		if(prevLocation !== location && typeof(prevLocation)  !== 'undefined') {
			onDismiss(id);
		}
	}, [id, location, onDismiss, prevLocation]);

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
			<KeyHandler
				keyEventName={ KEYDOWN }
				keyValue="Escape"
				onKeyHandle={ handleDismiss }
			/>
		</div>
	);
}

Message.propTypes = {
	id: PropTypes.number,
	action: PropTypes.string,
	href: PropTypes.string,
	kind: PropTypes.oneOf(['FIRST_CITATION', 'INFO', 'UNDO_DELETE', 'WELCOME_MESSAGE']).isRequired,
	message: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
	onDismiss: PropTypes.func.isRequired,
	onReadMore: PropTypes.func,
	onUndoDelete: PropTypes.func,
}

export default Message;
