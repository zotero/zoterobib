import React from 'react'
import '@testing-library/jest-dom'
import { rest } from 'msw'
import { setupServer } from 'msw/node'
import { findByRole, getAllByRole, getByRole, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { applyAdditionalJestTweaks } from './utils/common';
import Container from '../src/js/components/container';
import { renderWithProviders } from './utils/render';
import modernLanguageAssociationStyle from './fixtures/modern-language-association.xml';
import turabianFullnoteStyle from './fixtures/turabian-fullnote-bibliography.xml';
import natureStyle from './fixtures/nature.xml';
import schema from './fixtures/schema.json';
import localStorage100Items from './fixtures/local-storage-100-items.json';
import localeForCiteproc from './fixtures/locales-en-us.xml';
import localesGBForCiteproc from './fixtures/locales-en-gb.xml';
import stylesJson from './fixtures/styles.json';

import CSL from 'citeproc';
window.CSL = CSL;

applyAdditionalJestTweaks();

describe('Editor', () => {
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

	test('Supports changing style', async () => {
		server.use(
			rest.get('https://www.zotero.org/styles/turabian-fullnote-bibliography', (req, res, ctx) => {
				return res(
					ctx.set('Content-Type', 'application/vnd.citationstyles.style+xml'),
					ctx.text(turabianFullnoteStyle),
				);
			}),
		);

		renderWithProviders(<Container />);
		const user = userEvent.setup();
		let bibliography = await screen.findByRole('list', { name: 'Bibliography' }, { timeout: 3000 });
		expect(getAllByRole(bibliography, 'listitem')[0]).toHaveTextContent(/https:\/\/doi\.org\/10\.1016\/0006-291x\(75\)90482-9/);
		const styleSelector = screen.getByRole('combobox', { name: "Citation Style" });
		expect(styleSelector).toHaveTextContent(/Modern Language Association/);
		await user.click(styleSelector);
		const option = getByRole(getByRole(styleSelector, 'listbox'), 'option', { name: /Turabian/ });
		await userEvent.click(option);
		expect(screen.getByRole('combobox', { name: "Citation Style", expanded: false })).toHaveTextContent(/Turabian/);
		bibliography = await screen.findByRole('list', { name: 'Bibliography' }, { timeout: 3000 });
		expect(getAllByRole(bibliography, 'listitem')[0]).not.toHaveTextContent(/https:\/\/doi\.org\/10\.1016\/0006-291x\(75\)90482-9/);
	});

	test('Supports installing new style', async () => {
		server.use(
			rest.get('https://www.zotero.org/styles-files/styles.json', (req, res, ctx) => {
				return res(
					ctx.set('Content-Type', 'application/json'),
					ctx.json(stylesJson)
				);
			}),
		);
		server.use(
			rest.get('https://www.zotero.org/styles/nature', (req, res, ctx) => {
				return res(
					ctx.set('Content-Type', 'application/vnd.citationstyles.style+xml'),
					ctx.text(natureStyle),
				);
			}),
		);
		server.use(
			rest.get('http://localhost/static/locales/locales-en-GB.xml', (req, res, ctx) => {
				return res(
					ctx.set('Content-Type', 'application/xml'),
					ctx.text(localesGBForCiteproc),
				);
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
		const installer = await screen.findByRole('dialog', { name: 'Citation Style Picker' });
		const list = await findByRole(installer, 'list', { name: 'Citation Styles' }, { timeout: 3000 });
		expect(getAllByRole(list, 'listitem')).toHaveLength(4);
		const search = getByRole(installer, 'searchbox', { name: 'Search Citation Styles' });
		await user.type(search, 'nature');
		const natureEntry = await findByRole(list, 'listitem', { name: 'Nature' });
		const addStyle = getByRole(natureEntry, 'button', { name: 'Add' });
		await user.click(addStyle);
		await waitFor(
			() => expect(screen.queryByRole('dialog', { name: 'Citation Style Picker' })).not.toBeInTheDocument()
		);
		const bibliography = await screen.findByRole('list', { name: 'Bibliography' }, { timeout: 3000 });
		expect(getAllByRole(bibliography, 'listitem')[0]).toHaveTextContent(/1\.Makar,/);
	});

	test('Supports removing style, if not in use', async () => {
		server.use(
			rest.get('https://www.zotero.org/styles-files/styles.json', (req, res, ctx) => {
				return res(
					ctx.set('Content-Type', 'application/json'),
					ctx.json(stylesJson)
				);
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
		const installer = await screen.findByRole('dialog', { name: 'Citation Style Picker' });
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
			rest.get('https://www.zotero.org/styles-files/styles.json', (req, res, ctx) => {
				return res(
					ctx.set('Content-Type', 'application/json'),
					ctx.json(stylesJson)
				);
			}),
		);
		server.use(
			rest.get('https://www.zotero.org/styles/nature', (req, res, ctx) => {
				return res(
					ctx.set('Content-Type', 'application/vnd.citationstyles.style+xml'),
					ctx.text(natureStyle),
				);
			}),
		);
		server.use(
			rest.get('http://localhost/static/locales/locales-en-GB.xml', (req, res, ctx) => {
				return res(
					ctx.set('Content-Type', 'application/xml'),
					ctx.text(localesGBForCiteproc),
				);
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
		const installer = await screen.findByRole('dialog', { name: 'Citation Style Picker' });
		const list = await findByRole(installer, 'list', { name: 'Citation Styles' }, { timeout: 3000 });
		expect(getAllByRole(list, 'listitem')).toHaveLength(5);
		const natureEntry = await findByRole(list, 'listitem', { name: 'Nature' });
		const removeNatureStyle = getByRole(natureEntry, 'button', { name: 'Active' });
		expect(removeNatureStyle).toBeDisabled();

		const turabianEntry = await findByRole(list, 'listitem', { name: /Turabian/ });
		const removeTurabianStyle = getByRole(turabianEntry, 'button', { name: 'Default' });
		expect(removeTurabianStyle).toBeDisabled();
	});

});
