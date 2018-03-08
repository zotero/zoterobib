'use strict';

const React = require('react');
const PropTypes = require('prop-types');

const Editable = require('zotero-web-library/lib/component/editable');
const Button = require('zotero-web-library/lib/component/ui/button');
const Icon = require('zotero-web-library/lib/component/ui/icon');
const StyleSelector = require('./style-selector');
const Bibliography = require('./bibliography');
const DeleteAllButton = require('./delete-all-button');
const Spinner = require('zotero-web-library/lib/component/ui/spinner');

class BibliographySection extends React.PureComponent {
	handleEditInput() {
		this.editable.edit();
	}

	renderBibliography() {
		if (Object.keys(this.props.citations).length === 0) {
			return (
				<React.Fragment>
					<img className="empty-bibliography" src="static/images/empty-bibliography.svg" width="320" height="200" />
					<h2 className="empty-title">Your bibliography is empty.</h2>
					<p className="lead empty-lead">To add your sources simply enter an URL, ISBN, DOI, or PMID in the search box above. Of course you can add them manually too.</p>
				</React.Fragment>
			);
		} else {
			return (
				<React.Fragment>
					{
						this.props.isReadOnly ? (
							<h1>
								{ this.props.title || 'Untitled' }
							</h1>
						) : (
							<h2 className="bibliography-title">
								<Editable
									ref={ editable => this.editable = editable }
									name="title"
									processing={ false }
									value={ this.props.title || 'Untitled' }
									editOnClick = { true }
									onSave={ newTitle => this.props.onTitleChanged(newTitle) }
								/>
								<Button onClick={ this.handleEditInput.bind(this) }>
									<Icon type={ '28/pencil' } width="28" height="28" />
								</Button>
							</h2>
						)
					}
					{
						!this.props.isReadOnly && <StyleSelector { ...this.props } />
					}
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
				</React.Fragment>
			);
		}
	}

	render() {
		return (
			<section className="section section-bibliography">
				<div className="container">
					{ this.renderBibliography() }
				</div>
			</section>
		);
	}

	static defaultProps = {
		citations: {},
	}

	static propTypes = {
		citations: PropTypes.object,
		isReadOnly: PropTypes.bool,
		title: PropTypes.string,
		onTitleChanged: PropTypes.func.isRequired,
		isLoadingCitations: PropTypes.bool,
	}
}

module.exports = BibliographySection;
