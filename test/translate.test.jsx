import '@testing-library/jest-dom'
import { rest } from 'msw'
import { setupServer } from 'msw/node'
import { getAllByRole, getByRole, getByText, screen, waitFor, queryByRole, findByText, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { applyAdditionalJestTweaks, waitForPosition } from './utils/common';
import Container from '../src/js/components/container';
import { renderWithProviders } from './utils/render';
import modernLanguageAssociationStyle from './fixtures/modern-language-association.xml';
import schema from './fixtures/schema.json';
import localStorage100Items from './fixtures/local-storage-100-items.json';
import localeForCiteproc from './fixtures/locales-en-us.xml';
import responseTranslateIdentifier from './fixtures/response-translate-identifier.json';
import responseTranslateDOI from './fixtures/response-translate-doi.json';
import responseTranslateItems from './fixtures/response-translate-items.json';
import responseTranslateSearch from './fixtures/response-translate-search.json';
import responseTranslateSearchMore from './fixtures/response-translate-search-more.json';
import responseTranslateAPAIdentifier from './fixtures/response-translate-apa-identifier.json';
import apaStyle from './fixtures/apa.xml';
import understandingDogsBib from "./fixtures/paste-bibtex";
import responseTranslatePasted from "./fixtures/response-translate-pasted.json";

import CSL from 'citeproc';
window.CSL = CSL;

applyAdditionalJestTweaks();

describe('Translate', () => {
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
		window.location = new URL('http://localhost/');
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

	afterEach(() => {
		server.resetHandlers();
		localStorage.clear();
	});
	afterAll(() => server.close());

	test('Translates identifier', async () => {
		let hasTranslated = false;
		server.use(
			rest.post('http://localhost/search', async (req, res, ctx) => {
				expect(await req.text()).toBe('978-1979837125');
				hasTranslated = true;
				// delayed to make sure input becomes readonly
				return res(ctx.delay(100), ctx.json(responseTranslateIdentifier));
			})
		);

		renderWithProviders(<Container />);
		const input = await screen.findByRole(
			'searchbox', { name: 'Enter a URL, ISBN, DOI, PMID, arXiv ID, or title' }
		);
		const user = userEvent.setup();
		await user.type(input, '978-1979837125{enter}');

		await waitFor(() => expect(screen.getByRole(
			'searchbox', { name: 'Enter a URL, ISBN, DOI, PMID, arXiv ID, or title' })
		).toHaveAttribute('readonly'));

		const newItemSection = await screen.findByRole('region', { name: 'New item…' });

		await waitFor(() => expect(screen.getByRole(
			'searchbox', { name: 'Enter a URL, ISBN, DOI, PMID, arXiv ID, or title' }
		)).not.toHaveAttribute('readonly'));

		expect(getByRole(newItemSection, 'button', { name: 'Close' })).toBeInTheDocument();
		expect(getByRole(newItemSection, 'button', { name: 'Delete' })).toBeInTheDocument();
		expect(getByRole(newItemSection, 'button', { name: 'Edit' })).toBeInTheDocument();
		expect(getByText(newItemSection, /The Complete Golden Retriever Handbook/)).toBeInTheDocument();

		const bibliography = screen.getByRole("list", { name: "Bibliography" });
		expect(getAllByRole(bibliography, 'listitem')).toHaveLength(6);
		expect(hasTranslated).toBe(true);
	});

	test('Translates URL', async () => {
		let hasTranslated = false;
		server.use(
			rest.post('http://localhost/web', async (req, res, ctx) => {
				expect(await req.text()).toBe('https://example.com/golden');
				hasTranslated = true;
				// delayed to make sure input becomes readonly
				return res(ctx.delay(100), ctx.json(responseTranslateIdentifier));
			})
		);

		renderWithProviders(<Container />);
		const input = await screen.findByRole(
			'searchbox', { name: 'Enter a URL, ISBN, DOI, PMID, arXiv ID, or title' }
		);
		const user = userEvent.setup();
		await user.type(input, 'https://example.com/golden{enter}');

		await waitFor(() => expect(screen.getByRole(
			'searchbox', { name: 'Enter a URL, ISBN, DOI, PMID, arXiv ID, or title' })
		).toHaveAttribute('readonly'));

		const newItemSection = await screen.findByRole('region', { name: 'New item…' });

		await waitFor(() => expect(screen.getByRole(
			'searchbox', { name: 'Enter a URL, ISBN, DOI, PMID, arXiv ID, or title' }
		)).not.toHaveAttribute('readonly'));

		expect(getByRole(newItemSection, 'button', { name: 'Close' })).toBeInTheDocument();
		expect(getByRole(newItemSection, 'button', { name: 'Delete' })).toBeInTheDocument();
		expect(getByRole(newItemSection, 'button', { name: 'Edit' })).toBeInTheDocument();
		expect(getByText(newItemSection, /The Complete Golden Retriever Handbook/)).toBeInTheDocument();

		const bibliography = screen.getByRole("list", { name: "Bibliography" });
		expect(getAllByRole(bibliography, 'listitem')).toHaveLength(6);
		expect(hasTranslated).toBe(true);
	});

	test('Corrects incomplete URL', async () => {
		let hasTranslated = false;
		server.use(
			rest.post('http://localhost/web', async (req, res, ctx) => {
				expect(await req.text()).toBe('http://example.com/golden');
				hasTranslated = true;
				// delayed to make sure input becomes readonly
				return res(ctx.delay(100), ctx.json(responseTranslateIdentifier));
			})
		);

		renderWithProviders(<Container />);
		const input = await screen.findByRole(
			'searchbox', { name: 'Enter a URL, ISBN, DOI, PMID, arXiv ID, or title' }
		);
		const user = userEvent.setup();
		await user.type(input, 'example.com/golden{enter}');
		await waitFor(() => expect(screen.getByRole(
			'searchbox', { name: 'Enter a URL, ISBN, DOI, PMID, arXiv ID, or title' })
		).toHaveValue('http://example.com/golden'));

		await waitFor(() => expect(screen.getByRole(
			'searchbox', { name: 'Enter a URL, ISBN, DOI, PMID, arXiv ID, or title' })
		).toHaveAttribute('readonly'));

		const newItemSection = await screen.findByRole('region', { name: 'New item…' });

		await waitFor(() => expect(screen.getByRole(
			'searchbox', { name: 'Enter a URL, ISBN, DOI, PMID, arXiv ID, or title' }
		)).not.toHaveAttribute('readonly'));

		expect(getByRole(newItemSection, 'button', { name: 'Close' })).toBeInTheDocument();
		expect(getByRole(newItemSection, 'button', { name: 'Delete' })).toBeInTheDocument();
		expect(getByRole(newItemSection, 'button', { name: 'Edit' })).toBeInTheDocument();
		expect(getByText(newItemSection, /The Complete Golden Retriever Handbook/)).toBeInTheDocument();

		const bibliography = screen.getByRole("list", { name: "Bibliography" });
		expect(getAllByRole(bibliography, 'listitem')).toHaveLength(6);
		expect(hasTranslated).toBe(true);
	});

	test('Extracts DOI from an URL', async () => {
		let hasTranslated = false;
		server.use(
			rest.post('http://localhost/search', async (req, res, ctx) => {
				expect(await req.text()).toBe('10.3389/fvets.2021.675782');
				hasTranslated = true;
				// delayed to make sure input becomes readonly
				return res(ctx.delay(100), ctx.json(responseTranslateDOI));
			})
		);

		renderWithProviders(<Container />);
		const input = await screen.findByRole(
			'searchbox', { name: 'Enter a URL, ISBN, DOI, PMID, arXiv ID, or title' }
		);
		const user = userEvent.setup();
		await user.type(input, 'https://doi.org/10.3389/fvets.2021.675782{enter}');

		await waitFor(() => expect(screen.getByRole(
			'searchbox', { name: 'Enter a URL, ISBN, DOI, PMID, arXiv ID, or title' })
		).toHaveValue('10.3389/fvets.2021.675782'));

		await waitFor(() => expect(screen.getByRole(
			'searchbox', { name: 'Enter a URL, ISBN, DOI, PMID, arXiv ID, or title' })
		).toHaveAttribute('readonly'));

		const newItemSection = await screen.findByRole('region', { name: 'New item…' });

		await waitFor(() => expect(screen.getByRole(
			'searchbox', { name: 'Enter a URL, ISBN, DOI, PMID, arXiv ID, or title' }
		)).not.toHaveAttribute('readonly'));

		expect(getByRole(newItemSection, 'button', { name: 'Close' })).toBeInTheDocument();
		expect(getByRole(newItemSection, 'button', { name: 'Delete' })).toBeInTheDocument();
		expect(getByRole(newItemSection, 'button', { name: 'Edit' })).toBeInTheDocument();
		expect(getByText(newItemSection, /The New Era of Canine Science: Reshaping Our Relationships With Dogs/)).toBeInTheDocument();

		const bibliography = screen.getByRole("list", { name: "Bibliography" });
		expect(getAllByRole(bibliography, 'listitem')).toHaveLength(6);
		expect(hasTranslated).toBe(true);
	});

	test('Supports picking from multiple results', async () => {
		let hasTranslated = false;
		server.use(
			rest.post('http://localhost/web', async (req, res, ctx) => {
				expect(await req.text()).toBe('http://example.com/items.bib');
				hasTranslated = true;
				// delayed to make sure input becomes readonly
				return res(ctx.delay(100), ctx.json(responseTranslateItems));
			})
		);

		renderWithProviders(<Container />);
		const input = await screen.findByRole(
			'searchbox', { name: 'Enter a URL, ISBN, DOI, PMID, arXiv ID, or title' }
		);
		const user = userEvent.setup();
		await user.type(input, 'http://example.com/items.bib{enter}');

		await waitFor(() => expect(screen.getByRole(
			'searchbox', { name: 'Enter a URL, ISBN, DOI, PMID, arXiv ID, or title' })
		).toHaveAttribute('readonly'));

		const dialog = await screen.findByRole('dialog', { name: 'Select Entries to Add' });
		const results = getByRole(dialog, 'list', { name: 'Results' });
		expect(getAllByRole(results, 'listitem')).toHaveLength(3);

		const result = getByRole(results, 'listitem', { name: /A Dog’s Purpose/ });

		expect(getByRole(dialog, 'button', { name: 'Add Selected' })).toBeDisabled();
		expect(getByRole(result, 'checkbox')).not.toBeChecked();
		await user.click(result); // clicking anywhere on the item toggles selection
		expect(getByRole(dialog, 'button', { name: 'Add Selected' })).toBeEnabled();
		expect(getByRole(result, 'checkbox')).toBeChecked();

		await user.click(getByRole(dialog, 'button', { name: 'Add Selected' }));

		await waitFor(() => expect(screen.queryByRole(
			'dialog', { name: 'Select Entries to Add' }
		)).not.toBeInTheDocument());

		const bibliography = screen.getByRole("list", { name: "Bibliography" });
		expect(getAllByRole(bibliography, 'listitem')).toHaveLength(6);

		expect(hasTranslated).toBe(true);
	});

	test('Supports picking an item from a search query', async () => {
		let requestCounter = 0;
		server.use(
			rest.post('http://localhost/search', async (req, res, ctx) => {
				requestCounter++;
				if(requestCounter === 1) {
					expect(await req.text()).toBe('Doggos');
					return res(
						ctx.status(300),
						ctx.set('Link', '</search?start=dd1857be0cd0b3d2c9b556c16cc63b16>; rel="next"'),
						ctx.json(responseTranslateSearch)
					);
				} else if(requestCounter === 2) {
					expect(req.url.searchParams.get('start')).toBe('dd1857be0cd0b3d2c9b556c16cc63b16');
					return res(
						ctx.status(300),
						ctx.json(responseTranslateSearchMore)
					);
				} else if(requestCounter === 3) {
					expect(await req.text()).toBe('10.3389/fvets.2021.675782');
					return res(
						ctx.json(responseTranslateDOI)
					);
				}
			})
		);

		renderWithProviders(<Container />);
		const input = await screen.findByRole(
			'searchbox', { name: 'Enter a URL, ISBN, DOI, PMID, arXiv ID, or title' }
		);
		const user = userEvent.setup();
		await user.type(input, 'Doggos{enter}');

		const dialog = await screen.findByRole('dialog', { name: 'Select a Search Result to Add' });
		const results = getByRole(dialog, 'list', { name: 'Results' });
		expect(getAllByRole(results, 'listitem')).toHaveLength(3);

		const moreButton = getByRole(dialog, 'button', { name: 'More…' });

		await user.click(moreButton);

		await waitFor(() => expect(getAllByRole(results, 'listitem')).toHaveLength(5));
		expect(queryByRole(dialog, 'button', { name: 'More…' })).not.toBeInTheDocument();

		const result = getByRole(results, 'listitem', { name: /The New Era of Canine Science: Reshaping Our Relationships With Dogs/ });
		await user.click(result);

		await waitFor(() => expect(screen.queryByRole(
			'dialog', { name: 'Select a Search Result to Add' }
		)).not.toBeInTheDocument());

		const bibliography = screen.getByRole("list", { name: "Bibliography" });
		await waitFor(() => expect(getAllByRole(bibliography, 'listitem')).toHaveLength(6));

		expect(requestCounter).toBe(3);
	});

	test('Items are processed when translating while APA style selected', async () => {
		localStorage.setItem('zotero-bib-citation-style', 'apa');
		let hasTranslated = false;
		server.use(
			rest.get('https://www.zotero.org/styles/apa', (req, res, ctx) => {
				return res(
					ctx.set('Content-Type', 'application/vnd.citationstyles.style+xml'),
					ctx.text(apaStyle),
				);
			}),
		);
		server.use(
			rest.post('http://localhost/search', async (req, res, ctx) => {
				expect(await req.text()).toBe('123456789');
				hasTranslated = true;
				// delayed to make sure input becomes readonly
				return res(ctx.delay(100), ctx.json(responseTranslateAPAIdentifier));
			})
		);

		renderWithProviders(<Container />);
		const input = await screen.findByRole(
			'searchbox', { name: 'Enter a URL, ISBN, DOI, PMID, arXiv ID, or title' }
		);
		const user = userEvent.setup();
		await user.type(input, '123456789{enter}');

		await waitFor(() => expect(screen.getByRole(
			'searchbox', { name: 'Enter a URL, ISBN, DOI, PMID, arXiv ID, or title' })
		).toHaveAttribute('readonly'));

		const newItemSection = await screen.findByRole('region', { name: 'New item…' });

		await waitFor(() => expect(screen.getByRole(
			'searchbox', { name: 'Enter a URL, ISBN, DOI, PMID, arXiv ID, or title' }
		)).not.toHaveAttribute('readonly'));

		expect(getByText(newItemSection, /Circadian mood variations in twitter content/)).toBeInTheDocument();
		expect(hasTranslated).toBe(true);
	});

	test("Multi-line pasted data is translated using /import endpoint", async () => {
		let hasTranslated = false;
		server.use(
			rest.post('http://localhost/import', async (req, res, ctx) => {
				expect(await req.text()).toEqual(understandingDogsBib);
				hasTranslated = true;
				return res(ctx.delay(100), ctx.json(responseTranslatePasted));
			})
		);

		renderWithProviders(<Container />);

		const input = await screen.findByRole(
			'searchbox', { name: 'Enter a URL, ISBN, DOI, PMID, arXiv ID, or title' }
		);

		expect(input).toHaveFocus();
		fireEvent.paste(input, { clipboardData: { getData: () => understandingDogsBib } });

		const newItemSection = await screen.findByRole('region', { name: 'New item…' });
		expect(await findByText(newItemSection, /Understanding Dogs/)).toBeInTheDocument();
		expect(hasTranslated).toBe(true);
	});

	test("Trailing newline is ignored in pasted data", async () => {
		let hasTranslated = false;
		server.use(
			rest.post('http://localhost/search', async (req, res, ctx) => {
				expect(await req.text()).toBe('978-1979837125');
				hasTranslated = true;
				// delayed to make sure input becomes readonly
				return res(ctx.delay(100), ctx.json(responseTranslateIdentifier));
			})
		);
		renderWithProviders(<Container />);
		const input = await screen.findByRole(
			'searchbox', { name: 'Enter a URL, ISBN, DOI, PMID, arXiv ID, or title' }
		);
		expect(input).toHaveFocus();
		fireEvent.paste(input, { clipboardData: { getData: () => "978-1979837125\n " } });

		// should ignore this paste event and do nothing
		await waitForPosition();
		expect(screen.getByRole(
			'searchbox', { name: 'Enter a URL, ISBN, DOI, PMID, arXiv ID, or title' }
		)).not.toHaveAttribute('readonly')

		expect(hasTranslated).toBe(false);
	});
});
