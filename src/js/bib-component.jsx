import React from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import { IntlProvider } from 'react-intl';

import Container from './components/container';
import CrashHandler from './components/crash-handler';
import messages from '../../lang/en-US.json';


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
				<IntlProvider
					locale={ process.env.NODE_ENV === 'production' ? 'en-US' : undefined /* in development we always display values of defaultMessage */ }
					messages={ messages }
				>
					<Container {...this.props } />
				</IntlProvider>
			</ErrorBoundary>
		);
	}

	static init(domEl, config={}) {
		'hydrateItemsCount' in domEl.dataset ?
			ReactDOM.hydrate(
				<ZoteroBibComponent
					hydrateItemsCount={ parseInt(domEl.dataset.hydrateItemsCount) }
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
