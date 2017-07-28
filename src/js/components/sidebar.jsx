'use strict';

const React = require('react');
const Select = require('react-select');
const PropTypes = require('prop-types');
const exportFormats = require('../constants/export-formats');
const citationStyles = require('../constants/citation-styles');
const ClipboardButton = require('react-clipboard.js');

class Sidebar extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			preferencesOpen: false,
			clipboardConfirmations: {}
		};
	}

	preferencesOpenHandler() {
		this.setState({
			preferencesOpen: !this.state.preferencesOpen
		});
	}

	getExportData(format, asDataUrl = false) {
		if(this.state.citeprocReady) {
			this.citeproc.setOutputFormat(format);
			const bib = this.citeproc.makeBibliography();
			this.citeproc.setOutputFormat('html');

			if(asDataUrl) {
				return `data:${exportFormats[format]},${bib[0].bibstart}${bib[1].join()}${bib[0].bibend}`;
			} else {
				return `${bib[0].bibstart}${bib[1].join()}${bib[0].bibend}`;
			}
		}

		return '';
	}

	clipboardSuccessHandler(format) {
		if(this.state.clipboardConfirmations[format]) {
			return;
		}

		this.setState({
			clipboardConfirmations: {
				...this.state.clipboardConfirmations,
				[format]: true
			}
		}, () => {
			setTimeout(() => {
				this.setState({
					clipboardConfirmations: {
						...this.state.clipboardConfirmations,
						[format]: false
					}
				});
			}, 1000);
		});
	}

	render() {
		return (
			<div className={ `zotero-bib-preferences ${ this.state.preferencesOpen ? 'open' : '' }` }>
				<div className="zotero-bib-preferences-outer">
					<svg
						onClick= { this.preferencesOpenHandler.bind(this) }
						className="zotero-bib-form-options-icon"
						style={{ width: 24, height: 24 }}
						aria-labelledby="title"
						role="img">
							<title id="title">Cog</title>
							<use xlinkHref="/icons/cog.svg#cog"></use>
					</svg>
					<h2>
						Options
					</h2>
				</div>
				<div className="zotero-bib-preferences-inner">
					<div className="zotero-bib-preferences-item">
						<label>Choose Citation Style:</label>
						<Select
							clearable={ false }
							className="zotero-bib-citation-style-selector"
							value={ this.state.selectedStyleId }
							options={ citationStyles }
							onChange={ ev => this.props.onCitationStyleChanged(ev.value) }
						/>
					</div>
					<div className="zotero-bib-preferences-item">
						<label>Export bibliography:</label>
						{
							Object.keys(exportFormats).map(format => {
								if(exportFormats[format].isCopyable) {
									return (
										<ClipboardButton
											className="zotero-bib-preferences-export-all-button"
											data-clipboard-text={ this.getExportData(format, false) }
											onSuccess={ this.clipboardSuccessHandler.bind(this, format) }
											key={ `export-copy-as-${format}` }
										>
											{ this.state.clipboardConfirmations[format] ? 'Copied!' : `Copy as ${exportFormats[format].label}` }
										</ClipboardButton>
									);
								}

								if(exportFormats[format].isDownloadable) {
									return(
										<a 
											href={ this.getExportData('rtf', true) } download="citations.rtf"
											key={ `export-download-as-${format}` } >
											<button className="zotero-bib-preferences-export-all-button">
												Download { exportFormats[format].label }
											</button>
										</a>
									);
								}
							})
						}
					</div>
					<div className="zotero-bib-preferences-item">
						<label>Delete Citations:</label>
						<button
							onClick={ () => this.props.onDeleteCitations() }
							className="zotero-bib-preferences-delete-all-button">
								Delete All
						</button>
					</div>
				</div>
			</div>
		);
	}
}

Sidebar.defaultProps = {
	onDeleteCitations: () => {},
	onCitationStyleChanged: () => {}
};

Sidebar.propTypes = {
	onDeleteCitations: PropTypes.func,
	onCitationStyleChanged: PropTypes.func
};

module.exports = Sidebar;