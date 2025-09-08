import '@testing-library/jest-dom'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { getAllByRole, getByRole, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { applyAdditionalJestTweaks } from './utils/common';
import { installMockedXHR, uninstallMockedXHR, installUnhandledRequestHandler } from './utils/xhr-mock';
import Container from '../src/js/components/container';
import { renderWithProviders } from './utils/render';
import modernLanguageAssociationStyle from './fixtures/modern-language-association.xml';
import schema from './fixtures/schema.json';
import localStorage100Items from './fixtures/local-storage-100-items.json';

import CSL from 'citeproc';
window.CSL = CSL;

applyAdditionalJestTweaks();

describe('Basic UI', () => {
	const handlers = [];
	const server = setupServer(...handlers)

	beforeAll(() => {
		installUnhandledRequestHandler(server);
		installMockedXHR();
	});

	beforeEach(() => {
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

	test('Shows all UI elements', async () => {
		renderWithProviders(<Container />);
		expect(await screen.findByRole(
			'heading', { name: 'ZoteroBib' })
		).toBeInTheDocument();
		expect(screen.getByRole(
			'searchbox', { name: 'Enter a URL, ISBN, DOI, PMID, arXiv ID, or title' }
		)).toBeInTheDocument();
		expect(screen.getByRole(
			'button', { name: "Cite" }
		)).toBeInTheDocument();
		expect(screen.getByRole(
			'button', { name: "Manual Entry" }
		)).toBeInTheDocument();
		expect(screen.getByRole(
			'textbox', { name: "Bibliography Title" }
		)).toHaveTextContent('hello world');
		expect(screen.getByRole(
			'combobox', { name: "Citation Style" }
		)).toBeInTheDocument();
		const bibliography = await screen.findByRole("list", { name: "Bibliography" }, { timeout: 3000 });
		expect(bibliography).toBeInTheDocument();
		const citations = getAllByRole(bibliography, 'listitem', { name: 'Citation' })
		expect(citations).toHaveLength(5);
		expect(getByRole(
			citations[0], 'button', { name: 'Copy Citation' })
		).toBeInTheDocument();
		expect(getByRole(
			citations[0], 'button', { name: 'Copy Bibliography Entry' })
		).toBeInTheDocument();
		expect(getByRole(
			citations[0], 'button', { name: 'Delete Entry' })
		).toBeInTheDocument();
		expect(screen.getByRole(
			'button', { name: "Copy to Clipboard" }
		)).toBeInTheDocument();
		expect(screen.getByRole(
			'button', { name: "Export Options" }
		)).toBeInTheDocument();
		expect(screen.getByRole(
			'button', { name: "Delete Bibliography" }
		)).toBeInTheDocument();
		expect(screen.getByRole(
			'button', { name: "Create" }
		)).toBeInTheDocument();
		expect(screen.getByRole(
			'button', { name: "Awesome! Let’s start!" }
		)).toBeInTheDocument();
		expect(screen.getByRole(
			'link', { name: "FAQ" }
		)).toBeInTheDocument();
		expect(screen.getByRole(
			'link', { name: "Privacy" }
		)).toBeInTheDocument();
	});

	test('Change bibliography title', async () => {
		renderWithProviders(<Container />);
		const user = userEvent.setup();
		const title = screen.getByRole('textbox', { name: "Bibliography Title" });
		expect(title).toHaveTextContent('hello world');
		await user.type(title, 'lorem ipsum{enter}');
		expect(screen.getByRole('textbox', { name: "Bibliography Title" })).toHaveTextContent('lorem ipsum');
	});
});
