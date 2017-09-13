'use strict';

const React = require('react');
const ReactDOM = require('react-dom');
const { BrowserRouter } = require('react-router-dom');

const App = require('./components/app');

//@TODO fix naming convention (bib vs this.bib)
class ZoteroBibComponent extends React.Component {
	render() {
		return (
			<BrowserRouter>
				<App config = { this.props.config } />
			</BrowserRouter>
		);
	}

	static init(domEl, config={}) {
		ReactDOM.render(<ZoteroBibComponent config={ config } />, domEl);
	}
}

module.exports = ZoteroBibComponent;
