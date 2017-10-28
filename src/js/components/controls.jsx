const React = require('react');
const { withRouter, Link } = require('react-router-dom');
const citationStyles = require('../constants/citation-styles');

const Popover = require('react-popover');
const { Toolbar, ToolGroup } = require('zotero-web-library/lib/component/ui/toolbars');
const UrlInput = require('./url-input');
const Button = require('zotero-web-library/lib/component/ui/button');
const StyleSelector = require('./style-selector');
const ExportDialog = require('./export-dialog');
const Icon = require('zotero-web-library/lib/component/ui/icon');

class Controls extends React.PureComponent {
	constructor(props) {
		super(props);
		this.state = {
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
		if(!ev.target.closest('.export-button') && !ev.target.closest('.Popover')) {
			this.setState({ isExportDialogOpen: false });
		}
	}

	render() {
		return (
			<div>
				<Toolbar className="hidden-xs-down toolbar-large">
					<div className="toolbar-left">
						<StyleSelector
							citationStyle={ this.props.citationStyle }
							citationStyles= { citationStyles }
							onCitationStyleChanged={ this.props.onCitationStyleChanged }
						/>
					</div>
					<div className="toolbar-right">
						<Link to={ `${this.props.match.url}editor/` }>
							<Button>
								Manual Entry
							</Button>
						</Link>

						<Button 
							onClick={ this.props.onSave }
							disabled={ this.props.isSaving }
						>
							{ this.state.isSaving ? 'Saving...' : 'Save' }
						</Button>
						<Popover 
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
								className="export-button"
								onClick={ () => this.setState({ isExportDialogOpen: !this.state.isExportDialogOpen }) }
							>
								Export
							</Button>
						</Popover>
					</div>
				</Toolbar>
				<Toolbar className="hidden-sm-up">
					<div className="toolbar-left">
						<ToolGroup>
							<Link to={ `${this.props.match.url}editor/` }>
								<Button>
									<Icon type={ '16/new' } width="16" height="16" />
								</Button>
							</Link>
							<Link to={ `${this.props.match.url}export-dialog/` }>
								<Button>
									<Icon type={ '16/export' } width="16" height="16" />
								</Button>
							</Link>
							<Link to={ `${this.props.match.url}style-selector/` }>
								<Button>
									<Icon type={ '16/cog' } width="16" height="16" />
								</Button>
							</Link>
							<Button 
								onClick={ this.props.onSave }
								disabled={ this.props.isSaving }
							>
								<Icon type={ '16/floppy' } width="16" height="16" />
							</Button>
						</ToolGroup>
					</div>
				</Toolbar>
				<UrlInput
					url={ this.props.url }
					busy={ this.props.isBusy }
					onTranslationRequest={ this.props.onTranslationRequest }
				/>
			</div>
		);
	}
}

module.exports = withRouter(Controls);