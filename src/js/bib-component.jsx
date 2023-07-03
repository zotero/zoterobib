import PropTypes from 'prop-types';
import { PureComponent, memo } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { IntlProvider } from 'react-intl';

import Container from './components/container';
import CrashHandler from './components/crash-handler';
import messages from '../../lang/compiled/en-US.json';


class ErrorBoundary extends PureComponent {
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

const ZoteroBibComponent = memo(props => (
	<ErrorBoundary>
		<IntlProvider
			defaultLocale="en-US"
			locale={ process.env.NODE_ENV === 'production' ? 'en-US' : undefined /* in development we always display values of defaultMessage */ }
			messages={ messages }
		>
			<Container {...props } />
		</IntlProvider>
	</ErrorBoundary>
));

ZoteroBibComponent.displayName = 'ZoteroBibComponent';

ZoteroBibComponent.init = (domEl, config = {}) => {
	'hydrateItemsCount' in domEl.dataset ?
		hydrateRoot(domEl,
			<ZoteroBibComponent
				hydrateItemsCount={ parseInt(domEl.dataset.hydrateItemsCount) }
				title={ domEl.querySelector('.bibliography-title')?.textContent }
				config={ config }
			/>) :
		createRoot(domEl).render(<ZoteroBibComponent config={ config } />)
}

ZoteroBibComponent.propTypes = {
	config: PropTypes.object
}

export default ZoteroBibComponent;
