'use strict';

const React = require('react');
const PropTypes = require('prop-types');
const { withRouter, Link } = require('react-router-dom');
const { Toolbar, ToolGroup } = require('zotero-web-library/lib/component/ui/toolbars');
const Button = require('zotero-web-library/lib/component/ui/button');
const Icon = require('zotero-web-library/lib/component/ui/icon');

class Citations extends React.PureComponent {
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
													<Link to={ `${this.props.match.url}editor/${itemId}` } >
														<Button>
															<Icon type={ '16/pencil' } width="16" height="16" />
														</Button>
													</Link>
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
		onDeleteEntry: PropTypes.func.isRequired
	}
}


module.exports = withRouter(Citations);