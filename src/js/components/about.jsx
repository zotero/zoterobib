'use strict';

const React = require('react');
const PropTypes = require('prop-types');
const Button = require('zotero-web-library/src/js/component/ui/button');

class About extends React.PureComponent {
	handleClick(event) {
		this.props.onGetStartedClick(event);
	}

	render() {
		return (
			<section className="section section-about about">
				<div className="container-fullwidth">
					<h1>How to use</h1>
					<p className="lead">
						<p>Suggest citations automatically from urls, PubMed IDs (PMID), DOI, and many other identifiers.</p>
						<p>Format using AMA, APA, MLA, Chicago / Turabian, journal specific formats like NEJM, or any of the 9,000+ other CSL styles.</p>
						<p>Build a bibliography then export to Clipboard (copy / paste), Word Document (.rtf), or import into a reference manager (.RIS or .BibTeX). </p>
						<p>Free and open-source software by <b><a href="https://www.mickschroeder.com/">Mick Schroeder</a></b>.</p>
						<p>Based on many open source projects including <a href="https://www.zotero.org/">Zotero</a>, the research tool used by thousands of universities worldwide.</p>
					</p>
					<section className="features">
						<div className="row">
							<section className="column feature">
								<img
									src="/static/images/about/cite.svg"
									className="feature-icon"
									width="66"
									height="66"
									alt=""
								/>
								<h2 className="h4">Suggesting a Citation</h2>
								<p>
									Paste a URL in the search bar under Enter query and click Suggest Citation. 
									Automatically pull in data from thousands of medical and scientific journals, newspapers, magazine
									articles, library catalogs, articles, sites like Amazon
									and Google Books, and much more. You can also use an identifier such as 
									an ISBN, DOI, PMID, or arXiv ID, or you can search by title.
								</p>
							</section>
							<section className="column feature">
								<img
									src="/static/images/about/manual-entry.svg"
									className="feature-icon"
									width="66"
									height="66"
									alt=""
								/>
								<h2 className="h4">Manual entry</h2>
								<p>
									If automatic import doesn’t find what you’re looking for or
									you’re entering something without a URL or identifier, you can
									enter the reference information by hand.
								</p>
							</section>
							<section className="column feature">
								<img
									src="/static/images/about/bibliography-title.svg"
									className="feature-icon"
									width="66"
									height="66"
									alt=""
								/>
								<h2 className="h4">Bibliography title</h2>
								<p>
									To rename your bibliography, just click its title. A title
									can be useful if you’re switching between multiple projects or
									sharing a bibliography with others.
								</p>
							</section>
							<section className="column feature">
								<img
									src="/static/images/about/editing.svg"
									className="feature-icon"
									width="66"
									height="66"
									alt=""
								/>
								<h2 className="h4">Editing an item</h2>
								<p>
									You might need to add or change a few fields after adding an
									item. Click on a bibliography entry to make manual changes.
								</p>
							</section>
							<section className="column feature">
								<img
									src="/static/images/about/deleting-items.svg"
									className="feature-icon"
									width="66"
									height="66"
									alt=""
								/>
								<h2 className="h4">Deleting items</h2>
								<p>
									Click the
									{ ' ' }
									<img
										src="/static/images/about/remove-xs.svg"
										className="remove-icon"
										width="14"
										height="14"
										alt="Remove icon"/>
									{ ' ' }
									next to a bibliography entry to delete it. To start a new
									bibliography, click <i>Delete All</i> to remove all entries.
								</p>
							</section>
						{/* </div>
						<div className="column"> */}
							<section className="column feature">
								<img
									src="/static/images/about/style-selection.svg"
									className="feature-icon"
									width="66"
									height="66"
									alt=""
								/>
								<h2 className="h4">Style selection</h2>
								<p>
									Format your bibliography using AMA, APA, MLA, Chicago / Turabian,
									or any of the 9,000+
									other <a href="http://citationstyles.org/">CSL</a> styles.
								</p>
							</section>
							<section className="column feature">
								<img
									src="/static/images/about/copy.svg"
									className="feature-icon"
									width="66"
									height="66"
									alt=""
								/>
								<h2 className="h4">Copy Citation / Note</h2>
								<p>
									As you’re writing, you can quickly generate parenthetical
									citations or footnotes /endnotes to paste into your document
									without typing names or dates by hand.
								</p>
							</section>
							<section className="column feature">
								<img
									src="/static/images/about/export.svg"
									className="feature-icon"
									width="66"
									height="66"
									alt=""
								/>
								<h2 className="h4">Export</h2>
								<p>
									When you’re done, you can copy a formatted bibliography to the
									clipboard and paste it into your document. You can also
									export HTML to add to a webpage, an RTF document to open
									in a word processor, or a RIS or BibTeX file to import into a
									reference manager.
								</p>
							</section>
							<section className="column feature">
								<img
									src="/static/images/about/autosave.svg"
									className="feature-icon"
									width="66"
									height="66"
									alt=""
								/>
								<h2 className="h4">Autosave</h2>
								<p>
									Automatically saves your bibliography to your browser’s
									local storage — you can close the page and return to it
									anytime. (If you’re using private / incognito mode in your
									browser, your bibliography will be cleared when you close the
									window.)
								</p>
							</section>
							{/* <section className="column feature">
								<img
									src="/static/images/about/link.svg"
									className="feature-icon"
									width="66"
									height="66"
									alt=""
								/>
								<h2 className="h4">Link to this version</h2>
								<p>
									If you want to edit your bibliography on another device, share
									it with someone else, or switch to another bibliography, you
									can generate a link to a copy of the current version on
									zbib.org. Use the link to retrieve your bibliography later.
								</p>
							</section> */}
						</div>
					</section>
					<Button
						onClick={ this.handleClick.bind(this) }
						className="btn-lg btn-secondary"
					>
						Cool. Cool-cool-cool. Let’s start!
					</Button>
					<p className="support">
						<span className="d-xs-block d-sm-inline">Still have questions?</span>
						{ ' ' }
						Check the <a href="/faq.html">Frequently Asked Questions (FAQ)</a>.</p>
						<a href="https://github.com/mick-schroeder/schroeder-citation">
						<img
									src="/static/images/E045.svg"
									width="66"
									height="66"
									alt=""
						/><br/>
						Source code available on github
						</a>.
				</div>
			</section>
		);
	}

	static propTypes = {
		onGetStartedClick: PropTypes.func.isRequired,
	}
}

module.exports = About;
