import '@testing-library/jest-dom'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { findByRole, getAllByRole, getByRole, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { applyAdditionalJestTweaks } from './utils/common';
import { installMockedXHR, uninstallMockedXHR, installUnhandledRequestHandler } from './utils/xhr-mock';
import Container from '../src/js/components/container';
import { renderWithProviders } from './utils/render';
import modernLanguageAssociationStyle from './fixtures/modern-language-association.xml';
import turabianNotesBibStyle from './fixtures/turabian-notes-bibliography.xml';
import chicagoNotesBibStyle from './fixtures/chicago-notes-bibliography-subsequent-author-title-17th-edition.xml'
import natureStyle from './fixtures/nature.xml';
import schema from './fixtures/schema.json';
import localStorage100Items from './fixtures/local-storage-100-items.json';
import stylesJson from './fixtures/styles.json';
import localStorageItemsForApa from './fixtures/local-storage-items-for-apa.json';
import apaStyle from './fixtures/apa.xml';

import CSL from 'citeproc';
window.CSL = CSL;

applyAdditionalJestTweaks();

describe('Editor', () => {
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

	afterEach(() => {
		server.resetHandlers();
		localStorage.clear();
	});

	afterAll(() => {
		uninstallMockedXHR();
		server.close();
	});

	test('Supports changing style', async () => {
		server.use(
			http.get('https://www.zotero.org/styles/chicago-notes-bibliography-subsequent-author-title-17th-edition', () => {
				return HttpResponse.text(chicagoNotesBibStyle, {
					headers: { 'Content-Type': 'application/vnd.citationstyles.style+xml' },
				});
			}),
		);
		server.use(
			http.get('https://www.zotero.org/styles/turabian-notes-bibliography', () => {
				return HttpResponse.text(turabianNotesBibStyle, {
					headers: { 'Content-Type': 'application/vnd.citationstyles.style+xml' },
				});
			}),
		);

		renderWithProviders(<Container />);
		const user = userEvent.setup();
		let bibliography = await screen.findByRole('list', { name: 'Bibliography' }, { timeout: 3000 });
		expect(
			getAllByRole(bibliography, 'listitem')[0].querySelector('.csl-entry-container').innerHTML
		).toEqual('Bose, K. S., and R. H. Sarma. “Delineation of the Intimate Details of the Backbone Conformation of Pyridine Nucleotide Coenzymes in Aqueous Solution.” <i>Biochemical and Biophysical Research Communications</i>, vol. 66, no. 4, Oct. 1975, pp. 1173–79. <i>PubMed</i>, https://doi.org/10.1016/0006-291x(75)90482-9.');
		const styleSelector = screen.getByRole('combobox', { name: "Citation Style" });
		expect(styleSelector).toHaveTextContent(/Modern Language Association/);
		await user.click(styleSelector);
		const option = getByRole(getByRole(styleSelector, 'listbox'), 'option', { name: /Turabian/ });
		await userEvent.click(option);
		expect(screen.getByRole('combobox', { name: "Citation Style", expanded: false })).toHaveTextContent(/Turabian/);
		bibliography = await screen.findByRole('list', { name: 'Bibliography' }, { timeout: 3000 });
		expect(
			getAllByRole(bibliography, 'listitem')[0].querySelector('.csl-entry-container').innerHTML
		).toEqual('Bose, K. S., and R. H. Sarma. “Delineation of the Intimate Details of the Backbone Conformation of Pyridine Nucleotide Coenzymes in Aqueous Solution.” <i>Biochemical and Biophysical Research Communications</i> 66, no. 4 (October 1975): 1173–79. https://doi.org/10.1016/0006-291x(75)90482-9.');
	});

	test('Supports installing new style', async () => {
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
		renderWithProviders(<Container />);
		const user = userEvent.setup();
		await screen.findByRole('list', { name: 'Bibliography' }, { timeout: 3000 });
		const styleSelector = screen.getByRole('combobox', { name: "Citation Style" });
		await user.click(styleSelector);
		const options = getAllByRole(getByRole(styleSelector, 'listbox'), 'option');
		expect(options).toHaveLength(5);
		const lastOption = options[options.length - 1];
		expect(lastOption).toHaveTextContent(/\s*[\d,'.]+\+ other styles available…/);
		await user.click(lastOption);
		const installer = await screen.findByRole('dialog', { name: 'Add a Citation Style' });
		const list = await findByRole(installer, 'list', { name: 'Citation Styles' }, { timeout: 3000 });
		expect(getAllByRole(list, 'listitem')).toHaveLength(4);
		const search = getByRole(installer, 'searchbox', { name: 'Search Citation Styles' });
		await user.type(search, 'nature');
		const natureEntry = await findByRole(list, 'listitem', { name: 'Nature' });
		const addStyle = getByRole(natureEntry, 'button', { name: 'Add' });
		await user.click(addStyle);
		await waitFor(
			() => expect(screen.queryByRole('dialog', { name: 'Add a Citation Style' })).not.toBeInTheDocument()
		);
		const bibliography = await screen.findByRole('list', { name: 'Bibliography' }, { timeout: 3000 });
		expect(getAllByRole(bibliography, 'listitem')[0]).toHaveTextContent(/1\.Makar,/);
	});

	test('Supports removing style, if not in use', async () => {
		server.use(
			http.get('https://www.zotero.org/styles-files/styles.json', () => {
				return HttpResponse.json(stylesJson);
			}),
		);
		localStorage.setItem(
			'zotero-bib-extra-citation-styles',
			JSON.stringify([{ "name": "nature", "title": "Nature", "isDependent": 0, "isCore": false }])
		);
		renderWithProviders(<Container />);
		const user = userEvent.setup();
		await screen.findByRole('list', { name: 'Bibliography' }, { timeout: 3000 });
		const styleSelector = screen.getByRole('combobox', { name: "Citation Style" });
		await user.click(styleSelector);
		const options = getAllByRole(getByRole(styleSelector, 'listbox'), 'option');
		const lastOption = options[options.length - 1];
		expect(lastOption).toHaveTextContent(/\s*[\d,'.]+\+ other styles available…/);
		await user.click(lastOption);
		const installer = await screen.findByRole('dialog', { name: 'Add a Citation Style' });
		const list = await findByRole(installer, 'list', { name: 'Citation Styles' }, { timeout: 3000 });
		expect(getAllByRole(list, 'listitem')).toHaveLength(5);
		const natureEntry = await findByRole(list, 'listitem', { name: 'Nature' });
		const removeStyle = getByRole(natureEntry, 'button', { name: 'Remove' });
		await user.click(removeStyle);
		expect(getAllByRole(list, 'listitem')).toHaveLength(4);
		expect(localStorage.getItem('zotero-bib-extra-citation-styles')).toEqual('[]');
	});

	test('Does not allow removing default or active style', async () => {
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
		localStorage.setItem(
			'zotero-bib-extra-citation-styles',
			JSON.stringify([{ "name": "nature", "title": "Nature", "isDependent": 0, "isCore": false }])
		);
		localStorage.setItem('zotero-bib-citation-style', 'nature');
		renderWithProviders(<Container />);
		const user = userEvent.setup();
		await screen.findByRole('list', { name: 'Bibliography' }, { timeout: 3000 });
		const styleSelector = screen.getByRole('combobox', { name: "Citation Style" });
		await user.click(styleSelector);
		const options = getAllByRole(getByRole(styleSelector, 'listbox'), 'option');
		const lastOption = options[options.length - 1];
		expect(lastOption).toHaveTextContent(/\s*[\d,'.]+\+ other styles available…/);
		await user.click(lastOption);
		const installer = await screen.findByRole('dialog', { name: 'Add a Citation Style' });
		const list = await findByRole(installer, 'list', { name: 'Citation Styles' }, { timeout: 3000 });
		expect(getAllByRole(list, 'listitem')).toHaveLength(5);
		const natureEntry = await findByRole(list, 'listitem', { name: 'Nature' });
		const removeNatureStyle = getByRole(natureEntry, 'button', { name: 'Active' });
		expect(removeNatureStyle).toBeDisabled();

		const turabianEntry = await findByRole(list, 'listitem', { name: /Turabian/ });
		const removeTurabianStyle = getByRole(turabianEntry, 'button', { name: 'Default' });
		expect(removeTurabianStyle).toBeDisabled();
	});

	test('Items are processed when switching to APA style', async () => {
		localStorage.setItem('zotero-bib-items', JSON.stringify(localStorageItemsForApa));
		server.use(
			http.get('https://www.zotero.org/styles/apa', () => {
				return HttpResponse.text(apaStyle, {
					headers: { 'Content-Type': 'application/vnd.citationstyles.style+xml' },
				});
			}),
		);
		renderWithProviders(<Container />);
		const user = userEvent.setup();
		let bibliography = await screen.findByRole('list', { name: 'Bibliography' }, { timeout: 3000 });
		expect(getAllByRole(bibliography, 'listitem')[0]).toHaveTextContent(/Circadian Mood Variations In Twitter Content/);
		const styleSelector = screen.getByRole('combobox', { name: "Citation Style" });

		// Switch to APA style, but cancel the dialog
		await user.click(styleSelector);
		await userEvent.click(getByRole(getByRole(styleSelector, 'listbox'), 'option', { name: /American Psychological Association/ }));
		let dialog = await screen.findByRole('dialog', { name: 'Converting Titles to Sentence Case' });
		await userEvent.click(getByRole(dialog, 'button', { name: 'Cancel' }));
		await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Converting Titles to Sentence Case' })).not.toBeInTheDocument());
		bibliography = await screen.findByRole('list', { name: 'Bibliography' }, { timeout: 3000 });
		expect(getAllByRole(bibliography, 'listitem')[0]).toHaveTextContent(/Circadian Mood Variations In Twitter Content/);

		// Switch to APA style for real
		await user.click(styleSelector);
		await userEvent.click(getByRole(getByRole(styleSelector, 'listbox'), 'option', { name: /American Psychological Association/ }));
		dialog = await screen.findByRole('dialog', { name: 'Converting Titles to Sentence Case' });
		await userEvent.click(getByRole(dialog, 'button', { name: 'OK, I’ll Edit Them' }));
		await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Converting Titles to Sentence Case' })).not.toBeInTheDocument());
		bibliography = await screen.findByRole('list', { name: 'Bibliography' }, { timeout: 3000 });
		expect(getAllByRole(bibliography, 'listitem')[0]).toHaveTextContent(/Circadian mood variations in twitter content/);
		expect(getAllByRole(bibliography, 'listitem')[1]).toHaveTextContent(new RegExp('Sentence \\(Maybe from twitter\\) that has parenthesis \\(Some of which are nested \\(like this\\)\\) or unmatched \\(parenthesis'));
	});

});
