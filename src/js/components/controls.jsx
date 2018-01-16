'use strict';

const React = require('react');
const PropTypes = require('prop-types');
const { withRouter, Link } = require('react-router-dom');

const ReactModal = require('react-modal');
const Popover = require('react-popover');
const { Toolbar, ToolGroup } = require('zotero-web-library/lib/component/ui/toolbars');
const UrlInput = require('./url-input');
const Button = require('zotero-web-library/lib/component/ui/button');
const StyleSelector = require('./style-selector');
const ExportDialog = require('./export-dialog');
const Icon = require('zotero-web-library/lib/component/ui/icon');
const Spinner = require('zotero-web-library/lib/component/ui/spinner');
const ClipboardButton = require('react-clipboard.js').default;

class Controls extends React.PureComponent {
	constructor(props) {
		super(props);
		this.state = {
			isExportDialogOpen: false,
			isPermalinkDialogOpen: false,
			clipboardConfirmation: false
		};
		this.handleDocumentClick = this.handleDocumentClick.bind(this);
	}

	componentDidMount() {
		window.addEventListener(
			'click',
			this.handleDocumentClick
		);
	}

	componentWillUnmount() {
		window.removeEventListener('click', this.handleDocumentClick);
	}

	handleDocumentClick(ev) {
		if(!ev.target.closest('.export-button') && !ev.target.closest('.export-dialog-popover')) {
			this.setState({ isExportDialogOpen: false });
		}

		if(!ev.target.closest('.permalink-button') && !ev.target.closest('.permalink-dialog-popover')) {
			this.handlePermalinkDialogClose();
		}
	}

	handlePermalinkDialog() {
		this.setState({
			isPermalinkDialogOpen: !this.state.isPermalinkDialogOpen
		}, async () => {
			if(!this.props.permalink) {
				this.props.onSave();
			}
		});
	}

	handlePermalinkDialogClose() {
		this.setState({
			isPermalinkDialogOpen: false,
			clipboardConfirmation: false
		});
	}

	handleClipoardSuccess() {
		if(this.state.clipboardConfirmation) {
			return;
		}

		this.setState({
			clipboardConfirmation: true
		}, () => {
			setTimeout(this.handlePermalinkDialogClose.bind(this), 500);
		});
	}

	handleOpenDeleteModal() {
		this.setState({ isDeleteModalOpen: true });
	}

	handleCloseDeleteModal() {
		this.setState({ isDeleteModalOpen: false });
	}

	handleDeleteAllCitations() {
		this.setState({ isDeleteModalOpen: false });
		this.props.onDeleteCitations();
	}

	render() {
		const entriesCount = Object.keys(this.props.citations).length;
		return (
			<div className="cite-container">
				<h1 className="brand">
					<Link to="/">
						ZBib
					</Link>
				</h1>
				<p className="subhead">by Zotero</p>

				<UrlInput
					url={ this.props.url }
					isTranslating={ this.props.isTranslating }
					onTranslationRequest={ this.props.onTranslationRequest }
				/>

				<Link to={ '/editor' }>
					<Button>
						Manual Entry
					</Button>
				</Link>

				<Toolbar className="hidden-xs-down toolbar-large">
					<div className="toolbar-right">
						<Popover
							className="permalink-dialog-popover"
							isOpen={ this.state.isPermalinkDialogOpen }
							preferPlace="end"
							place="below"
							body={
									this.props.permalink ? (
										<div className="permalink-dialog">
											<ClipboardButton
												className="btn btn-primary"
												data-clipboard-text={ this.props.permalink }
												onSuccess={ this.handleClipoardSuccess.bind(this) }
											>
												{ this.state.clipboardConfirmation ? 'Copied!' : 'Copy URL' }
											</ClipboardButton>
											<Button>
												<a href={ this.props.permalink }>
													View
												</a>
											</Button>
										</div>
									) : (
										<div className="permalink-dialog">
											<Spinner />
										</div>
									)
							}
						>
							<Button
								disabled={ Object.keys(this.props.citations).length === 0 }
								className="btn btn-drop-down permalink-button"
								onClick={ this.handlePermalinkDialog.bind(this) }
							>
								Link to This Version
							</Button>
						</Popover>
						<Popover
							className="export-dialog-popover"
							isOpen={ this.state.isExportDialogOpen }
							preferPlace="end"
							place="below"
							body={
								<ExportDialog
									onExported={ () => this.setState({ isExportDialogOpen: false }) }
									getCopyData = { this.props.getCopyData }
									getFileData = { this.props.getFileData }
								/>
							}
						>
							<Button
								disabled={ Object.keys(this.props.citations).length === 0 }
								className="btn btn-drop-down export-button"
								onClick={ () => this.setState({ isExportDialogOpen: !this.state.isExportDialogOpen }) }
							>
								Export
							</Button>
						</Popover>
						<Button
							disabled={ Object.keys(this.props.citations).length === 0 }
							onClick={ this.handleOpenDeleteModal.bind(this) }
						>
							Delete All
						</Button>
					</div>
				</Toolbar>

				<ReactModal
					isOpen={ this.state.isDeleteModalOpen }
					contentLabel="Delete all entries?"
					className="modal"
					overlayClassName="overlay"
				>
					<h1 className="title">
						Delete all entries?
					</h1>
					<p>
						{ entriesCount } { entriesCount > 1 ? 'entries' : 'entry' } will be removed.
					</p>
					<p className="buttons">
						<Button onClick={ this.handleCloseDeleteModal.bind(this) }>Cancel</Button>
						<Button onClick={ this.handleDeleteAllCitations.bind(this) }>Delete</Button>
					</p>
				</ReactModal>
			</div>
		);
	}

	static defaultProps = {
		citations: {}
	}

	static propTypes = {
		citations: PropTypes.object,
		citationStyle: PropTypes.string,
		getCopyData: PropTypes.func.isRequired,
		getFileData: PropTypes.func.isRequired,
		isTranslating: PropTypes.bool,
		match: PropTypes.object,
		onCitationStyleChanged: PropTypes.func.isRequired,
		onSave: PropTypes.func.isRequired,
		onTranslationRequest: PropTypes.func.isRequired,
		onDeleteCitations: PropTypes.func.isRequired,
		permalink: PropTypes.string,
		url: PropTypes.string,
	}
}

module.exports = withRouter(Controls);
