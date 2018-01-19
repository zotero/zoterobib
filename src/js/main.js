'use strict';

require('isomorphic-fetch');
const React = require('react');
const PropTypes = require('prop-types');
const ReactDOM = require('react-dom');
const { BrowserRouter, Route, Switch } = require('react-router-dom');
const Container = require('./components/container');

//@TODO fix naming convention (bib vs this.bib)
class ZoteroBibComponent extends React.Component {
	render() {
		return (
			<BrowserRouter>
				<Switch>
					<Route path="/:id([0-9a-fA-f]{32})">
						<Container config = { this.props.config } />
					</Route>
					<Route path="/">
						<Container config = { this.props.config } />
					</Route>
				</Switch>
			</BrowserRouter>
		);
	}

	static init(domEl, config={}) {
		ReactDOM.render(<ZoteroBibComponent config={ config } />, domEl);
	}

	static propTypes = {
		config: PropTypes.object
	}
}

module.exports = ZoteroBibComponent;
