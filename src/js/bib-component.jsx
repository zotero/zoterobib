import React from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import Container from './components/container';
import CrashHandler from './components/crash-handler';

class ErrorBoundary extends React.PureComponent {
	constructor(props) {
		super(props);
		this.state = { hasError: false };
	}

	componentDidCatch(error, info) {
		this.setState({ hasError: true, error, info });
	}

	render() {
		return this.state.hasError ?
			<CrashHandler error={ this.state.error } info={ this.state.info } /> :
			this.props.children;
	}
}

ErrorBoundary.propTypes = {
	children: PropTypes.node
}

class ZoteroBibComponent extends React.Component {
	render() {
		return (
			<ErrorBoundary>
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
			</ErrorBoundary>
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
