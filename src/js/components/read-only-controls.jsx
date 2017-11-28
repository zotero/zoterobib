'use strict';

const React = require('react');
const PropTypes = require('prop-types');
const { withRouter, Link } = require('react-router-dom');

const Popover = require('react-popover');
const { Toolbar } = require('zotero-web-library/lib/component/ui/toolbars');
const ReactModal = require('react-modal');
const Button = require('zotero-web-library/lib/component/ui/button');
const ExportDialog = require('./export-dialog');

class ReadOnlyControls extends React.PureComponent {
	constructor(props) {
		super(props);
		this.state = {
			showModal: false,
			isExportDialogOpen: false
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
	}

	handleOpenModal() {
		this.setState({ showModal: true });
	}

	handleCloseModal() {
		this.setState({ showModal: false });
	}

	handleEdit() {
		if(this.props.localCitationsCount > 0) {
			this.handleOpenModal();
		} else {
			this.handleOverride();
		}
	}

	handleOverride() {
		this.props.onOverride();
		this.handleCloseModal();
	}

	render() {
		return(
			<div>
				<Toolbar className="toolbar-large">
					<div className="toolbar-left">
						<div className="logo">
							<Link to="/">
								ZBib
							</Link>
						</div>
					</div>
					<div className="toolbar-right">
						<Link to={ `/${this.props.match.params.id}/export-dialog` }>
							<Button className="hidden-sm-up">
								Export
							</Button>
						</Link>
						<Popover
							className="export-dialog-popover"
							isOpen={ this.state.isExportDialogOpen }
							preferPlace="end"
							place="below"
							body={
								<ExportDialog
									isReadOnly={ true }
									onExported={ () => this.setState({ isExportDialogOpen: false }) }
									getExportData={ this.props.getExportData }
								/>
							}
						>
							<Button 
								className="btn btn-drop-down export-button hidden-xs-down"
								onClick={ () => this.setState({ isExportDialogOpen: !this.state.isExportDialogOpen }) }
							>
								Export
							</Button>
						</Popover>
						<Button onClick={ this.handleEdit.bind(this) }>
							Edit Bibliography
						</Button>
					</div>
				</Toolbar>
				<ReactModal 
					isOpen={ this.state.showModal }
					contentLabel="Clear Existing Bibliography?"
					className="modal"
					overlayClassName="overlay"
				>
					<h1 className="title">
						Clear existing bibliography?
					</h1>
					<p>
						There is an existing bibliography with { this.props.localCitationsCount } { this.props.localCitationsCount > 1 ? 'entries' : 'entry' } in the editor. If you continue, the existing bibliography will be replaced with this one.
					</p>
					<p className="buttons">
						<Button onClick={ this.handleCloseModal.bind(this) }>Cancel</Button>
						<Button onClick={ this.handleOverride.bind(this) }>Continue</Button>
					</p>
				</ReactModal>
			</div>
		);
	}

	static defaultProps = {
		citations: {},
		localCitationsCount: 0
	}
	
	static propTypes = {
		localCitationsCount: PropTypes.number,
		citations: PropTypes.object,
		onOverride: PropTypes.func,
		getExportData: PropTypes.func,
	}
}

module.exports = withRouter(ReadOnlyControls);