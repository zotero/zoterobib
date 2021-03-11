import React from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import Container from './components/container';

//@TODO fix naming convention (bib vs this.bib)
class ZoteroBibComponent extends React.Component {
	render() {
		return (
			<BrowserRouter>
				<Switch>
					<Route path="/:id([0-9a-fA-f]{32})">
						<Container config = { this.props.config } />
					</Route>
					<Route path="/import">
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

export default ZoteroBibComponent;
