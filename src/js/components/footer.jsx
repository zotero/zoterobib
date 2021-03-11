import React from 'react';

class Footer extends React.PureComponent {
	render() {
		return (
			<footer>
				<nav className="social-nav">
					Stay in touch! Follow <a href="https://twitter.com/zotero">@zotero</a> on Twitter.
				</nav>
				<small className="copyright">
					© 2018–2020 Zotero &nbsp;•&nbsp; <a href="/faq#privacy">Privacy</a>
				</small>
			</footer>
		);
	}
}

export default Footer;
