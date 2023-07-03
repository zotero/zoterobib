import { Fragment, memo, useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, useIntl } from 'react-intl';
import { Button } from 'web-common/components';

import Confirmation from './confirmation';

const DeleteAllButton = props => {
	const { bibliographyCount, onDeleteCitations } = props;
	const [isConfirmingDeleteAll, setIsConfirmingDeleteAll] = useState(false);
	const intl = useIntl();

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
        <Fragment>
			<Button
				key="delete-all-button"
				className="btn-sm btn-outline-primary delete-all"
				onClick={ handleDeleteAll }
			>
				<FormattedMessage id="zbib.bibliography.deleteAll" defaultMessage="Delete Bibliography" />
			</Button>
			<Confirmation
				key="delete-all-confirmation"
				isOpen={ isConfirmingDeleteAll }
				onConfirm={ handleConfirmDeleteAll }
				onCancel={ handleCancelDeleteAll }
				title={ intl.formatMessage({ id: "zbib.confirmDeleteAll.title", defaultMessage: "Clear Bibliography?" }) }
				confirmLabel={ intl.formatMessage({ id: "zbib.confirmDeleteAll.confirm", defaultMessage: "Delete" }) }
			>
				<p>
					<span>
						<FormattedMessage
							id="zbib.confirmDeleteAll.prompt"
							defaultMessage="{bibliographyCount, plural,
								one {# entry}
								other {# entries}
							} will be deleted."
							values={ { bibliographyCount } }
						/>
					</span>
				</p>
			</Confirmation>
		</Fragment>
    );
};

DeleteAllButton.propTypes = {
	bibliographyCount: PropTypes.number.isRequired,
	onDeleteCitations: PropTypes.func.isRequired,
}

export default memo(DeleteAllButton);
