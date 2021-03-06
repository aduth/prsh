module.exports = {
	extends: '@aduth/eslint-config/es5',
	parserOptions: {
		ecmaVersion: 2015,
		sourceType: 'module',
	},
	env: {
		browser: true,
	},
	overrides: [
		{
			files: ['test/*'],
			extends: ['@aduth/eslint-config'],
			env: {
				node: true,
				mocha: true,
			},
		},
	],
};
