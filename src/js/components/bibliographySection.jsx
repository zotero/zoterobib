'use strict';

const React = require('react');
const PropTypes = require('prop-types');
const cx = require('classnames');

const Editable = require('zotero-web-library/src/js/component/editable');
const Button = require('zotero-web-library/src/js/component/ui/button');
const Icon = require('zotero-web-library/src/js/component/ui/icon');
const StyleSelector = require('./style-selector');
const Bibliography = require('./bibliography');
const DeleteAllButton = require('./delete-all-button');
const Spinner = require('zotero-web-library/src/js/component/ui/spinner');
const Confirmation = require('./confirmation');

class BibliographySection extends React.PureComponent {
	state = {
		isConfirmingOverride: false,
		isEditingTitle: false
	}

	handleTitleEdit() {
		this.setState({
			isEditingTitle: true
		});
	}

	handleTitleCommit(newValue, hasChanged) {
		if(hasChanged) {
			this.props.onTitleChanged(newValue);
		}
		this.setState({
			isEditingTitle: false
		});
	}

	handleTitleCancel() {
		this.setState({
			isEditingTitle: false
		});
	}

	handleEditBibliography() {
		if(this.props.localCitationsCount > 0) {
			this.setState({ isConfirmingOverride: true });
		} else {
			this.props.onOverride();
		}
	}

	handleOverride() {
		this.props.onOverride();
	}

	handleCancel() {
		this.setState({ isConfirmingOverride: false });
	}

	renderBibliography() {
		if (this.props.items.length === 0) {
			return (
				<React.Fragment>
					<img className="empty-bibliography" src="static/images/empty-bibliography.svg" width="150" height="150" />
					<h2 className="empty-title"><span style={{ 'letterSpacing': '-0.092em' }}>Y</span>our bibliography is empty.</h2>
					<p className="lead empty-lead"><span style={{ 'letterSpacing': '-0.111em' }}>T</span>o suggest a new citation, enter an URL, ISBN, DOI, PubMed ID (PMID), arXiv ID, or title.</p>
				</React.Fragment>
			);
		} else {
			return (
				<React.Fragment>
					{
						this.props.isReadOnly ? (
							<h1 className="h2 bibliography-title">
								{ this.props.title || 'Bibliography' }
							</h1>
						) : (
							<h2 onClick={ this.handleTitleEdit.bind(this) }
								onFocus={ this.handleTitleEdit.bind(this) }
								tabIndex={ this.state.isEditingTitle ? null : 0 }
								className="bibliography-title"
							>
								<Editable
									placeholder="Bibliography"
									value={ this.props.title || '' }
									isActive={ this.state.isEditingTitle }
									onCommit={ this.handleTitleCommit.bind(this) }
									onCancel={ this.handleTitleCancel.bind(this) }
									autoFocus
									selectOnFocus
								/>
								<Button>
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
							<div className="spinner-container">
								<Spinner />
							</div>
						) : <Bibliography { ...this.props } />
					}
					{
						!this.props.isReadOnly && !this.props.isLoadingCitations && <DeleteAllButton { ...this.props } />
					}
					<Confirmation
						isOpen={ this.props.isReadOnly && this.state.isConfirmingOverride }
						onConfirm={ this.handleOverride.bind(this) }
						onCancel={ this.handleCancel.bind(this) }
						title="Clear existing bibliography?"
						confirmLabel="Continue"
						>
							<p>
								There is an existing bibliography with { this.props.localCitationsCount } { this.props.localCitationsCount > 1 ? 'entries' : 'entry' } in the editor. If you continue, the existing bibliography will be replaced with this one.
							</p>
					</Confirmation>
				</React.Fragment>
			);
		}
	}

	get className() {
		return {
			'section': true,
			'section-bibliography': true,
			'loading': this.props.isLoadingCitations,
			'empty': this.props.items.length === 0
		};
	}

	render() {
		return (
			<section className={ cx(this.className) }>
				<div className="container">
					{ this.renderBibliography() }
					{
						this.props.isReadOnly && (
							<Button
								onClick={ this.handleEditBibliography.bind(this) }
								className="btn-sm btn-outline-secondary">
								Edit Bibliography
							</Button>
						)
					}
				</div>
			</section>
		);
	}

	static defaultProps = {
		items: [],
	}

	static propTypes = {
		items: PropTypes.array,
		isLoadingCitations: PropTypes.bool,
		isReadOnly: PropTypes.bool,
		localCitationsCount: PropTypes.number,
		onOverride: PropTypes.func.isRequired,
		onTitleChanged: PropTypes.func.isRequired,
		title: PropTypes.string,
	}
}

module.exports = BibliographySection;
