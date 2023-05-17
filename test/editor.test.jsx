import React from 'react'
import '@testing-library/jest-dom'
import { rest } from 'msw'
import { setupServer } from 'msw/node'
import { getAllByRole, getByRole, screen, waitFor, queryByRole } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { applyAdditionalJestTweaks } from './utils/common';
import Container from '../src/js/components/container';
import { renderWithProviders } from './utils/render';
import modernLanguageAssociationStyle from './fixtures/modern-language-association.xml';
import schema from './fixtures/schema.json';
import localStorage100Items from './fixtures/local-storage-100-items.json';
import localeForCiteproc from './fixtures/locales-en-us.xml';

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

	afterEach(() => server.resetHandlers());
	afterAll(() => server.close());

	test('Supports adding item of selected type manually', async () => {
		renderWithProviders(<Container />);
		const user = userEvent.setup();
		expect(
			getAllByRole(
				await screen.findByRole('list', { name: 'Bibliography' }, { timeout: 3000 }),
				'listitem', { name: 'Citation' }
			)
		).toHaveLength(5);

		const manualEntryButton = screen.getByRole(
			'button', { name: 'Manual Entry' }
		);
		user.click(manualEntryButton);
		const dialog = await screen.findByRole('dialog', { name: 'Item Editor' });
		const titleField = getByRole(dialog, 'textbox', { name: 'Title' });
		user.type(titleField, 'hello world');
		const inputTypeCombo = screen.getByRole('combobox', { name: 'Item Type' });
		expect(inputTypeCombo).toHaveTextContent('Book');
		expect(getByRole(dialog, 'textbox', { name: 'ISBN' })).toBeInTheDocument();
		expect(queryByRole(dialog, 'textbox', { name: 'DOI' })).not.toBeInTheDocument();
		await user.click(inputTypeCombo);
		await user.selectOptions(getByRole(inputTypeCombo, 'listbox'), 'Journal Article');
		await waitFor(() => expect(inputTypeCombo).toHaveTextContent('Journal Article'));
		expect(queryByRole(dialog, 'textbox', { name: 'ISBN' })).not.toBeInTheDocument();
		expect(getByRole(dialog, 'textbox', { name: 'DOI' })).toBeInTheDocument();
		const doneButton = screen.getByRole('button', { name: 'Done' });
		user.click(doneButton);

		expect(
			getAllByRole(
				await screen.findByRole('list', { name: 'Bibliography' }),
				'listitem', { name: 'Citation' }
			)
		).toHaveLength(6);
	});

	test('It should use base-type-mappings when changing item types', async () => {
		renderWithProviders(<Container />);
		const user = userEvent.setup();
		const manualEntryButton = screen.getByRole(
			'button', { name: 'Manual Entry' }
		);
		user.click(manualEntryButton);
		const dialog = await screen.findByRole('dialog', { name: 'Item Editor' });
		const inputTypeCombo = screen.getByRole('combobox', { name: 'Item Type' });
		await user.click(inputTypeCombo);
		await user.selectOptions(getByRole(inputTypeCombo, 'listbox'), 'Journal Article');
		const publicationField = getByRole(dialog, 'textbox', { name: 'Publication' });
		user.type(publicationField, 'Lorem Ipsum{enter}');
		const listItem = getByRole(dialog, 'listitem', { name: 'Publication' });
		await waitFor(() => expect(getByRole(listItem, 'progressbar')).toBeInTheDocument());
		await waitFor(() => expect(queryByRole(listItem, 'progressbar')).not.toBeInTheDocument(), { timeout: 3000 });

		await user.click(inputTypeCombo);
		await user.selectOptions(getByRole(inputTypeCombo, 'listbox'), 'Radio Broadcast');
		await waitFor(() => expect(inputTypeCombo).toHaveTextContent('Radio Broadcast'));

		await waitFor(() => expect(queryByRole(dialog, 'textbox', { name: 'Publication' })).not.toBeInTheDocument(), { timeout: 3000 });
		expect(getByRole(dialog, 'textbox', { name: 'Program Title' })).toHaveValue('Lorem Ipsum');
	});

	test('It supports editing exisiting items', async () => {
		renderWithProviders(<Container />);
		const user = userEvent.setup();
		const bibliography = await screen.findByRole('list', { name: 'Bibliography' }, { timeout: 3000 });
		const firstCitation = getAllByRole(bibliography, 'listitem')[0];
		user.click(firstCitation);
		const dialog = await screen.findByRole('dialog', { name: 'Item Editor' });
		const titleField = getByRole(dialog, 'textbox', { name: 'Title' });
		expect(titleField).toHaveValue('Delineation of the intimate details of the backbone conformation of pyridine nucleotide coenzymes in aqueous solution');
		await user.type(titleField, '{backspace}hello world{enter}', { initialSelectionStart: 0, initialSelectionEnd: titleField.value.length });
		const listItem = getByRole(dialog, 'listitem', { name: 'Title' });
		await waitFor(() => expect(getByRole(listItem, 'progressbar')).toBeInTheDocument());
		await waitFor(() => expect(queryByRole(listItem, 'progressbar')).not.toBeInTheDocument(), { timeout: 3000 });
		expect(titleField).toHaveValue('hello world');
		user.click(screen.getByRole('button', { name: 'Done' }));
		expect(firstCitation).toHaveTextContent(/Hello World/);
	});

	test('It adds a new creator', async () => {
		renderWithProviders(<Container />);
		const user = userEvent.setup();
		const manualEntryButton = screen.getByRole(
			'button', { name: 'Manual Entry' }
		);
		await user.click(manualEntryButton);
		const dialog = await screen.findByRole('dialog', { name: 'Item Editor' });
		const author = getByRole(dialog, 'listitem', { name: 'Author' });

		const creatorType = getByRole(author, 'combobox', { name: 'Creator Type' });
		await user.click(creatorType);
		user.selectOptions(getByRole(creatorType, 'listbox'), 'Editor');

		const firstNameInput = getByRole(author, 'textbox', { name: 'First Name' });
		await user.type(firstNameInput, 'John');
		const lastNameInput = getByRole(author, 'textbox', { name: 'Last Name' });
		await user.type(lastNameInput, 'Doe');

		const addCreatorButton = getByRole(author, 'button', { name: 'Add Creator' });
		await user.click(addCreatorButton);

		const authors = getAllByRole(dialog, 'listitem', { name: 'Editor' });
		expect(authors).toHaveLength(2);
		const newAuthor = authors[1];

		const newAuthorFirstNameInput = getByRole(newAuthor, 'textbox', { name: 'First Name' });
		await user.type(newAuthorFirstNameInput, 'Jane');
		const newAuthorLastNameInput = getByRole(newAuthor, 'textbox', { name: 'Last Name' });
		await user.type(newAuthorLastNameInput, 'Smith');
		const switchCreatorTypeButton = getByRole(newAuthor, 'button', { name: 'Switch Creator Type' });
		await user.click(switchCreatorTypeButton);
		const newAuthorName = getByRole(newAuthor, 'textbox', { name: 'Name' });
		expect(newAuthorName).toHaveValue('Jane Smith');

		const doneButton = screen.getByRole('button', { name: 'Done' });
		await user.click(doneButton);

		const bibliography = await screen.findByRole('list', { name: 'Bibliography' }, { timeout: 3000 });
		expect(bibliography).toHaveTextContent(/Doe, John/);
		expect(bibliography).toHaveTextContent(/Jane Smith/);
	});

});
