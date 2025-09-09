import '@testing-library/jest-dom'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { getByRole, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { applyAdditionalJestTweaks } from './utils/common';
import { installMockedXHR, uninstallMockedXHR, installUnhandledRequestHandler } from './utils/xhr-mock';
import Container from '../src/js/components/container';
import { renderWithProviders } from './utils/render';
import schema from './fixtures/schema.json';
import localStorage100Items from './fixtures/local-storage-100-items.json';
import natureStyle from './fixtures/nature.xml';
import stylesJson from './fixtures/styles.json';
import turabianNotesBibStyle from './fixtures/turabian-notes-bibliography.xml';
import chicagoNotesBibStyle from './fixtures/chicago-notes-bibliography-subsequent-author-title-17th-edition.xml'

import CSL from 'citeproc';
window.CSL = CSL;

applyAdditionalJestTweaks();

describe('Remote Data', () => {
	const handlers = [];
	const server = setupServer(...handlers)

	beforeAll(() => {
		installUnhandledRequestHandler(server);
		installMockedXHR();
	});

	beforeEach(() => {
		window.jsdom.reconfigure({ url: 'http://localhost/d3b2fbdeadff4a00aecd048451a962b9' });
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
	});

	afterEach(() => server.resetHandlers());

	afterAll(() => {
		uninstallMockedXHR();
		server.close();
	});

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

	test('Looks up the style name for renamed styles', async () => {
		jest.spyOn(history, 'replaceState');
		let hasFetchedRenamedStyle = false;
		let hasFetchedParentStyle = false;
		server.use(
			http.get('https://www.zotero.org/styles/chicago-notes-bibliography-subsequent-author-title-17th-edition', () => {
				hasFetchedParentStyle = true;
				return HttpResponse.text(chicagoNotesBibStyle, {
					headers: { 'Content-Type': 'application/vnd.citationstyles.style+xml' },
				});
			}),
		);
		server.use(
			http.get('https://www.zotero.org/styles/turabian-notes-bibliography', () => {
				hasFetchedRenamedStyle = true;
				return HttpResponse.text(turabianNotesBibStyle, {
					headers: { 'Content-Type': 'application/vnd.citationstyles.style+xml' },
				});
			}),
		);
		server.use(
			http.get('http://localhost/store/d3b2fbdeadff4a00aecd048451a962b9', () => {
				return HttpResponse.json({
					"title": "bib in legacy style",
					"citationStyle": "turabian-fullnote-bibliography",
					"items": [
						...localStorage100Items.slice(10, 20),
					],
				});
			}),
		);
		renderWithProviders(<Container />);
		const user = userEvent.setup();
		await screen.findByRole('progressbar');
		await waitFor(() => {
			expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
		}, { timeout: 3000 });
		await user.click(screen.getByRole('button', { name: 'Edit Bibliography' }));
		const dialog = await screen.findByRole('dialog', { name: 'Clear existing bibliography?' });
		await user.click(getByRole(dialog, 'button', { name: 'Continue' }));
		expect(history.replaceState).toHaveBeenCalledWith(null, null, '/');
		expect(hasFetchedRenamedStyle).toBe(true);
		expect(hasFetchedParentStyle).toBe(true);
	});
});
