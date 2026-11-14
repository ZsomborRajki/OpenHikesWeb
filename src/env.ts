import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	MAPKIT_TOKEN: {
		public: true,
		// Read when the site is built: a static site has no server to ask later.
		static: true,
		description: 'A MapKit JS token. Without one the app draws its sketch map.',
		schema: (value) => (value === undefined || value === '' ? undefined : value)
	}
});
