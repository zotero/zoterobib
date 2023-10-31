import '@testing-library/jest-dom'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { getByRole, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { applyAdditionalJestTweaks } from './utils/common';
import Container from '../src/js/components/container';
import { renderWithProviders } from './utils/render';
import schema from './fixtures/schema.json';
import localStorage100Items from './fixtures/local-storage-100-items.json';
import localeForCiteproc from './fixtures/locales-en-us.xml';
import natureStyle from './fixtures/nature.xml';
import localesGBForCiteproc from './fixtures/locales-en-gb.xml';
import stylesJson from './fixtures/styles.json';

import CSL from 'citeproc';
window.CSL = CSL;

applyAdditionalJestTweaks();

describe('Remote Data', () => {
	const handlers = [];
	const server = setupServer(...handlers)

	beforeAll(() => {
		server.listen({
			onUnhandledRequest: (req) => {
				// https://github.com/mswjs/msw/issues/946#issuecomment-1202959063
				test(`${req.method} ${req.url} is not handled`, () => { });
			},
		});
	});

	beforeEach(() => {
		delete window.location;
		window.location = new URL('http://localhost/d3b2fbdeadff4a00aecd048451a962b9');
		server.use(
			http.get('https://api.zotero.org/schema', () => {
				return HttpResponse.json(schema);
			})
		);
		server.use(
			http.get('https://www.zotero.org/styles-files/styles.json', () => {
				return HttpResponse.json(stylesJson);
			}),
		);
		server.use(
			http.get('https://www.zotero.org/styles/nature', () => {
				return HttpResponse.text(natureStyle, {
					headers: { 'Content-Type': 'application/vnd.citationstyles.style+xml' },
				});
			}),
		);
		server.use(
			http.get('http://localhost/static/locales/locales-en-GB.xml', () => {
				return HttpResponse.xml(localesGBForCiteproc);
			}),
		);
		server.use(
			http.get('http://localhost/store/d3b2fbdeadff4a00aecd048451a962b9', () => {
				return HttpResponse.json({
					"title": "my items",
					"citationStyle": "nature",
					"items": [
						...localStorage100Items.slice(10, 20),
					],
				});
			}),
		);
		localStorage.setItem(
			'zotero-bib-items',
			JSON.stringify(localStorage100Items.slice(0, 5)) // improve performance by using a small slice
		);
		localStorage.setItem('zotero-bib-title', 'hello world');
		localStorage.setItem('zotero-style-locales-en-US', localeForCiteproc);
	});

	afterEach(() => server.resetHandlers());
	afterAll(() => server.close());

	test('Displays remote bibliography', async () => {
		jest.spyOn(history, 'replaceState');
		renderWithProviders(<Container />);
		const user = userEvent.setup();
		await screen.findByRole('progressbar');
		await waitFor(() => {
			expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
		}, { timeout: 3000 });

		const bib = await screen.findByRole('region', { name: 'Bibliography' });
		expect(bib).toHaveTextContent(/1\.Lefkowitz, R\. J\. Identification of adenylate cyclase-coupled beta-adrenergic receptors with radiolabeled beta-adrenergic antagonists\./);
		await user.click(screen.getByRole('button', { name: 'Edit Bibliography' }));
		const dialog = await screen.findByRole('dialog', { name: 'Clear existing bibliography?' });
		expect(dialog).toHaveTextContent(/There is an existing bibliography with 5 entries in the editor\. If you continue, the existing bibliography will be replaced with this one\./);
		await user.click(getByRole(dialog, 'button', { name: 'Continue' }));
		expect(history.replaceState).toHaveBeenCalledWith(null, null, '/');
	});
});
