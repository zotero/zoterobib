import React from 'react'
import '@testing-library/jest-dom'
import copy from 'copy-to-clipboard';
import { rest } from 'msw'
import { setupServer } from 'msw/node'
import { findByRole, getAllByRole, getByRole, screen, waitFor, queryByRole } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { applyAdditionalJestTweaks } from './utils/common';
import Container from '../src/js/components/container';
import { renderWithProviders } from './utils/render';
import modernLanguageAssociationStyle from './fixtures/modern-language-association.xml';
import schema from './fixtures/schema.json';
import localStorage100Items from './fixtures/local-storage-100-items.json';
import localeForCiteproc from './fixtures/locales-en-us.xml';
import localesGBForCiteproc from './fixtures/locales-en-gb.xml';
import natureStyle from './fixtures/nature.xml';

import CSL from 'citeproc';
window.CSL = CSL;

jest.mock('copy-to-clipboard');

applyAdditionalJestTweaks();

describe('Citations', () => {
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
		copy.mockReturnValue(true);
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
		server.use(
			rest.get('https://www.zotero.org/styles/nature', (req, res, ctx) => {
				return res(
					ctx.set('Content-Type', 'application/vnd.citationstyles.style+xml'),
					ctx.text(natureStyle),
				);
			}),
		);
		localStorage.setItem(
			'zotero-bib-items',
			JSON.stringify(localStorage100Items.slice(0, 5)) // improve performance by using a small slice
		);
		localStorage.setItem('zotero-bib-title', 'hello world');
		localStorage.setItem('zotero-style-locales-en-US', localeForCiteproc);
		localStorage.setItem('zotero-style-locales-en-GB', localesGBForCiteproc);
	});

	afterEach(() => {
		server.resetHandlers();
		localStorage.clear();
	});
	afterAll(() => server.close());

	test('Supports copying citation with options', async () => {
		renderWithProviders(<Container />);
		const user = userEvent.setup();
		const firstCitation = getAllByRole(
			await screen.findByRole('list', { name: 'Bibliography' }, { timeout: 3000 }),
			'listitem', { name: 'Citation' }
		)[0];

		user.click(getByRole(firstCitation, 'button', { name: 'Copy Citation' }));
		const dialog = await screen.findByRole('dialog', { name: 'Copy Citation' });
		expect(await findByRole(dialog, 'figure', { name: 'Preview' })).toHaveTextContent('(Bose and Sarma)');

		const locator = await findByRole(dialog, 'textbox', { name: 'Locator' });
		await user.type(locator, '42');

		await waitFor(
			async () => expect(
				await findByRole(dialog, 'figure', { name: 'Preview' })
			).toHaveTextContent('(Bose and Sarma 42)')
		);

		const locatorSelector = await findByRole(dialog, 'combobox', { name: 'Locator Label' });
		await user.click(locatorSelector);
		await user.selectOptions(getByRole(locatorSelector, 'listbox'), 'Chapter');

		await waitFor(
			async () => expect(
				await findByRole(dialog, 'figure', { name: 'Preview' })
			).toHaveTextContent('(Bose and Sarma, chap.42)')
		);

		await user.click(getByRole(dialog, 'checkbox', { name: 'Omit Author' }));
		await waitFor(
			async () => expect(
				await findByRole(dialog, 'figure', { name: 'Preview' })
			).toHaveTextContent('(chap.42)')
		);

		const clipboardText = await navigator.clipboard.readText();
		expect(clipboardText).not.toBe('(chap.42)');
		user.click(getByRole(dialog, 'button', { name: 'Copy Citation' }));
		expect(await findByRole(dialog, 'button', { name: 'Copied!' })).toBeInTheDocument();
		expect(queryByRole(dialog, 'button', { name: 'Copy Citation' })).not.toBeInTheDocument();
		await waitFor(
			() => expect(screen.queryByRole('dialog', { name: 'Copy Citation' })).not.toBeInTheDocument()
		);
		expect(copy).toHaveBeenCalledWith('(chap.42)');
	});

	test('Supports copying a single bibliography entry', async () => {
		renderWithProviders(<Container />);
		const user = userEvent.setup();
		const firstCitation = getAllByRole(
			await screen.findByRole('list', { name: 'Bibliography' }, { timeout: 3000 }),
			'listitem', { name: 'Citation' }
		)[0];

		await user.click(getByRole(firstCitation, 'button', { name: 'Copy Bibliography Entry' }));
		expect(copy.mock.calls[0][0]).toMatch(/Bose, K\. S\., and R\. H\. Sarma. “Delineation of the Intimate Details of the Backbone Conformation of Pyridine Nucleotide Coenzymes in Aqueous Solution\.”/);

	});

	test('Supports removing a citation with undo option', async () => {
		renderWithProviders(<Container />);
		const user = userEvent.setup();
		const citations = getAllByRole(
			await screen.findByRole('list', { name: 'Bibliography' }, { timeout: 3000 }),
			'listitem', { name: 'Citation' }
		);
		expect(citations).toHaveLength(5);

		await user.click(getByRole(citations[0], 'button', { name: 'Delete Entry' }));
		expect(getAllByRole(
			await screen.findByRole('list', { name: 'Bibliography' }, { timeout: 3000 }),
			'listitem', { name: 'Citation' }
		)).toHaveLength(4);

		const status = await screen.findByRole('status', { name: "Item Deleted" });
		expect(status).toHaveAttribute('aria-live', 'polite');
		expect(status).toHaveTextContent('Item Deleted');
		await user.click(getByRole(status, 'button', { name: 'Undo' }));

		expect(getAllByRole(
			await screen.findByRole('list', { name: 'Bibliography' }, { timeout: 3000 }),
			'listitem', { name: 'Citation' }
		)).toHaveLength(5);
	});

	test('For numeric citation style, does not display button to copy citation/bibliography entry', async () => {
		localStorage.setItem('zotero-bib-citation-style', 'nature');
		renderWithProviders(<Container />);

		const firstCitation = getAllByRole(
			await screen.findByRole('list', { name: 'Bibliography' }, { timeout: 3000 }),
			'listitem', { name: 'Citation' }
		)[0];
		expect(queryByRole(firstCitation, 'button', { name: 'Copy Citation' })).not.toBeInTheDocument();
		expect(queryByRole(firstCitation, 'button', { name: 'Copy Bibliography Entry' })).not.toBeInTheDocument();
	});

	test('For numeric citation style, supports reordering', async () => {
		localStorage.setItem('zotero-bib-citation-style', 'nature');
		renderWithProviders(<Container />);
		const user = userEvent.setup();
		const firstCitation = getAllByRole(
			await screen.findByRole('list', { name: 'Bibliography' }, { timeout: 3000 }),
			'listitem', { name: 'Citation' }
		)[0];
		expect(firstCitation).toHaveTextContent(/1\.Makar,/);
		await user.click(getByRole(firstCitation, 'button', { name: 'Options' }));
		const optionsMenu = screen.getByRole('menu', { name: 'Options' });
		await user.click(getByRole(optionsMenu, 'menuitem', { name: 'Move Down' }));

		const updatedFirstCitation = getAllByRole(
			await screen.findByRole('list', { name: 'Bibliography' }, { timeout: 3000 }),
			'listitem', { name: 'Citation' }
		)[0];
		expect(updatedFirstCitation).toHaveTextContent(/1\.Bose,/);
	});

	test('For keyboard users, all actions are accessible via dropdown menu', async () => {
		copy.mockReturnValue(true);
		renderWithProviders(<Container />);
		const user = userEvent.setup();
		const firstCitation = getAllByRole(
			await screen.findByRole('list', { name: 'Bibliography' }, { timeout: 3000 }),
			'listitem', { name: 'Citation' }
		)[0];

		// copy citation
		getByRole(firstCitation, 'button', { name: 'Options' }).focus();
		await user.keyboard('{enter}');
		expect(await screen.findByRole('menu', { name: 'Options' })).toBeInTheDocument();
		expect(screen.getByRole('menuitem', { name: 'Copy Citation' })).toHaveFocus();
		await user.keyboard('{enter}');
		const copyCitationDialog = await screen.findByRole('dialog', { name: 'Copy Citation' });
		await waitFor(
			() => expect(screen.queryByRole('menu', { name: 'Options' })).not.toBeInTheDocument()
		);

		await waitFor(
			async () => expect(
				await findByRole(copyCitationDialog, 'figure', { name: 'Preview' })
			).toHaveTextContent('(Bose and Sarma)')
		);

		await waitFor(
			() => expect(
				getByRole(copyCitationDialog, 'textbox', { name: 'Locator' })
			).toHaveFocus()
		);

		await user.keyboard('{escape}');
		await waitFor(
			() => expect(screen.queryByRole('dialog', { name: 'Copy Citation' })).not.toBeInTheDocument()
		);

		// copy bibliography entry
		getByRole(firstCitation, 'button', { name: 'Options' }).focus();
		await user.keyboard('{enter}{arrowdown}');
		expect(screen.getByRole('menuitem', { name: 'Copy Bibliography Entry' })).toHaveFocus();
		await user.keyboard('{enter}');
		expect(copy.mock.calls[0][0]).toMatch(/Bose, K\. S\., and R\. H\. Sarma. “Delineation of the Intimate Details of the Backbone Conformation of Pyridine Nucleotide Coenzymes in Aqueous Solution\.”/);
		expect(await screen.findByRole('menuitem', { name: 'Copied!' })).toBeInTheDocument();
		expect(screen.queryByRole('menuitem', { name: 'Copy Bibliography Entry' })).not.toBeInTheDocument();
		await waitFor(
			() => expect(screen.queryByRole('menu', { name: 'Options' })).not.toBeInTheDocument(),
			{ timeout: 2000 } // extra timeout because we keep the dropdown open for 950ms to show the "Copied" message
		);

		// edit
		getByRole(firstCitation, 'button', { name: 'Options' }).focus();
		await user.keyboard('{enter}{arrowdown}{arrowdown}');
		expect(screen.getByRole('menuitem', { name: 'Edit' })).toHaveFocus();
		await user.keyboard('{enter}');
		const editorDialog = await screen.findByRole('dialog', { name: 'Item Editor' });
		await waitFor(
			() => expect(screen.queryByRole('menu', { name: 'Options' })).not.toBeInTheDocument()
		);
		await waitFor(
			() => {
				expect(
					getByRole(editorDialog, 'combobox', { name: 'Item Type' })
				).toHaveFocus()
			}
		);
		await user.keyboard('{escape}');
		await waitFor(
			() => expect(screen.queryByRole('dialog', { name: 'Item Editor' })).not.toBeInTheDocument()
		);

		// delete
		getByRole(firstCitation, 'button', { name: 'Options' }).focus();
		await user.keyboard('{enter}{arrowdown}{arrowdown}{arrowdown}');
		expect(screen.getByRole('menuitem', { name: 'Delete' })).toHaveFocus();
		await user.keyboard('{enter}');
		expect(getAllByRole(
			await screen.findByRole('list', { name: 'Bibliography' }, { timeout: 3000 }),
			'listitem', { name: 'Citation' }
		)).toHaveLength(4);
		await waitFor(
			() => expect(screen.queryByRole('menu', { name: 'Options' })).not.toBeInTheDocument()
		);
	});

});
