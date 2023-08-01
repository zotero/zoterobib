import { memo, useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { Button, Icon, Tabs, Tab, TabPane } from 'web-common/components';
import { isTriggerEvent } from 'web-common/utils';

import Modal from './modal';
import { formatBib, formatFallback } from '../cite';

const ConfirmAddDialog = props => {
	const { activeDialog, onConfirmAddCancel, onConfirmAddConfirm, incomingStyle, itemToConfirm, selectedStyle } = props;
	const isReady = itemToConfirm && activeDialog === 'CONFIRM_ADD_DIALOG';

	const [activeTab, setActiveTab] = useState('current-style-content');

	const currentStyleHtml = useCallback(() => {
		if (!itemToConfirm?.inCurrentStyle) {
			return null;
		}
		const { bibliographyItems, bibliographyMeta } = itemToConfirm.inCurrentStyle;
		const html = selectedStyle.styleHasBibliography ? formatBib(bibliographyItems, bibliographyMeta) : formatFallback(bibliographyItems);
		return html;
	}, [itemToConfirm, selectedStyle]);

	const incomingStyleHtml = useCallback(() => {
		if (!itemToConfirm?.inIncomingStyle) {
			return null;
		}
		const { bibliographyItems, bibliographyMeta } = itemToConfirm.inIncomingStyle;
		const html = incomingStyle.styleHasBibliography ? formatBib(bibliographyItems, bibliographyMeta) : formatFallback(bibliographyItems);
		return html;
	}, [incomingStyle, itemToConfirm]);


	const handleConfirm = useCallback(ev => {
		if(isTriggerEvent(ev)) {
			onConfirmAddConfirm(activeTab === "incoming-style-content");
		}
	}, [activeTab, onConfirmAddConfirm]);

	const handleSelectTab = useCallback(ev => {
		setActiveTab(ev.getAttribute('aria-controls'));
	}, []);

	return isReady ? (
		<Modal
			isOpen={ activeDialog === 'CONFIRM_ADD_DIALOG' }
			contentLabel="Confirm Add Citation"
			className="confirm-add-dialog modal modal-lg"
			onRequestClose={ onConfirmAddCancel }
		>
			<div className="modal-content" tabIndex={ -1 }>
				<div className="modal-header">
					<h4 className="modal-title text-truncate">
						<FormattedMessage id="zbib.dialog.confirmAddThisCitation" defaultMessage="Add this citation to your bibliography?" />
					</h4>
					<Button
						icon
						className="close"
						onClick={ onConfirmAddCancel }
					>
						<Icon type={ '24/remove' } width="24" height="24" />
					</Button>
				</div>
				<div className="modal-body">

					{ itemToConfirm.inIncomingStyle ? (
						<>
							<Tabs justified activateOnFocus>
								<Tab
									isActive={activeTab === "current-style-content"}
									aria-controls="current-style-content"
									onActivate={ handleSelectTab }
								>
									{ selectedStyle.titleShort ?? selectedStyle.title }
								</Tab>
								<Tab
									isActive={activeTab === "incoming-style-content"}
									aria-controls="incoming-style-content"
									onActivate={ handleSelectTab }
								>
									{ incomingStyle.titleShort ?? incomingStyle.title }
								</Tab>
							</Tabs>
							<TabPane
								isActive={ activeTab === "current-style-content" }
								id="current-style-content"
							>
								<div dangerouslySetInnerHTML={{ __html: currentStyleHtml() } } />
							</TabPane>
							<TabPane
								isActive={ activeTab === "incoming-style-content" }
								id="incoming-style-content"
							>
								<div dangerouslySetInnerHTML={ { __html: incomingStyleHtml() } } />
							</TabPane>
						</>
					) : (
						<div className="results">
							<div dangerouslySetInnerHTML={{ __html: currentStyleHtml() }} />
						</div>
					) }

					<div className="more-items-action">
						<Button
							autoFocus
							className="btn-outline-secondary btn-min-width"
							onClick={ handleConfirm }
							onKeyDown = { handleConfirm }
						>
							{ activeTab === "incoming-style-content"  ? (
								(incomingStyle.titleShort ?? incomingStyle.title).length > 40 ? (
									<FormattedMessage
										id="zbib.addAndSwitchShort"
										defaultMessage={"Add and switch to this style"}
									/>
								) : (
									<FormattedMessage
										id="zbib.addAndSwitch"
										defaultMessage={ "Add and switch to \"{style}\"" }
										values={ { style: incomingStyle.titleShort ?? incomingStyle.title } }
									/>
								)
							) : (
								<FormattedMessage id="zbib.general.add" defaultMessage="Add" />
							) }
						</Button>
					</div>
				</div>
			</div>
		</Modal>
	) : null;
}

ConfirmAddDialog.propTypes = {
	activeDialog: PropTypes.string,
	incomingStyle: PropTypes.object,
	selectedStyle: PropTypes.object,
	itemToConfirm: PropTypes.object,
	onConfirmAddCancel: PropTypes.func.isRequired,
	onConfirmAddConfirm: PropTypes.func.isRequired,
}

export default memo(ConfirmAddDialog);
