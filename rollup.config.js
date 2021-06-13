export default /** @type {import('rollup').RollupOptions} */ ({
	input: 'prsh.js',
	external: ['preact', 'preact/hooks'],
	output: [
		{
			format: 'cjs',
			file: 'dist/prsh.cjs.js',
		},
		{
			format: 'iife',
			file: 'dist/prsh.js',
			name: 'prsh',
			globals: {
				preact: 'preact',
				'preact/hooks': 'preactHooks',
			},
		},
	],
});
