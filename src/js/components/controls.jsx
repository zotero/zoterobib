'use strict';

const React = require('react');
const PropTypes = require('prop-types');
const { withRouter, Link } = require('react-router-dom');
const citationStyles = require('../constants/citation-styles');

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
			<div>
				<Toolbar className="hidden-xs-down toolbar-large">
					<div className="toolbar-left">
						<div className="logo">
							<Link to="/">
								ZBib
							</Link>
						</div>
						<StyleSelector
							citationStyle={ this.props.citationStyle }
							citationStyles= { citationStyles }
							onCitationStyleChanged={ this.props.onCitationStyleChanged }
						/>
					</div>
					<div className="toolbar-right">
						<Link to={ '/editor' }>
							<Button>
								Manual Entry
							</Button>
						</Link>
						<Popover 
							className="permalink-dialog-popover"
							isOpen={ this.state.isPermalinkDialogOpen }
							preferPlace="end"
							place="below"
							body={
									this.props.permalink ? (
										<div className="permalink-dialog">
											<input 
												value={ this.props.permalink } 
												onClick={ ev => ev.target.select() }
												readOnly
											/>
											<ClipboardButton
												className="btn"
												data-clipboard-text={ this.props.permalink }
												onSuccess={ this.handleClipoardSuccess.bind(this) }
											>
												{ this.state.clipboardConfirmation ? 'Copied!' : 'Copy' }
											</ClipboardButton>
										</div>
									) : (
										<div className="permalink-dialog">
											Please Wait...
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
									getExportData={ this.props.getExportData }
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
				<Toolbar className="hidden-sm-up">
					<div className="toolbar-left">
						<ToolGroup>
							<Link to={ '/editor' }>
								<Button>
									<Icon type={ '16/new' } width="16" height="16" />
								</Button>
							</Link>
							<Link to={ '/style-selector' }>
								<Button>
									<Icon type={ '16/cog' } width="16" height="16" />
								</Button>
							</Link>
							<Link to={ Object.keys(this.props.citations).length === 0 ? '' : '/export-dialog' }>
								<Button>
									<Icon 
										color={ Object.keys(this.props.citations).length === 0 ? 'rgba(0, 0, 0, 0.15)' : null}
										type={ '16/export' }
										width="16"
										height="16"
									/>
								</Button>
							</Link>
							<Button
								disabled={ Object.keys(this.props.citations).length === 0 } 
								onClick={ this.handleOpenDeleteModal.bind(this) }
							>
								<Icon 
									color={ Object.keys(this.props.citations).length === 0 ? 'rgba(0, 0, 0, 0.15)' : null}
									type={ '16/trash' }
									width="16"
									height="16"
								/>
						</Button>
						</ToolGroup>
					</div>
				</Toolbar>
				<UrlInput
					url={ this.props.url }
					isTranslating={ this.props.isTranslating }
					onTranslationRequest={ this.props.onTranslationRequest }
				/>
				<ReactModal 
					isOpen={ this.state.isDeleteModalOpen }
					contentLabel="Delete all citations?"
					className="modal"
					overlayClassName="overlay"
				>
					<h1 className="title">
						Delete all citations?
					</h1>
					<p>
						Confirm deletion of { entriesCount } { entriesCount > 1 ? 'entries' : 'entry' } in the editor.
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
		getExportData: PropTypes.func.isRequired,
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