'use strict';

const React = require('react');
const ReactDOM = require('react-dom');
const { BrowserRouter, Route, Switch } = require('react-router-dom');
const { Redirect } = require('react-router');

const App = require('./components/app');

//@TODO fix naming convention (bib vs this.bib)
class ZoteroBibComponent extends React.Component {
	render() {
		return (
			<BrowserRouter>
				<Switch>
					<Route exact strict path="/:url*" render={props => <Redirect to={`${props.location.pathname}/`}/>} />
					<Route path="/id/:id/:active(style-selector|export-dialog|editor)?">
						<App config = { this.props.config } />
					</Route>
					<Route path="/:active(style-selector|export-dialog|editor)?">
						<App config = { this.props.config } />
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
