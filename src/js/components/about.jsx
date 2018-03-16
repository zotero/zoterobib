'use strict';

const React = require('react');
const Button = require('zotero-web-library/lib/component/ui/button');

class About extends React.PureComponent {
	render() {
		return (
			<section className="section section-about about">
				<div className="container">
					<img
						src="/static/images/about/zbib-illustration.svg"
						className="zbib-illustration"
						width="300"
						height="400"
						alt="ZBib"
					/>
					<h1>Cite anything</h1>
					<p className="lead">
						Brought to you by the Zotero team, ZBib helps you build a
						bibliography instantly, without downloading or installing any
						software. If you need to organize, analyze, and share your research
						sources, we recommend using Zotero instead.
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
								<h2 className="h5">Entering an item</h2>
								<p>
									By simply entering a URL, DOI, ISBN, or PMID, ZBib can
									automatically import most references.
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
								<h2 className="h5">Manual entry</h2>
								<p>
									If you would like to enter a reference manually or if
									automatic import doesn’t find what you’re looking for, you can
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
									src="/static/images/about/style-selection.svg"
									className="feature-icon"
									width="66"
									height="66"
									alt=""
								/>
								<h2 className="h5">Style selection</h2>
								<p>
									To change your bibliography’s formatting style, free free to
									choose from over 9000 styles.
								</p>
							</section>
						</div>
						<div className="column">
							<section className="feature">
								<img
									src="/static/images/about/editing-item.svg"
									className="feature-icon"
									width="66"
									height="66"
									alt=""
								/>
								<h2 className="h5">Editing item</h2>
								<p>
									You can manually edit your bibliography entries just by
									clicking on an item, whether or not that item was added
									automatically or manually.
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
								<h2 className="h5">Deleting items</h2>
								<p>
									To delete an entry click its ×; to remove all entries click
									{ ' ' }<em>Delete All</em>.
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
								<h2 className="h5">Export</h2>
								<p>
									You can export your completed bibliography to the clipboard,
									or as HTML, rich text (RTF), or a RIS file.
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
								<h2 className="h5">Link to this version</h2>
								<p>
									If you would like to save a link to your ZBib library or to
									share it with someone else, you can generate a link.
								</p>
							</section>
						</div>
					</section>
					<Button className="btn-lg btn-outline-inverse-blue-dark">Awesome! Let’s start!</Button>
					<p>Need help? Visit our support pages.</p>
				</div>
			</section>
		);
	}
}

module.exports = About;
