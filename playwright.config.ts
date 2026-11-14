import { defineConfig, devices } from '@playwright/test';

/** Away from Vite's defaults, so the suites never meet a server someone left running. */
const PORT = 4319;

/**
 * `npm run test:e2e:live` sets this, and runs the one suite that needs Apple
 * Maps against a build that has the token. Every other run builds without
 * one, so the app draws its sketch map and no suite can reach Apple.
 */
const isLive = process.env.E2E_LIVE_MAP === '1';

export default defineConfig({
	testDir: isLive ? 'e2e/live' : 'e2e',
	testMatch: '**/*.e2e.ts',
	testIgnore: isLive ? [] : '**/live/**',
	fullyParallel: true,
	forbidOnly: Boolean(process.env.CI),
	// A test that passes on its second try is a test that fails.
	retries: 0,
	reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
	use: {
		baseURL: `http://localhost:${String(PORT)}`,
		// The suites assert English copy and figures.
		locale: 'en-US',
		trace: 'retain-on-failure'
	},
	projects: [
		{ name: 'desktop', use: { ...devices['Desktop Chrome'] } },
		{ name: 'phone', use: { ...devices['Pixel 7'] } }
	],
	webServer: {
		command: `npm run build && npm run preview -- --port ${String(PORT)} --strictPort`,
		port: PORT,
		reuseExistingServer: false,
		env: isLive ? {} : { MAPKIT_TOKEN: '' }
	}
});
