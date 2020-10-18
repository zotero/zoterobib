'use strict';

const React = require('react');

class Footer extends React.PureComponent {
	render() {
		return (
			<footer>
				<nav className="social-nav">
					
				</nav>
				<div className="container">
				<small className="copyright">
					© { (new Date()).getFullYear() } Mick Schroeder, LLC. All Rights reserved.
					<p>
					<a href="/terms.html">Terms of Use & Privacy Policy</a>
					</p>
					<p>
					This program is free software: you can redistribute it and/or modify
					it under the terms of the <a href="https://www.gnu.org/licenses/agpl-3.0.en.html">GNU Affero General Public License</a> as
					published by the <a href="https://www.fsf.org/">Free Software Foundation</a>.
					</p>
					<p>
					This program is distributed in the hope that it will be useful,
					but WITHOUT ANY WARRANTY; without even the implied warranty of
					MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
					</p>
				</small>
				</div>

				
			</footer>
		);
	}
}

module.exports = Footer;
