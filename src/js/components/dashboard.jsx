'use strict';

const React = require('react');
const PropTypes = require('prop-types');
const { Link } = require('react-router-dom');

class Dashboard extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			url: props.url
		};
	}

	componentWillReceiveProps(nextProps) {
		this.setState({
			url: nextProps.url
		}, () => {
			if(this.props.busy && !nextProps.busy) {
				this.inputField.focus();
			}
		});
	}

	handleUrlChange(ev) {
		this.setState({
			url: ev.target.value
		});
	}

	handleTranslateUrl() {
		this.props.onTranslationRequest(this.state.url);
	}

	handleManualEntry() {
		this.props.onManualEntry();
	}

	handleDeleteCitation(itemId) {
		this.props.onDeleteEntry(itemId);
	}

	getCitation(citation) {
		return { 
			__html: citation
		};
	}
	
	render() {
		return (
			<div className="zotero-bib">
				<div className="zotero-bib-form">
					<div className="zotero-bib-form-main">
						<input
							ref = { i => this.inputField = i }
							autoFocus
							placeholder="Cite a source by entering its url"
							className="zotero-bib-form-url"
							type="text" value={ this.state.url }
							onChange={ this.handleUrlChange.bind(this) }
						/>
						<button
							disabled = { this.props.busy }
							className={ `zotero-bib-form-submit-button ${ this.props.busy ? 'loading' : '' }` }
							onClick={ this.handleTranslateUrl.bind(this) }>
								{ this.props.busy ? '' : 'Cite it' }
						</button>
						<button
							disabled = { this.props.busy }
							className={ `zotero-bib-form-submit-button ${ this.props.busy ? 'loading' : '' }` }
							onClick={ this.handleManualEntry.bind(this) }>
								Manual Entry
						</button>
					</div>
				</div>
				
				<div className="zotero-bib-citations">
					{
						Object.keys(this.props.citations).map(itemId => {
							return (
								<div className="zotero-bib-citation-wrapper" key={ itemId }>
									<div className="zotero-bib-citation">
										<div dangerouslySetInnerHTML={ { __html: this.props.citations[itemId] } } />
									</div>
									<div className="zotero-bib-citation-action">
										<Link to={ `/item/${itemId}` } >
											<button className="zotero-bib-citation-action-button edit">
												<svg
													className="zotero-bib-citation-action-icon"
													style={{ width: 24, height: 24 }}
													aria-labelledby="title"
													role="img">
														<title id="title">Edit</title>
														<use xlinkHref="/icons/cog.svg#cog"></use>
												</svg>
											</button>
										</Link>
										<button className="zotero-bib-citation-action-button delete">
											<svg
												onClick= { this.handleDeleteCitation.bind(this, itemId) }
												className="zotero-bib-citation-action-icon"
												style={{ width: 24, height: 24 }}
												aria-labelledby="title"
												role="img">
													<title id="title">Trash</title>
													<use xlinkHref="/icons/trash.svg#trash"></use>
											</svg>
										</button>
									</div>
								</div>
							);
						})
					}
				</div>
				<footer>
					Powered by <a href="http://zotero.org/">Zotero</a>
				</footer>
			</div>
		);
	}
}

module.exports = Dashboard;

Dashboard.defaultProps = {
	citations: {}
};
Dashboard.propTypes = {
	citations: PropTypes.object
};
