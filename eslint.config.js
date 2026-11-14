//
// Lint, and the architecture as lint rules.
//
// AGENTS.md argues for the boundaries below under *Architecture*. This file
// is what holds the code to them: a change that crosses one fails `npm run
// lint`, and so fails CI.
//

import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import svelte from 'eslint-plugin-svelte';
import { defineConfig, includeIgnoreFile } from 'eslint/config';
import globals from 'globals';
import path from 'node:path';
import ts from 'typescript-eslint';

const gitignorePath = path.resolve(import.meta.dirname, '.gitignore');

/**
 * The folders of `src/lib`, each with the folders it may import from. The
 * arrows point one way: `general` and `design` know nothing of the app, and
 * only `app` knows everything.
 *
 * @type {Record<string, string[]>}
 */
const FOLDER_DEPENDENCIES = {
	general: [],
	design: [],
	map: ['general'],
	trails: ['general', 'design', 'map'],
	planner: ['general', 'design', 'map', 'trails'],
	shell: ['general', 'design', 'map'],
	app: ['general', 'design', 'map', 'trails', 'planner', 'shell']
};

/**
 * The imports a kind of module may be denied, each with the reason a
 * developer is shown.
 */
const FORBIDDEN = {
	router: {
		regex: '^(\\$app/|@sveltejs/kit)',
		message: 'Only src/routes knows the router. Hand the screen an href or a callback.'
	},
	adapters: {
		regex: '/adapters/',
		message: 'Only src/lib/app names an adapter. Depend on the port beside it.'
	},
	vendors: {
		regex: '^(idb|@apple/mapkit-loader)',
		message: 'A vendor library is used by one adapter and by nothing else.'
	},
	svelte: {
		regex: '^svelte($|/)',
		message: 'A plain module has no framework in it. State goes in a .svelte.ts model.'
	},
	icons: {
		regex: '^@lucide/',
		message: 'Icons belong to components.'
	},
	models: {
		regex: '\\.svelte\\.ts$',
		message: 'A plain module is used by models, never the other way round.'
	},
	components: {
		regex: '\\.svelte$',
		message: 'Only a component or a route draws a component.'
	},
	climbing: {
		// Two steps up leave any folder, and so does one step up and into a
		// folder by name: `../trails/` from the root of `planner`.
		regex: `^\\.\\./(\\.\\./|(${Object.keys(FOLDER_DEPENDENCIES).join('|')})/)`,
		message: 'Reach another folder through #lib/, so the import says where it goes.'
	}
};

/**
 * The kinds of module in `src/lib`, told apart by file name, each with what
 * it may not import. Later entries win where two match one file.
 *
 * @type {{
 *   files: (folder: string) => string[],
 *   forbidden: (keyof typeof FORBIDDEN)[],
 *   isPure?: boolean
 * }[]}
 */
const LAYERS = [
	{
		// Domain logic and ports: plain TypeScript that runs anywhere.
		files: (folder) => [`src/lib/${folder}/**/*.ts`],
		forbidden: ['router', 'adapters', 'vendors', 'svelte', 'icons', 'models', 'components'],
		isPure: true
	},
	{
		// Models: observable state over the domain.
		files: (folder) => [`src/lib/${folder}/**/*.svelte.ts`],
		forbidden: ['router', 'adapters', 'vendors', 'icons', 'components'],
		isPure: true
	},
	{
		// Components: what is drawn.
		files: (folder) => [`src/lib/${folder}/**/*.svelte`],
		forbidden: ['router', 'adapters', 'vendors']
	},
	{
		// Adapters: the only code that touches a vendor or the browser's stores.
		files: (folder) => [`src/lib/${folder}/**/adapters/**/*.ts`],
		forbidden: ['router', 'models', 'components', 'icons']
	},
	{
		// Suites build their subject from stand-ins, so they may name an adapter.
		files: (folder) => [`src/lib/${folder}/**/*.{test,contract,fixtures}.ts`],
		forbidden: ['router', 'vendors', 'icons', 'components']
	},
	{
		// The composition root: plain wiring that names everything.
		files: (folder) => (folder === 'app' ? ['src/lib/app/**/*.ts'] : []),
		forbidden: ['router', 'icons', 'components']
	}
];

/** What a pure module reaches for instead of being handed. */
const AMBIENT_STATE = [
	'window',
	'document',
	'navigator',
	'location',
	'history',
	'localStorage',
	'sessionStorage',
	'indexedDB',
	'fetch',
	'crypto'
].map((name) => ({
	name,
	message: 'A pure module is handed what it needs. Put browser access behind a port.'
}));

const AMBIENT_FACTS = [
	{ object: 'Date', property: 'now', message: 'Take a `Now` from general/ambient.ts.' },
	{ object: 'Math', property: 'random', message: 'Take a `NewId` from general/ambient.ts.' }
];

/** @type {import('eslint').Linter.Config[]} */
const boundaries = Object.entries(FOLDER_DEPENDENCIES).flatMap(([folder, allowed]) => {
	const offLimits = Object.keys(FOLDER_DEPENDENCIES).filter(
		(other) => other !== folder && !allowed.includes(other)
	);
	const folderRule = {
		regex: `^#lib/(${offLimits.join('|')})/`,
		message: `src/lib/${folder} may import from: ${allowed.join(', ') || 'nothing else in src/lib'}.`
	};
	return LAYERS.filter((layer) => layer.files(folder).length > 0).map((layer) => ({
		files: layer.files(folder),
		rules: {
			'no-restricted-imports': [
				'error',
				{
					patterns: [
						...(offLimits.length > 0 ? [folderRule] : []),
						FORBIDDEN.climbing,
						...layer.forbidden.map((name) => FORBIDDEN[name])
					]
				}
			],
			'no-restricted-globals': layer.isPure ? ['error', ...AMBIENT_STATE] : 'off',
			'no-restricted-properties': layer.isPure ? ['error', ...AMBIENT_FACTS] : 'off'
		}
	}));
});

export default defineConfig(
	includeIgnoreFile(gitignorePath),
	js.configs.recommended,
	ts.configs.strictTypeChecked,
	ts.configs.stylisticTypeChecked,
	svelte.configs.recommended,
	prettier,
	svelte.configs.prettier,
	{
		languageOptions: {
			globals: { ...globals.browser, ...globals.node },
			parserOptions: { projectService: true, extraFileExtensions: ['.svelte'] }
		},
		rules: {
			// typescript-eslint strongly recommend that you do not use the no-undef lint rule on TypeScript projects.
			// see: https://typescript-eslint.io/troubleshooting/faqs/eslint/#i-get-errors-from-the-no-undef-rule-about-global-variables-not-being-defined-even-though-there-are-no-typescript-errors
			'no-undef': 'off',
			eqeqeq: 'error',
			'no-console': 'error',
			// `onclick={() => draft.clear()}` is how a handler is written.
			'@typescript-eslint/no-confusing-void-expression': ['error', { ignoreArrowShorthand: true }],

			// The size limits the iOS app's SwiftLint holds it to. A module
			// that meets one is doing two jobs: split it by job, as the
			// folders are split.
			complexity: ['error', 12],
			'max-depth': ['error', 4],
			'max-params': ['error', 5],
			'max-lines': ['error', { max: 500, skipBlankLines: true, skipComments: true }],
			'max-lines-per-function': ['error', { max: 60, skipBlankLines: true, skipComments: true }],

			// One spelling in names, the iOS app's: a search for `color` finds every color.
			'no-restricted-syntax': [
				'error',
				{
					selector: 'Identifier[name=/[Cc]olour|[Cc]entre|[Ll]icence|[Mm]etre|[Gg]rey/]',
					message: 'American spelling in names: color, center, license, meter, gray.'
				}
			]
		}
	},
	{
		// A suite is one long `describe`, and that is not a function to split.
		files: ['**/*.{test,contract}.ts', 'e2e/**'],
		rules: { 'max-lines-per-function': 'off' }
	},
	{
		// The configuration files are plain JavaScript, outside the typed program.
		files: ['**/*.js'],
		extends: [ts.configs.disableTypeChecked]
	},
	{
		files: ['**/*.svelte', '**/*.svelte.ts'],
		languageOptions: { parserOptions: { parser: ts.parser } }
	},
	{
		// The linter cannot see the type a callback in a template is handed, and
		// calls it `any`. `npm run check` type-checks templates and can.
		files: ['**/*.svelte'],
		rules: {
			'@typescript-eslint/no-unsafe-argument': 'off',
			'@typescript-eslint/no-unsafe-assignment': 'off',
			'@typescript-eslint/no-unsafe-call': 'off',
			'@typescript-eslint/no-unsafe-member-access': 'off',
			'@typescript-eslint/no-unsafe-return': 'off'
		}
	},
	{
		// A screen is handed its links already resolved, by the route that owns them.
		files: ['src/lib/**/*.svelte'],
		rules: { 'svelte/no-navigation-without-resolve': 'off' }
	},
	{
		// A route is wiring: it is handed the app that `src/lib/app` built,
		// and picks no adapter of its own.
		files: ['src/routes/**'],
		rules: {
			'no-restricted-imports': ['error', { patterns: [FORBIDDEN.adapters, FORBIDDEN.vendors] }]
		}
	},
	...boundaries
);
