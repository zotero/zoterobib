'use strict';

const React = require('react');
const PropTypes = require('prop-types');
const { withRouter, Link } = require('react-router-dom');
const cx = require('classnames');

const Bibliography = require('./bibliography');
const CiteTools = require('./cite-tools');
const Confirmation = require('./confirmation');
const DeleteAllButton = require('./delete-all-button');
const Editor = require('./editor');
const ErrorMessage = require('./error-message');
const ExportTools = require('./export-tools');
const MultipleChoiceDialog = require('./multiple-choice-dialog');
const PermalinkTools = require('./permalink-tools');
const Spinner = require('zotero-web-library/lib/component/ui/spinner');
const StyleInstaller = require('./style-installer');
const StyleSelector = require('./style-selector');
const UndoMessage = require('./undo-message');
const Editable = require('zotero-web-library/lib/component/editable');
const UserTypeDetector = require('zotero-web-library/lib/enhancers/user-type-detector');

class ZBib extends React.PureComponent {
	render() {
		return (
			typeof this.props.isReadOnly === 'undefined'
				?	<div className="zotero-bib-wrap zotero-bib-loading">
						<div className="zotero-bib loading">
							<Spinner />
						</div>
					</div>
				:	<div className={ cx('zotero-bib-wrap', {
						'keyboard-user': this.props.isKeyboardUser,
						'mouse-user': this.props.isMouseUser,
						'touch-user': this.props.isTouchUser,
					}) }>
						<ErrorMessage
							message={ this.props.errorMessage }
							onDismiss={ this.props.onClearError.bind(this) }
						/>
						<UndoMessage
							message={ this.props.lastDeletedItem ? 'Item deleted' : null }
							onUndo={ this.props.onUndoDelete }
							onDismiss={ this.props.onDismissUndo }
						/>

						{
							!this.props.isReadOnly && (
								<section className="section section-md section-cite">
									<div className="container">
										<h1 className="brand">
											<Link to="/">
												ZBib

												<svg width="100" height="46" viewBox="0 0 100 46">
													<g>
														<path d="M20.92,19.048,5.576,39.208h15.9v3.36H.2V39.88L15.544,19.72H.984V16.36H20.92Z" fill="#e52e3d"/>
														<path d="M26.033.232h3.7v20.5h.112a9.617,9.617,0,0,1,2.128-2.3,13.238,13.238,0,0,1,2.576-1.568,12.389,12.389,0,0,1,2.772-.9,14.178,14.178,0,0,1,2.716-.28,14.827,14.827,0,0,1,5.628,1.036,12.99,12.99,0,0,1,7.28,7.252,15.051,15.051,0,0,1,0,10.976A12.99,12.99,0,0,1,45.66,42.2a14.827,14.827,0,0,1-5.628,1.036,14.139,14.139,0,0,1-2.716-.28,12.339,12.339,0,0,1-2.772-.9A13.167,13.167,0,0,1,31.968,40.5a9.608,9.608,0,0,1-2.128-2.3h-.112v4.368h-3.7ZM49.944,29.464a11.763,11.763,0,0,0-.7-4.088,9.849,9.849,0,0,0-1.988-3.3,9.355,9.355,0,0,0-3.108-2.212,10.013,10.013,0,0,0-4.116-.812,10.609,10.609,0,0,0-4.2.812,10.385,10.385,0,0,0-3.3,2.212,9.994,9.994,0,0,0-2.184,3.3,11.047,11.047,0,0,0,0,8.176,9.979,9.979,0,0,0,2.184,3.3,10.352,10.352,0,0,0,3.3,2.212,10.592,10.592,0,0,0,4.2.812,10,10,0,0,0,4.116-.812,9.327,9.327,0,0,0,3.108-2.212,9.835,9.835,0,0,0,1.988-3.3A11.759,11.759,0,0,0,49.944,29.464Z" fill="#222"/>
														<path d="M64.482,6.28a2.483,2.483,0,0,1-.84,1.932,2.637,2.637,0,0,1-3.7,0,2.483,2.483,0,0,1-.84-1.932,2.484,2.484,0,0,1,.84-1.932,2.637,2.637,0,0,1,3.7,0A2.485,2.485,0,0,1,64.482,6.28Zm-.84,36.288h-3.7V16.36h3.7Z" fill="#222"/>
														<path d="M71.465.232h3.7v20.5h.112a9.617,9.617,0,0,1,2.128-2.3,13.238,13.238,0,0,1,2.576-1.568,12.389,12.389,0,0,1,2.772-.9,14.178,14.178,0,0,1,2.716-.28,14.827,14.827,0,0,1,5.628,1.036,12.99,12.99,0,0,1,7.28,7.252,15.051,15.051,0,0,1,0,10.976,12.99,12.99,0,0,1-7.28,7.252,14.827,14.827,0,0,1-5.628,1.036,14.139,14.139,0,0,1-2.716-.28,12.339,12.339,0,0,1-2.772-.9A13.167,13.167,0,0,1,77.4,40.5a9.608,9.608,0,0,1-2.128-2.3H75.16v4.368h-3.7ZM95.376,29.464a11.763,11.763,0,0,0-.7-4.088,9.849,9.849,0,0,0-1.988-3.3A9.355,9.355,0,0,0,89.58,19.86a10.013,10.013,0,0,0-4.116-.812,10.609,10.609,0,0,0-4.2.812,10.385,10.385,0,0,0-3.3,2.212,9.994,9.994,0,0,0-2.184,3.3,11.047,11.047,0,0,0,0,8.176,9.979,9.979,0,0,0,2.184,3.3,10.352,10.352,0,0,0,3.3,2.212,10.592,10.592,0,0,0,4.2.812,10,10,0,0,0,4.116-.812,9.327,9.327,0,0,0,3.108-2.212,9.835,9.835,0,0,0,1.988-3.3A11.759,11.759,0,0,0,95.376,29.464Z" fill="#222"/>
													</g>
												</svg>
											</Link>
										</h1>
										<p className="brand-subhead">
											<a href="https://www.zotero.org">
												by Zotero

												<svg width="54" height="14" viewBox="0 0 54 14">
													<g>
														<path d="M1.033,1.928h1.08v4.2h.023a1.973,1.973,0,0,1,.828-.7,2.642,2.642,0,0,1,1.152-.258A3.011,3.011,0,0,1,5.31,5.4a2.678,2.678,0,0,1,.912.63,2.79,2.79,0,0,1,.582.948,3.354,3.354,0,0,1,.2,1.182,3.307,3.307,0,0,1-.2,1.176,2.865,2.865,0,0,1-.582.948,2.627,2.627,0,0,1-.912.636,3.011,3.011,0,0,1-1.193.228,2.646,2.646,0,0,1-1.122-.252,2.055,2.055,0,0,1-.858-.708H2.113V11H1.033Zm2.951,8.208a1.952,1.952,0,0,0,.78-.15,1.715,1.715,0,0,0,.588-.408,1.793,1.793,0,0,0,.372-.624,2.482,2.482,0,0,0,0-1.6,1.8,1.8,0,0,0-.372-.624,1.722,1.722,0,0,0-.588-.408,1.952,1.952,0,0,0-.78-.15,1.948,1.948,0,0,0-.779.15,1.712,1.712,0,0,0-.588.408,1.8,1.8,0,0,0-.372.624,2.482,2.482,0,0,0,0,1.6,1.793,1.793,0,0,0,.372.624,1.706,1.706,0,0,0,.588.408A1.948,1.948,0,0,0,3.984,10.136Z" fill="#222"/>
														<path d="M7.692,5.312H8.94l1.685,4.44h.024l1.615-4.44h1.152l-2.7,6.912a7.345,7.345,0,0,1-.3.678,2.06,2.06,0,0,1-.37.522,1.5,1.5,0,0,1-.521.336,2.042,2.042,0,0,1-.746.12,3.968,3.968,0,0,1-.484-.03,1.755,1.755,0,0,1-.472-.126l.131-.984a1.69,1.69,0,0,0,.644.132,1.2,1.2,0,0,0,.424-.066.838.838,0,0,0,.3-.192,1.128,1.128,0,0,0,.209-.294q.083-.168.167-.384l.35-.9Z" fill="#222"/>
														<path d="M17.268,9.92,22.1,3.584H17.412V2.5h6.132v1.08L18.732,9.92h4.885V11H17.268Z" fill="#222"/>
														<path d="M24.54,8.156a2.891,2.891,0,0,1,.234-1.164,3.035,3.035,0,0,1,5.579,0,2.891,2.891,0,0,1,.234,1.164,2.961,2.961,0,0,1-.876,2.118,3.054,3.054,0,0,1-.96.636,3.074,3.074,0,0,1-3.336-.636,2.961,2.961,0,0,1-.876-2.118Zm1.152,0a2.341,2.341,0,0,0,.132.8,1.793,1.793,0,0,0,.372.624,1.706,1.706,0,0,0,.588.408,2.1,2.1,0,0,0,1.56,0,1.715,1.715,0,0,0,.588-.408,1.793,1.793,0,0,0,.372-.624,2.482,2.482,0,0,0,0-1.6,1.8,1.8,0,0,0-.372-.624,1.722,1.722,0,0,0-.588-.408,2.1,2.1,0,0,0-1.56,0,1.712,1.712,0,0,0-.588.408,1.8,1.8,0,0,0-.372.624A2.34,2.34,0,0,0,25.693,8.156Z" fill="#222"/>
														<path d="M34.992,6.248H33.445v2.58q0,.24.012.474a1.247,1.247,0,0,0,.09.42.675.675,0,0,0,.24.3.817.817,0,0,0,.474.114,2.3,2.3,0,0,0,.4-.036,1.137,1.137,0,0,0,.372-.132v.984a1.426,1.426,0,0,1-.5.15,3.774,3.774,0,0,1-.475.042,2.176,2.176,0,0,1-.966-.174,1.193,1.193,0,0,1-.5-.45,1.458,1.458,0,0,1-.192-.618c-.02-.228-.029-.458-.029-.69V6.248H31.117V5.312h1.248v-1.6h1.08v1.6h1.548Z" fill="#222"/>
														<path d="M37.2,8.552a1.421,1.421,0,0,0,.162.678,1.694,1.694,0,0,0,.426.522,1.956,1.956,0,0,0,.612.336,2.187,2.187,0,0,0,.72.12A1.613,1.613,0,0,0,40,9.974a2.821,2.821,0,0,0,.685-.618l.815.624a3,3,0,0,1-2.52,1.164,3.13,3.13,0,0,1-1.218-.228,2.649,2.649,0,0,1-.925-.63,2.805,2.805,0,0,1-.582-.948,3.355,3.355,0,0,1-.2-1.182,3.1,3.1,0,0,1,.222-1.182,2.909,2.909,0,0,1,.612-.948,2.79,2.79,0,0,1,.93-.63,2.992,2.992,0,0,1,1.176-.228,2.816,2.816,0,0,1,1.278.264,2.519,2.519,0,0,1,.857.69,2.725,2.725,0,0,1,.486.96,4.014,4.014,0,0,1,.15,1.086v.384Zm3.408-.864a2.263,2.263,0,0,0-.114-.66,1.452,1.452,0,0,0-.306-.522,1.414,1.414,0,0,0-.51-.348,1.868,1.868,0,0,0-.714-.126,1.732,1.732,0,0,0-.727.15,1.769,1.769,0,0,0-.558.39,1.8,1.8,0,0,0-.354.534,1.471,1.471,0,0,0-.126.582Z" fill="#222"/>
														<path d="M43.056,5.312h1.08v.876h.023a1.547,1.547,0,0,1,.288-.414,1.918,1.918,0,0,1,.4-.318,2.128,2.128,0,0,1,.485-.21,1.849,1.849,0,0,1,.528-.078,1.5,1.5,0,0,1,.479.072L46.3,6.4c-.088-.024-.176-.043-.264-.06a1.46,1.46,0,0,0-.264-.024,1.588,1.588,0,0,0-1.212.444,1.949,1.949,0,0,0-.42,1.38V11h-1.08Z" fill="#222"/>
														<path d="M47,8.156a2.891,2.891,0,0,1,.234-1.164,3.035,3.035,0,0,1,5.579,0,2.891,2.891,0,0,1,.234,1.164,2.961,2.961,0,0,1-.876,2.118,3.054,3.054,0,0,1-.96.636,3.074,3.074,0,0,1-3.336-.636A2.961,2.961,0,0,1,47,8.156Zm1.152,0a2.341,2.341,0,0,0,.132.8,1.793,1.793,0,0,0,.372.624,1.706,1.706,0,0,0,.588.408,2.1,2.1,0,0,0,1.56,0,1.715,1.715,0,0,0,.588-.408,1.793,1.793,0,0,0,.372-.624,2.482,2.482,0,0,0,0-1.6,1.8,1.8,0,0,0-.372-.624,1.722,1.722,0,0,0-.588-.408,2.1,2.1,0,0,0-1.56,0,1.712,1.712,0,0,0-.588.408,1.8,1.8,0,0,0-.372.624A2.34,2.34,0,0,0,48.157,8.156Z" fill="#222"/>
													</g>
												</svg>
											</a>
										</p>
										<CiteTools { ...this.props } />
									</div>
								</section>
							)
						}

						<section className="section section-md section-bibliography">
							<div className="container">
								<Editable
									name="title"
									processing={ false }
									value={ this.props.title || 'Untitled' }
									editOnClick = { true }
									onSave={ newTitle => this.props.onTitleChanged(newTitle) }
								>
									{
										this.props.isReadOnly ? (
											<h1>
												{ this.props.title || 'Untitled' }
											</h1>
										) : (
											<h2>
												{ this.props.title || 'Untitled' }
											</h2>
										)
									}
								</Editable>
								<StyleSelector { ...this.props } />
								{
									this.props.isLoadingCitations ? (
										<div className="zotero-citations-loading hidden-xs-down">
											<Spinner />
										</div>
									) : <Bibliography { ...this.props } />
								}
								{
									!this.props.isReadOnly && <DeleteAllButton { ...this.props } />
								}
							</div>
						</section>

						{
							!this.props.isReadOnly && (
								<section className="section section-export">
									<div className="container">
										<h2>Export</h2>
										<ExportTools { ...this.props } />
									</div>
								</section>
							)
						}
						{
							!this.props.isReadOnly && (
								<section className="section section-link">
									<div className="container">
										<h2>Link to this version</h2>
										<PermalinkTools { ...this.props } />
									</div>
								</section>
							)
						}

						<Confirmation
							isOpen={ this.props.isConfirmingStyleSwitch }
							onConfirm={ this.props.onStyleSwitchConfirm }
							onCancel={ this.props.onStyleSwitchCancel }
							title="Converting Titles to Sentence Case"
								confirmLabel="Continue"
							>
								<p>The selected citation style requires titles to be in sentence case rather
								than title case (e.g., “Circadian mood variations in Twitter content” rather
								than “Circadian Mood Variations in Twitter Content”). ZBib partially
								automates this for you by converting the titles of entries to sentence case.
								You will need to manually adjust your entries to capitalize proper nouns
								(e.g., “Twitter” in the above example) and, if the style requires it, the
								first word after the colon in subtitles.</p>

								<p>If you later switch to a citation style that requires title case, ZBib
								can automatically generate title-cased titles without changing your stored
								entries.</p>
						</Confirmation>
						<MultipleChoiceDialog { ...this.props } />
						<StyleInstaller { ...this.props } />
						<Editor { ...this.props } />
					</div>

		);
	}

	static defaultProps = {
		citations: {},
	}

	static propTypes = {
		citations: PropTypes.object,
		citationStyle: PropTypes.string,
		citationStyles: PropTypes.array,
		error: PropTypes.string,
		errorMessage: PropTypes.string,
		getCopyData: PropTypes.func.isRequired,
		getFileData: PropTypes.func.isRequired,
		history: PropTypes.object,
		isConfirmingStyleSwitch: PropTypes.bool,
		isKeyboardUser: PropTypes.bool,
		isLoading: PropTypes.bool,
		isLoadingCitations: PropTypes.bool,
		isMouseUser: PropTypes.bool,
		isPickingItem: PropTypes.bool,
		isReadOnly: PropTypes.bool,
		isSaving: PropTypes.bool,
		isTouchUser: PropTypes.bool,
		isTranslating: PropTypes.bool,
		items: PropTypes.array,
		itemsCount: PropTypes.number,
		lastDeletedItem: PropTypes.object,
		match: PropTypes.object,
		multipleChoiceItems: PropTypes.array,
		onCitationStyleChanged: PropTypes.func.isRequired,
		onClearError: PropTypes.func.isRequired,
		onDeleteCitations: PropTypes.func.isRequired,
		onDismissUndo: PropTypes.func.isRequired,
		onError: PropTypes.func.isRequired,
		onItemCreated: PropTypes.func.isRequired,
		onItemUpdate: PropTypes.func.isRequired,
		onMultipleChoiceCancel: PropTypes.func.isRequired,
		onMultipleChoiceSelect: PropTypes.func.isRequired,
		onOverride: PropTypes.func.isRequired,
		onSave: PropTypes.func.isRequired,
		onStyleSwitchCancel: PropTypes.func.isRequired,
		onStyleSwitchConfirm: PropTypes.func.isRequired,
		onTitleChanged: PropTypes.func.isRequired,
		onTranslationRequest: PropTypes.func.isRequired,
		onUndoDelete: PropTypes.func.isRequired,
		permalink: PropTypes.string,
		title: PropTypes.string,
		url: PropTypes.string,
	}
}

module.exports = withRouter(UserTypeDetector(ZBib));
