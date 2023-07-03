import { render } from '@testing-library/react'
import { IntlProvider } from 'react-intl';
// import messages from '../../lang/compiled/en-US.json';

export function renderWithProviders(
	ui,
	{
		locale = 'en-US',
		...renderOptions
	} = {}
) {
	// eslint-disable-next-line react/prop-types
	function Wrapper({ children }) {
		return (
			<IntlProvider
				defaultLocale="en-US"
				locale={ locale }
			>
				{children}
			</IntlProvider>
		)
	}

	return render(ui, {
		wrapper: Wrapper,
		...renderOptions
	});
}
