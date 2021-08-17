import React from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
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
			<ErrorBoundary><Container {...this.props } /></ErrorBoundary>
		);
	}

	static init(domEl, config={}) {
		'hydrateItemsCount' in domEl.dataset ?
			ReactDOM.hydrate(
				<ZoteroBibComponent
					hydrateItemsCount={ domEl.dataset.hydrateItemsCount }
					title={ domEl.querySelector('.bibliography-title')?.textContent }
					config={ config }
				/>, domEl) :
			ReactDOM.render(<ZoteroBibComponent config={ config } />, domEl);
	}

	static propTypes = {
		config: PropTypes.object
	}
}

export default ZoteroBibComponent;
