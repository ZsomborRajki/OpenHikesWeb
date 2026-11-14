import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			// A single-page app: every route is drawn in the browser, so one
			// page serves them all and the host sends unknown paths to it.
			adapter: adapter({ fallback: 'index.html' })
		})
	],
	// Svelte's server build never runs an effect. A suite that tests effects
	// asks for `@vitest-environment jsdom`, which compiles for a browser, and
	// this has it resolve the build a browser gets.
	resolve: process.env.VITEST ? { conditions: ['browser'] } : {},
	test: {
		expect: { requireAssertions: true },
		environment: 'node',
		include: ['src/**/*.test.ts'],
		coverage: {
			provider: 'v8',
			include: ['src/lib/**/*.ts'],
			exclude: [
				'src/lib/**/*.test.ts',
				'src/lib/**/*.contract.ts',
				'src/lib/**/*.fixtures.ts',
				// Ports and plain types: nothing in them runs.
				'src/lib/general/ambient.ts',
				'src/lib/general/file-saver.ts',
				'src/lib/map/map-surface.ts',
				'src/lib/planner/draft-store.ts',
				'src/lib/planner/leg-router.ts',
				'src/lib/trails/trail-repository.ts',
				// Wiring and the adapters that need a real browser. The
				// browser tests run these; a stale path here hides nothing,
				// because a file left off the list is measured.
				'src/lib/app/**',
				'src/lib/general/adapters/browser-file-saver.ts',
				'src/lib/map/adapters/mapkit-map-surface.ts',
				'src/lib/map/adapters/sketch-map-surface.ts'
			],
			// The floor. Raise it as coverage rises; never lower it to land a change.
			thresholds: { lines: 98, functions: 98, branches: 94, statements: 98 }
		}
	}
});
