'use strict';

const React = require('react');

class Footer extends React.PureComponent {
	render() {
		return (
			<footer>
				Stay in touch! Follow <a href="https://twitter.com/zotero">@zotero</a> on Twitter.
				</nav>
				<small className="copyright">
					© 2018 Corporation for Digital Scholarship
				</small>
			</footer>
		);
	}
}

module.exports = Footer;
