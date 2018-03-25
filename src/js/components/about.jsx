'use strict';

const React = require('react');
const Button = require('zotero-web-library/lib/component/ui/button');
const SmoothScroll = require('smooth-scroll');

class About extends React.PureComponent {
	handleClick(event) {
		this.props.onGetStartedClick(event);
	}

	render() {
		return (
			<section className="section section-about about">
				<div className="container">
					<img
						src="/static/images/about/citeproc.svg"
						className="zbib-illustration"
						width="312"
						height="400"
						alt="ZBib"
					/>
					<h1>Cite anything</h1>
					<p className="lead">
						Brought to you by the team behind <a href="https://www.zotero.org/">Zotero</a>,
						ZBib helps you build a bibliography instantly, without downloading or
						installing any software. If you need to reuse your research sources across
						multiple projects or build a shared research library, we recommend using
						Zotero instead.
					</p>
					<section className="features">
						<div className="column">
							<section className="feature">
								<img
									src="/static/images/about/cite.svg"
									className="feature-icon"
									width="66"
									height="66"
									alt=""
								/>
								<h2 className="h4">Adding a bibliography entry</h2>
								<p>
									Simply type or paste in a URL, DOI, ISBN, or PMID, and ZBib
									will automatically import the reference and add it to your
									bibliography.
								</p>
							</section>
							<section className="feature">
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
									always enter the reference information by hand.
								</p>
							</section>
							<section className="feature">
								<img
									src="/static/images/about/bibliography-title.svg"
									className="feature-icon"
									width="66"
									height="66"
									alt=""
								/>
								<h2 className="h5">Bibliography title</h2>
								<p>To rename your bibliography, just click its title.</p>
							</section>
							<section className="feature">
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
							<section className="feature">
								<img
									src="/static/images/about/deleting-items.svg"
									className="feature-icon"
									width="66"
									height="66"
									alt=""
								/>
								<h2 className="h4">Deleting items</h2>
								<p>
									Click the × next to a bibliography entry to delete it. To start
									a new bibliography, click <i>Delete All</i> to remove all entries.
								</p>
							</section>
						</div>
						<div className="column">
							<section className="feature">
								<img
									src="/static/images/about/style-selection.svg"
									className="feature-icon"
									width="66"
									height="66"
									alt=""
								/>
								<h2 className="h4">Style selection</h2>
								<p>
									Format your bibliography using APA, MLA, Chicago / Turabian,
									or any of the 9,000+
									other <a href="http://citationstyles.org/">CSL</a> styles.
								</p>
							</section>
							<section className="feature">
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
									in a word processor, or a RIS file to import into a reference
									manager.
								</p>
							</section>
							<section className="feature">
								<img
									src="/static/images/about/autosave.svg"
									className="feature-icon"
									width="66"
									height="66"
									alt=""
								/>
								<h2 className="h4">Autosave</h2>
								<p>
									ZBib automatically saves your bibliography to your browser’s
									local storage — you can close the page and return to it
									anytime. (If you’re using private / incognito mode in your
									browser, your bibliography will be cleared when you close the
									window.)
								</p>
							</section>
							<section className="feature">
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
							</section>
						</div>
					</section>
					<Button
						onClick={ this.handleClick.bind(this) }
						className="btn-lg btn-outline-inverse-blue-dark"
					>
						Awesome! Let’s start!
					</Button>
					<p className="support">
						<span className="d-xs-block d-sm-inline">Need help?</span>
						{ ' ' }
						Visit our <a href="">support pages</a>.</p>
				</div>
			</section>
		);
	}
}

module.exports = About;
