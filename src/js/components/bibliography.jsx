'use strict';

const React = require('react');
const PropTypes = require('prop-types');
const { withRouter } = require('react-router-dom');
const { Toolbar, ToolGroup } = require('zotero-web-library/lib/component/ui/toolbars');
const Button = require('zotero-web-library/lib/component/ui/button');
const Icon = require('zotero-web-library/lib/component/ui/icon');

class Bibliography extends React.PureComponent {
	handleEditCitation(itemId) {
		this.props.onEditorOpen(itemId);
	}

	handleDeleteCitation(itemId) {
		this.props.onDeleteEntry(itemId);
	}

	render() {
		return (
			<ul className="bibliography">
				{
					Object.keys(this.props.citations).map(itemId => {
						return (
							<li className="citation" key={ itemId }
								onClick={ () => this.handleEditCitation(itemId) }
								tabIndex={0}
							>
								<div className="csl-entry-container"
									dangerouslySetInnerHTML={ { __html: this.props.citations[itemId] } }
								/>
								{
									!this.props.isReadOnly && (
										<Button onClick={ () => this.handleDeleteCitation(itemId) }>
											<Icon type={ '16/trash' } width="16" height="16" />
											</Button>
									)
								}
							</li>
						);
					})
				}
			</ul>
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


module.exports = withRouter(Bibliography);
