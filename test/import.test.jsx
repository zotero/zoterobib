import '@testing-library/jest-dom'
import { delay, http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { getAllByRole, getByRole, getByText, screen, waitFor, queryByRole, queryByText } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { applyAdditionalJestTweaks } from './utils/common';
import { installMockedXHR, uninstallMockedXHR, installUnhandledRequestHandler } from './utils/xhr-mock';
import Container from '../src/js/components/container';
import { renderWithProviders } from './utils/render';
import schema from './fixtures/schema.json';
import localStorage100Items from './fixtures/local-storage-100-items.json';
import responseTranslateIdentifier from './fixtures/response-translate-identifier.json';
import modernLanguageAssociationStyle from './fixtures/modern-language-association.xml';
import theJournalsOfGerontologySeriesA from './fixtures/the-journals-of-gerontology-series-a';
import natureStyle from './fixtures/nature.xml';
import harvardCiteThemRight from './fixtures/harvard-cite-them-right.xml';
import stylesJson from './fixtures/styles.json';

import CSL from 'citeproc';
window.CSL = CSL;

applyAdditionalJestTweaks();

describe('Import', () => {
	const handlers = [];
	const server = setupServer(...handlers)

	beforeAll(() => {
		installUnhandledRequestHandler(server);
		installMockedXHR();
	});

	beforeEach(() => {
		window.jsdom.reconfigure({ url: 'http://localhost/' });
		server.use(
			http.get('https://api.zotero.org/schema', () => {
				return HttpResponse.json(schema);
			})
		);
		server.use(
			http.get(/https:\/\/www.zotero.org\/styles\/(modern-language-association|mla)/, () => {
				return HttpResponse.text(modernLanguageAssociationStyle, {
					headers: { 'Content-Type': 'application/vnd.citationstyles.style+xml' },
				});
			}),
		);
		server.use(
			http.get(/https:\/\/www\.zotero\.org\/styles\/(harvard-cite-them-right|harvard-university-west-london)/, () => {
				return HttpResponse.text(harvardCiteThemRight, {
					headers: { 'Content-Type': 'application/vnd.citationstyles.style+xml' },
				});
			}),
		);
		server.use(
			http.get('https://www.zotero.org/styles/the-journals-of-gerontology-series-a', () => {
				return HttpResponse.text(theJournalsOfGerontologySeriesA, {
					headers: { 'Content-Type': 'application/vnd.citationstyles.style+xml' },
				});
			}),
		);
		server.use(
			http.get('https://www.zotero.org/styles-files/styles.json', () => {
				return HttpResponse.json(stylesJson);
			}),
		);
		server.use(
			http.post('http://localhost/search', async ({ request }) => {
				expect(await request.text()).toBe('1234');
				await delay(100); // delayed to make sure input becomes readonly
				return HttpResponse.json(responseTranslateIdentifier);
			})
		);
		server.use(
			http.get('https://www.zotero.org/styles/nature', () => {
				return HttpResponse.text(natureStyle, {
					headers: { 'Content-Type': 'application/vnd.citationstyles.style+xml' },
				});
			}),
		);

		localStorage.setItem(
			'zotero-bib-items',
			JSON.stringify(localStorage100Items.slice(0, 5)) // improve performance by using a small slice
		);
		localStorage.setItem('zotero-bib-title', 'hello world');
	});

	afterEach(() => {
		server.resetHandlers();
		localStorage.removeItem('zotero-bib-citation-style');
	});

	afterAll(() => {
		uninstallMockedXHR();
		server.close();
	});

	test('Shows confirmation dialog when adding a single item via /import endpoint', async () => {
		window.jsdom.reconfigure({ url: 'http://localhost/import?q=1234' });
		renderWithProviders(<Container />);
		const user = userEvent.setup();

		const modal = await screen.findByRole('dialog', { name: 'Add this citation to your bibliography?' }, { timeout: 3000 });
		await user.click(getByRole(modal, 'button', { name: 'Add' }));
		const newItemSection = await screen.findByRole('region', { name: 'New item…' });

		await waitFor(() => expect(screen.getByRole(
			'searchbox', { name: 'Enter a URL, ISBN, DOI, PMID, arXiv ID, or title' }
		)).not.toHaveAttribute('readonly'));

		expect(getByText(newItemSection, /The Complete Golden Retriever Handbook/)).toBeInTheDocument();
		const bibliography = screen.getByRole("list", { name: "Bibliography" });
		expect(getAllByRole(bibliography, 'listitem')).toHaveLength(6);
	});

	test('Switches citation style when adding new citation via /import endpoint', async () => {
		window.jsdom.reconfigure({ url: 'http://localhost/import?q=1234&style=nature' });
		const user = userEvent.setup();
		renderWithProviders(<Container />);

		const modal = await screen.findByRole('dialog', { name: 'Add this citation to your bibliography?' }, { timeout: 3000 });
		expect(getByRole(modal, 'tab', { name: 'MLA Handbook (in-text citations)', selected: true })).toBeInTheDocument();
		const incomingStyleTab = getByRole(modal, 'tab', { name: 'Nature' });
		expect(getByRole(modal, 'button', { name: 'Add' })).toBeInTheDocument();
		await user.click(incomingStyleTab);
		expect(getByRole(modal, 'tab', { name: 'Nature', selected: true })).toBeInTheDocument();
		await user.click(getByRole(modal, 'button', { name: 'Add and switch to "Nature"' }));
		await waitFor(() => expect(screen.getByRole(
			'searchbox', { name: 'Enter a URL, ISBN, DOI, PMID, arXiv ID, or title' }
		)).not.toHaveAttribute('readonly'));
		expect(screen.getByRole('combobox', { name: "Citation Style", expanded: false })).toHaveTextContent(/Nature/);
		const newItemSection = await screen.findByRole('region', { name: 'New item…' });
		expect(getByText(newItemSection, /1\./)).toBeInTheDocument();
		const bibliography = screen.getByRole("list", { name: "Bibliography" });
		expect(getAllByRole(bibliography, 'listitem')).toHaveLength(6);
		expect(localStorage.getItem('zotero-bib-citation-style')).toBe('nature');
	});

	test('Installs citation style, even if provided as alias, when adding new citation via /import endpoint', async () => {
		window.jsdom.reconfigure({ url: 'http://localhost/import?q=1234&style=harvard-university-west-london' });
		const user = userEvent.setup();
		renderWithProviders(<Container />);

		const modal = await screen.findByRole('dialog', { name: 'Add this citation to your bibliography?' }, { timeout: 3000 });
		expect(getByRole(modal, 'tab', { name: 'MLA Handbook (in-text citations)', selected: true })).toBeInTheDocument();
		const incomingStyleTab = getByRole(modal, 'tab', { name: 'Cite Them Right 12th edition - Harvard' });
		expect(getByRole(modal, 'button', { name: 'Add' })).toBeInTheDocument();
		await user.click(incomingStyleTab);
		expect(getByRole(modal, 'tab', { name: 'Cite Them Right 12th edition - Harvard', selected: true })).toBeInTheDocument();
		await user.click(getByRole(modal, 'button', { name: 'Add and switch to "Cite Them Right 12th edition - Harvard"' }));
		await user.click(await screen.findByRole('button', { name: "OK, I’ll Edit Them" })); // sentence-case dialog
		await waitFor(() => expect(screen.getByRole(
			'searchbox', { name: 'Enter a URL, ISBN, DOI, PMID, arXiv ID, or title' }
		)).not.toHaveAttribute('readonly'));
		expect(screen.getByRole('combobox', { name: "Citation Style", expanded: false })).toHaveTextContent(/Cite Them Right 12th edition - Harvard/);
		const newItemSection = await screen.findByRole('region', { name: 'New item…' });
		expect(getByText(newItemSection, /The complete Golden Retriever handbook/)).toBeInTheDocument();
		const bibliography = screen.getByRole("list", { name: "Bibliography" });
		expect(getAllByRole(bibliography, 'listitem')).toHaveLength(6);
		expect(localStorage.getItem('zotero-bib-citation-style')).toBe('harvard-cite-them-right');
	});

	test('Presevers current citation style while adding new citation via /import endpoint', async () => {
		window.jsdom.reconfigure({ url: 'http://localhost/import?q=1234&style=nature' });
		const user = userEvent.setup();
		renderWithProviders(<Container />);

		const modal = await screen.findByRole('dialog', { name: 'Add this citation to your bibliography?' }, { timeout: 3000 });
		expect(getByRole(modal, 'tab', { name: 'MLA Handbook (in-text citations)', selected: true })).toBeInTheDocument();
		expect(getByRole(modal, 'tab', { name: 'Nature' })).toBeInTheDocument();
				await user.click(getByRole(modal, 'button', { name: 'Add' }));

		await waitFor(() => expect(screen.getByRole(
			'searchbox', { name: 'Enter a URL, ISBN, DOI, PMID, arXiv ID, or title' }
		)).not.toHaveAttribute('readonly'));

		expect(screen.getByRole('combobox', { name: "Citation Style", expanded: false })).toHaveTextContent(/Modern Language Association/);
		const newItemSection = await screen.findByRole('region', { name: 'New item…' });
		expect(getByText(newItemSection, /The Complete Golden Retriever Handbook/)).toBeInTheDocument();
		expect(queryByText(newItemSection, /1\./)).not.toBeInTheDocument();
		const bibliography = screen.getByRole("list", { name: "Bibliography" });
		expect(getAllByRole(bibliography, 'listitem')).toHaveLength(6);
		expect(localStorage.getItem('zotero-bib-citation-style')).toBeNull(); // unchanged
	});

	test('Recognizes current and incoming citation styles are the same when adding via /import endpoint', async () => {
		window.jsdom.reconfigure({ url: 'http://localhost/import?q=1234&style=modern-language-association' });
		const user = userEvent.setup();
		renderWithProviders(<Container />);

		const modal = await screen.findByRole('dialog', { name: 'Add this citation to your bibliography?' }, { timeout: 3000 });
		expect(queryByRole(modal, 'tab')).not.toBeInTheDocument();
		await user.click(getByRole(modal, 'button', { name: 'Add' }));

		await waitFor(() => expect(screen.getByRole(
			'searchbox', { name: 'Enter a URL, ISBN, DOI, PMID, arXiv ID, or title' }
		)).not.toHaveAttribute('readonly'));

		expect(screen.getByRole('combobox', { name: "Citation Style", expanded: false })).toHaveTextContent(/Modern Language Association/);
		const newItemSection = await screen.findByRole('region', { name: 'New item…' });
		expect(getByText(newItemSection, /The Complete Golden Retriever Handbook/)).toBeInTheDocument();
		expect(queryByText(newItemSection, /1\./)).not.toBeInTheDocument();
		const bibliography = screen.getByRole("list", { name: "Bibliography" });
		expect(getAllByRole(bibliography, 'listitem')).toHaveLength(6);
	});

	test('Recognizes current and incoming citation styles are the same, even when dealing with an alais, when adding via /import endpoint', async () => {
		window.jsdom.reconfigure({ url: 'http://localhost/import?q=1234&style=modern-language-association' });
		const user = userEvent.setup();
		renderWithProviders(<Container />);

		const modal = await screen.findByRole('dialog', { name: 'Add this citation to your bibliography?' }, { timeout: 3000 });
		expect(queryByRole(modal, 'tab')).not.toBeInTheDocument();
		await user.click(getByRole(modal, 'button', { name: 'Add' }));

		await waitFor(() => expect(screen.getByRole(
			'searchbox', { name: 'Enter a URL, ISBN, DOI, PMID, arXiv ID, or title' }
		)).not.toHaveAttribute('readonly'));

		expect(screen.getByRole('combobox', { name: "Citation Style", expanded: false })).toHaveTextContent(/Modern Language Association/);
		const newItemSection = await screen.findByRole('region', { name: 'New item…' });
		expect(getByText(newItemSection, /The Complete Golden Retriever Handbook/)).toBeInTheDocument();
		expect(queryByText(newItemSection, /1\./)).not.toBeInTheDocument();
		const bibliography = screen.getByRole("list", { name: "Bibliography" });
		expect(getAllByRole(bibliography, 'listitem')).toHaveLength(6);
	});

	test('Confirmation is not required if bibliography is empty', async () => {
		localStorage.removeItem('zotero-bib-items');
		window.jsdom.reconfigure({ url: 'http://localhost/import?q=1234&style=nature' });
		renderWithProviders(<Container />);
		await waitFor(() => expect(getByText(screen.getByRole('region', { name: 'New item…' }), /1\./)).toBeInTheDocument(), { timeout: 3000 });
		const bibliography = screen.getByRole("list", { name: "Bibliography" });
		expect(getAllByRole(bibliography, 'listitem')).toHaveLength(1); // eslint-disable-line jest-dom/prefer-in-document
		expect(screen.getByRole('combobox', { name: "Citation Style", expanded: false })).toHaveTextContent(/Nature/);
	});

	test('Confirmation dialog works with a style that have very long names and empty titleShort', async () => {
		window.jsdom.reconfigure({ url: 'http://localhost/import?q=1234&style=the-journals-of-gerontology-series-a' });
		const user = userEvent.setup();
		renderWithProviders(<Container />);
		const modal = await screen.findByRole('dialog', { name: 'Add this citation to your bibliography?' }, { timeout: 3000 });
		expect(getByRole(modal, 'tab', { name: 'MLA Handbook (in-text citations)' })).toBeInTheDocument();
		// this style has a very long title and empty titleShort tag (which should be ignored).
		// In this scenario tab shows a truncated full title and button uses different label that doesn't include style title
		await user.click(getByRole(modal, 'tab', { name: /The Journals of Gerontology/ }));
		expect(getByRole(modal, 'button', { name: 'Add and switch to this style' }));
	});
});
