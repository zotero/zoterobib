'use strict';

const React = require('react');

class Footer extends React.PureComponent {
	render() {
		return (
			<footer>
				<nav className="social-nav">
					Stay in touch! Follow <a href="https://twitter.com/zotero">@zotero</a> on Twitter.
				</nav>
				<small className="copyright">
					{ (new Date()).getFullYear() } Corporation for Digital Scholarship &nbsp;•&nbsp; <a href="/faq#privacy">Privacy</a>
				</small>
			</footer>
		);
	}
}

module.exports = Footer;
