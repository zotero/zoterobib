import '@testing-library/jest-dom'
import { rest } from 'msw'
import { setupServer } from 'msw/node'
import { getAllByRole, getByRole, getByText, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { applyAdditionalJestTweaks } from './utils/common';
import Container from '../src/js/components/container';
import { renderWithProviders } from './utils/render';
import schema from './fixtures/schema.json';
import localStorage100Items from './fixtures/local-storage-100-items.json';
import localeForCiteproc from './fixtures/locales-en-us.xml';
import responseTranslateIdentifier from './fixtures/response-translate-identifier.json';
import modernLanguageAssociationStyle from './fixtures/modern-language-association.xml';

import CSL from 'citeproc';
window.CSL = CSL;

applyAdditionalJestTweaks();

describe('Import', () => {
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
		window.location = new URL('http://localhost/import?q=1234');
		server.use(
			rest.get('https://api.zotero.org/schema', (req, res, ctx) => {
				return res(ctx.json(schema));
			})
		);
		server.use(
			rest.get('https://www.zotero.org/styles/modern-language-association', (req, res, ctx) => {
				return res(
					ctx.set('Content-Type', 'application/vnd.citationstyles.style+xml'),
					ctx.text(modernLanguageAssociationStyle),
				);
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

	test('Shows confirmation dialog when adding a single item via /import endpoint', async () => {
		let hasTranslated = false;
		server.use(
			rest.post('http://localhost/search', async (req, res, ctx) => {
				expect(await req.text()).toBe('1234');
				hasTranslated = true;
				// delayed to make sure input becomes readonly
				return res(ctx.delay(100), ctx.json(responseTranslateIdentifier));
			})
		);

		renderWithProviders(<Container />);
		const user = userEvent.setup();

		const modal = await screen.findByRole('dialog', { name: 'Confirm Add Citation' }, { timeout: 3000 });
		await user.click(getByRole(modal, 'button', { name: 'Add' }));
		const newItemSection = await screen.findByRole('region', { name: 'New item…' });

		await waitFor(() => expect(screen.getByRole(
			'searchbox', { name: 'Enter a URL, ISBN, DOI, PMID, arXiv ID, or title' }
		)).not.toHaveAttribute('readonly'));

		expect(getByText(newItemSection, /The Complete Golden Retriever Handbook/)).toBeInTheDocument();
		const bibliography = screen.getByRole("list", { name: "Bibliography" });
		expect(getAllByRole(bibliography, 'listitem')).toHaveLength(6);

		expect(hasTranslated).toBe(true);
	});
});
