'use strict';

const React = require('react');

class Footer extends React.PureComponent {
	render() {
		return (
			<footer>
				<nav className="social-nav">
					
				</nav>
				<small className="copyright">
					© { (new Date()).getFullYear() } Mick Schroeder, LLC. Source code available at <a href="https://github.com/mick-schroeder/schroeder-citation">Github</a>.
					<p>
					This program is free software: you can redistribute it and/or modify
					it under the terms of the GNU Affero General Public License as
					published by the Free Software Foundation.
					</p>
					<p>
					This program is distributed in the hope that it will be useful,
					but WITHOUT ANY WARRANTY; without even the implied warranty of
					MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
					GNU Affero General Public License for more details.
					</p>
				</small>
				
			</footer>
		);
	}
}

module.exports = Footer;
