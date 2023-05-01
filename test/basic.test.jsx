import React from 'react'
import '@testing-library/jest-dom'
import { rest } from 'msw'
import { setupServer } from 'msw/node'
import { screen } from '@testing-library/react'

import { applyAdditionalJestTweaks } from './utils/common';
import Container from '../src/js/components/container';
import { renderWithProviders } from './utils/render';
import modernLanguageAssociationStyle from './fixtures/modern-language-association.xml';
import schema from './fixtures/schema.json';


applyAdditionalJestTweaks();

describe('Basic UI', () => {
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
	});

	afterEach(() => server.resetHandlers());
	afterAll(() => server.close());

	test('Shows all UI elements', async () => {
		server.use(
			rest.get('https://api.zotero.org/schema', (req, res, ctx) => {
				return res(ctx.json(schema));
			}),
			rest.get('https://www.zotero.org/styles/modern-language-association', (req, res, ctx) => {
				return res(
					ctx.set('Content-Type', 'application/vnd.citationstyles.style+xml'),
					ctx.text(modernLanguageAssociationStyle),
				);
			}),
		);

		renderWithProviders(<Container />);
		expect(await screen.findByRole('heading', { name: 'ZoteroBib' })).toBeInTheDocument();
	});
});
