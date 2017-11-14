'use strict';

require('isomorphic-fetch');
const React = require('react');
const ReactDOM = require('react-dom');
const { BrowserRouter, Route, Switch } = require('react-router-dom');
const { Redirect } = require('react-router');
const Container = require('./components/container');

//@TODO fix naming convention (bib vs this.bib)
class ZoteroBibComponent extends React.Component {
	render() {
		return (
			<BrowserRouter>
				<Switch>
					<Route path="/:id([0-9a-fA-f]{32})/:active(export-dialog)?">
						<Container config = { this.props.config } />
					</Route>
					<Route path="/:active(style-selector|export-dialog|editor)?">
						<Container config = { this.props.config } />
					</Route>
				</Switch>
			</BrowserRouter>
		);
	}

	static init(domEl, config={}) {
		ReactDOM.render(<ZoteroBibComponent config={ config } />, domEl);
	}
}

module.exports = ZoteroBibComponent;
