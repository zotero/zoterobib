import React, { memo, useCallback, useState } from 'react';
import PropTypes from 'prop-types';

import Button from './ui/button';
import Confirmation from './confirmation';

const DeleteAllButton = props => {
	const { bibliographyCount, onDeleteCitations } = props;
	const [isConfirmingDeleteAll, setIsConfirmingDeleteAll] = useState(false);

	const handleDeleteAll = useCallback(() => {
		setIsConfirmingDeleteAll(true);
	}, []);

	const handleConfirmDeleteAll = useCallback(() => {
		setIsConfirmingDeleteAll(false);
		onDeleteCitations();
	}, [onDeleteCitations]);

	const handleCancelDeleteAll = useCallback(() => {
		setIsConfirmingDeleteAll(false);
	}, []);


	return (
		<React.Fragment>
			<Button
				key="delete-all-button"
				className="btn-sm btn-outline-primary"
				onClick={ handleDeleteAll }
			>
				Delete All
			</Button>
			<Confirmation
				key="delete-all-confirmation"
				isOpen={ isConfirmingDeleteAll }
				onConfirm={ handleConfirmDeleteAll }
				onCancel={ handleCancelDeleteAll }
				title="Clear Bibliography?"
				confirmLabel="Delete"
				>
					<p>
						{ bibliographyCount > 0 && (
							<span>
								{ bibliographyCount } { bibliographyCount > 1 ? 'entries' : 'entry' } will be deleted.
							</span>
						)
						}
					</p>
			</Confirmation>
		</React.Fragment>
	);
};

DeleteAllButton.propTypes = {
	bibliographyCount: PropTypes.number.isRequired,
	onDeleteCitations: PropTypes.func.isRequired,
}

export default memo(DeleteAllButton);
