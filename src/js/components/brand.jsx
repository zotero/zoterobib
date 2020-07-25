'use strict';

const React = require('react');
const { Link } = require('react-router-dom');

class Brand extends React.PureComponent {
	render() {
		return (
			<React.Fragment>
				<h1 className="brand">
					<img className="brand" src="/static/images/icon-cite.png" alt="" />
					Mick Schroeder's Citation Generator
				</h1>
			</React.Fragment>
		);
	}
}

module.exports = Brand;
