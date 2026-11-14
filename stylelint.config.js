//
// Lint for styles, in the stylesheets and in the `<style>` of a component.
//
// Beyond the standard rules it holds the design system to its one promise: a
// color is written in `tokens.css` and named everywhere else.
//

/** How a color is written when it is written out, which only `tokens.css` may do. */
const COLOR_FUNCTIONS = [
	'rgb',
	'rgba',
	'hsl',
	'hsla',
	'hwb',
	'lab',
	'lch',
	'oklab',
	'oklch',
	'color'
];

/** @type {import('stylelint').Config} */
export default {
	extends: ['stylelint-config-standard'],
	rules: {
		'color-no-hex': [true, { message: 'Name a token from tokens.css, not a color.' }],
		'color-named': ['never', { message: 'Name a token from tokens.css, not a color.' }],
		'function-disallowed-list': [
			COLOR_FUNCTIONS,
			{ message: 'Name a token from tokens.css, not a color.' }
		],

		// Svelte's own pseudo-class, for a rule that reaches into a child.
		'selector-pseudo-class-no-unknown': [true, { ignorePseudoClasses: ['global'] }],
		// Font names keep the case their makers gave them.
		'value-keyword-case': ['lower', { ignoreProperties: ['--font'] }],
		// Tokens are grouped by what they are for, with a blank line between groups.
		'custom-property-empty-line-before': null
	},
	overrides: [
		{ files: ['**/*.svelte'], customSyntax: 'postcss-html' },
		{
			files: ['src/lib/design/tokens.css'],
			rules: { 'color-no-hex': null, 'function-disallowed-list': null }
		}
	]
};
