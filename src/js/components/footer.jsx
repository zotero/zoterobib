'use strict';

const React = require('react');

class Footer extends React.PureComponent {
	render() {
		return (
			<footer>
				<nav className="social-nav">
				<a href="https://twitter.com/zotero">
					<svg className="twitter-icon" width="24" height="24" viewBox="0 0 24 24">
						<path fill="currentColor" d="M7.548,21.752a13.914,13.914,0,0,0,14.01-14.01q0-.32-.014-.636A10.013,10.013,0,0,0,24,4.556a9.818,9.818,0,0,1-2.828.775,4.941,4.941,0,0,0,2.165-2.724,9.875,9.875,0,0,1-3.127,1.2,4.928,4.928,0,0,0-8.391,4.49A13.98,13.98,0,0,1,1.67,3.149,4.928,4.928,0,0,0,3.195,9.723a4.888,4.888,0,0,1-2.23-.616c0,.021,0,.041,0,.063A4.925,4.925,0,0,0,4.914,14a4.916,4.916,0,0,1-2.224.084,4.929,4.929,0,0,0,4.6,3.42,9.878,9.878,0,0,1-6.116,2.108A10,10,0,0,1,0,19.541a13.938,13.938,0,0,0,7.548,2.212"/>
					</svg>
				</a>
				<br/>
				Follow <a href="https://twitter.com/zotero">@zotero</a> on Twitter for updates.
				</nav>
				<small className="copyright">
					© 2018 Corporation for Digital Scholarship
				</small>
			</footer>
		);
	}
}

module.exports = Footer;
