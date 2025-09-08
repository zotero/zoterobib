import '@testing-library/jest-dom'
import copy from 'copy-to-clipboard';
import fileSaver from 'file-saver';
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { findByRole, getAllByRole, getByRole, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { applyAdditionalJestTweaks, getFileAsText } from './utils/common';
import { installMockedXHR, uninstallMockedXHR, installUnhandledRequestHandler } from './utils/xhr-mock';
import Container from '../src/js/components/container';
import { renderWithProviders } from './utils/render';
import modernLanguageAssociationStyle from './fixtures/modern-language-association.xml';
import schema from './fixtures/schema.json';
import localStorage100Items from './fixtures/local-storage-100-items.json';
import natureStyle from './fixtures/nature.xml';

import CSL from 'citeproc';
window.CSL = CSL;

jest.mock('copy-to-clipboard');
jest.mock('file-saver');

applyAdditionalJestTweaks();


describe('Citations', () => {
	const handlers = [];
	const server = setupServer(...handlers)

	beforeAll(() => {
		installUnhandledRequestHandler(server);
		installMockedXHR();
	});

	beforeEach(() => {
		copy.mockReturnValue(true);
		delete window.location;
		window.location = new URL('http://localhost/');
		server.use(
			http.get('https://api.zotero.org/schema', () => {
				return HttpResponse.json(schema);
			})
		);
		server.use(
			http.get('https://www.zotero.org/styles/modern-language-association', () => {
				return HttpResponse.text(modernLanguageAssociationStyle, {
					headers: { 'Content-Type': 'application/vnd.citationstyles.style+xml' },
				});
			}),
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
		localStorage.clear();
	});
	afterAll(() => {
		uninstallMockedXHR();
		server.close();
	});

	test('Supports copying bibliography to clipboard', async () => {
		copy.mockReturnValue(true);
		renderWithProviders(<Container />);
		const user = userEvent.setup();
		const button = await screen.findByRole('button', { name: 'Copy to Clipboard' });
		await user.click(button);
		expect(await screen.findByRole('button', { name: 'Copied!' })).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Copy to Clipboard' })).not.toBeInTheDocument();
		expect(copy.mock.calls[0][0]).toEqual(
			expect.stringContaining('Bose, K. S., and R. H. Sarma. “Delineation of the Intimate Details of the Backbone Conformation of Pyridine Nucleotide Coenzymes in Aqueous Solution.”')
		);
		await waitFor(
			() => expect(screen.queryByRole('button', { name: 'Copied!' })).not.toBeInTheDocument(),
			{ timeout: 2000 }
		);
		expect(screen.getByRole('button', { name: 'Copy to Clipboard' })).toBeInTheDocument();
	});

	test('Supports downloading bibliography as .rtf', async () => {
		renderWithProviders(<Container />);
		const user = userEvent.setup();
		const button = await screen.findByRole('button', { name: 'Export Options' });
		await user.click(button);
		const menuoption = await screen.findByRole('menuitem', { name: 'Download RTF (all word processors)' });
		await user.click(menuoption);
		const text = await getFileAsText(fileSaver.saveAs.mock.calls[0][0]);
		expect(text.slice(0, 5)).toEqual('{\\rtf');
		expect(text).toEqual(expect.stringContaining('\\uc0\\u8220{}Delineation of the Intimate Details of the Backbone Conformation of Pyridine Nucleotide Coenzymes in Aqueous Solution.\\uc0\\u8221{}'));
		await waitFor(
			() => expect(screen.queryByRole('menu', { name: 'Export Options' })).not.toBeInTheDocument()
		);
	});

	test('Supports copying bibliography as HTML', async () => {
		copy.mockReturnValue(true);
		renderWithProviders(<Container />);
		const user = userEvent.setup();
		const button = await screen.findByRole('button', { name: 'Export Options' });
		await user.click(button);
		const menuoption = await screen.findByRole('menuitem', { name: 'Copy HTML' });
		await user.click(menuoption);
		expect(await screen.findByRole('menuitem', { name: 'Copied!' })).toBeInTheDocument();
		expect(copy.mock.calls[0][0]).toEqual(
			expect.stringMatching(new RegExp('<div class="csl-bib-body".*?>\\s*(<div class="csl-entry"\\s*>.*?</div>\\s*){5}\\s*</div>', 'i'))
		);
		await waitFor(
			() => expect(screen.queryByRole('menuitem', { name: 'Copied!' })).not.toBeInTheDocument()
		);
		await waitFor(
			() => expect(screen.queryByRole('menu', { name: 'Export Options' })).not.toBeInTheDocument()
		);
	});

	test('Supports downloading bibliography as RIS file', async () => {
		server.use(
			http.post('http://localhost/export', async ({ request }) => {
				const url = new URL(request.url);
				const items = await request.json();
				expect(url.searchParams.get('format')).toEqual('ris');
				expect(items).toHaveLength(5);
				expect(items.map(item => item.title)).toEqual(expect.objectContaining(localStorage100Items.slice(0, 5).map(item => item.title)))
				return HttpResponse.text('RIS FORMAT', {
					headers: { 'Content-Type': 'application/x-research-info-systems' },
				});
			}),
		);
		renderWithProviders(<Container />);
		const user = userEvent.setup();
		const button = await screen.findByRole('button', { name: 'Export Options' });
		await user.click(button);
		const menuoption = await screen.findByRole('menuitem', { name: 'Download RIS' });
		await user.click(menuoption);
		const text = await getFileAsText(fileSaver.saveAs.mock.calls[0][0]);
		expect(text).toEqual('RIS FORMAT');
		await waitFor(
			() => expect(screen.queryByRole('menu', { name: 'Export Options' })).not.toBeInTheDocument()
		);
	});

	test('Supports downloading bibliography as BibTex file', async () => {
		server.use(
			http.post('http://localhost/export', async ({ request }) => {
				const url = new URL(request.url);
				const items = await request.json();
				expect(url.searchParams.get('format')).toEqual('bibtex');
				expect(items).toHaveLength(5);
				expect(items.map(item => item.title)).toEqual(expect.objectContaining(localStorage100Items.slice(0, 5).map(item => item.title)))
				return HttpResponse.text('BibTeX FORMAT', {
					headers: { 'Content-Type': 'application/x-bibtex' },
				});
			}),
		);
		renderWithProviders(<Container />);
		const user = userEvent.setup();
		const button = await screen.findByRole('button', { name: 'Export Options' });
		await user.click(button);
		const menuoption = await screen.findByRole('menuitem', { name: 'Download BibTeX' });
		await user.click(menuoption);
		const text = await getFileAsText(fileSaver.saveAs.mock.calls[0][0]);
		expect(text).toEqual('BibTeX FORMAT');
		await waitFor(
			() => expect(screen.queryByRole('menu', { name: 'Export Options' })).not.toBeInTheDocument()
		);
	});

	test('Clicking Save to Zotero displays info dialog', async () => {
		renderWithProviders(<Container />);
		const user = userEvent.setup();
		const button = await screen.findByRole('button', { name: 'Export Options' });
		await user.click(button);
		const menuoption = await screen.findByRole('menuitem', { name: 'Save to Zotero' });
		await user.click(menuoption);
		expect(await screen.findByRole('dialog', { name: 'Save to Zotero' })).toBeInTheDocument();
	});

	test('Supports deleting entire bibliography', async () => {
		renderWithProviders(<Container />);
		const citations = getAllByRole(
			await screen.findByRole('list', { name: 'Bibliography' }, { timeout: 3000 }),
			'listitem', { name: 'Citation' }
		);
		expect(citations).toHaveLength(5);
		const user = userEvent.setup();
		const button = await screen.findByRole('button', { name: 'Delete Bibliography' });
		await user.click(button);
		const dialog = await screen.findByRole('dialog', { name: 'Clear Bibliography?' });
		expect(dialog).toHaveTextContent(/5 entries will be deleted/);
		await user.click(getByRole(dialog, 'button', { name: 'Delete' }));
		await waitFor(
			() => expect(screen.queryByRole('dialog', { name: 'Clear Bibliography?' })).not.toBeInTheDocument()
		);
		await waitFor(
			() => expect(screen.queryByRole('list', { name: 'Bibliography' })).not.toBeInTheDocument(),
			{ timeout: 3000 }
		);
	});

	test('Supports creating a link to bibliography', async () => {
		server.use(
			http.post('http://localhost/store', async ({ request }) => {
				const reqJSON = await request.json();
				expect(reqJSON.citationStyle).toEqual('modern-language-association');
				expect(reqJSON.items).toHaveLength(5);

				return HttpResponse.json({ "key": "d3b2fbdeadff4a00aecd048451a962b9" });
			}),
		);
		copy.mockReturnValue(true);
		renderWithProviders(<Container />);
		await screen.findByRole('list', { name: 'Bibliography' }, { timeout: 3000 });
		const user = userEvent.setup();
		const section = screen.getByRole('region', { name: "Link to this version" });
		await user.click(getByRole(section, 'button', { name: 'Create' }));
		const copyURL = await findByRole(section, 'button', { name: 'Copy URL' });
		const link = await findByRole(section, 'link', { name: 'View' });
		await user.click(copyURL);
		expect(copy).toHaveBeenCalledWith('http://localhost/d3b2fbdeadff4a00aecd048451a962b9');
		expect(link).toHaveAttribute('href', 'http://localhost/d3b2fbdeadff4a00aecd048451a962b9');
	});
});
