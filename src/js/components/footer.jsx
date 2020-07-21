'use strict';

const React = require('react');

class Footer extends React.PureComponent {
	render() {
		return (
			<footer>
				<nav className="social-nav">
					
				</nav>
				<small className="copyright">
					© { (new Date()).getFullYear() } Mick Schroeder, LLC. &nbsp;•&nbsp; <a href="/faq#privacy">Privacy</a>
				</small>
				
			</footer>
		);
	}
}

module.exports = Footer;
