'use strict';

const React = require('react');
const PropTypes = require('prop-types');
const { withRouter } = require('react-router-dom');
const { Toolbar, ToolGroup } = require('zotero-web-library/lib/component/ui/toolbars');
const Button = require('zotero-web-library/lib/component/ui/button');
const Icon = require('zotero-web-library/lib/component/ui/icon');

class Citations extends React.PureComponent {
	handleEditCitation(itemId) {
		this.props.onEditorOpen(itemId);
	}

	handleDeleteCitation(itemId) {
		this.props.onDeleteEntry(itemId);
	}

	render() {
		return (
			<div className="citations">
				{
					Object.keys(this.props.citations).map(itemId => {
						return (
							<div className="citation-wrap" key={ itemId }>
								<div className="citation">
									<div dangerouslySetInnerHTML={ { __html: this.props.citations[itemId] } } />
								</div>
								{
									!this.props.isReadOnly && (
										<Toolbar>
											<div className="toolbar-right">
												<ToolGroup>
													<Button onClick={ () => this.handleEditCitation(itemId) }>
														<Icon type={ '16/pencil' } width="16" height="16" />
													</Button>
													<Button onClick={ () => this.handleDeleteCitation(itemId) }>
														<Icon type={ '16/trash' } width="16" height="16" />
													</Button>
												</ToolGroup>
											</div>
										</Toolbar>
									)
								}
							</div>
						);
					})
				}
			</div>
		);
	}

	static defaultProps = {
		citations: {}
	}

	static propTypes = {
		citations: PropTypes.object,
		isReadOnly: PropTypes.bool,
		match: PropTypes.object,
		onDeleteEntry: PropTypes.func.isRequired,
		onEditorOpen:  PropTypes.func.isRequired,
	}
}


module.exports = withRouter(Citations);
