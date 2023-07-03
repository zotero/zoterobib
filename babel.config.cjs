const presets = [
	["@babel/preset-env", {
		"debug": !!process.env.DEBUG || false,
		"corejs": { version: 3 },
		"useBuiltIns": "usage",
	}],
	['@babel/preset-react', {
		'runtime': 'automatic',
		'development': process.env.NODE_ENV === 'development',
		'importSource': process.env.NODE_ENV === 'development' ? '@welldone-software/why-did-you-render' : undefined,
	}],
];

const plugins = [
	["formatjs", { removeDefaultMessage: !!process.env.NODE_ENV?.startsWith('prod') }]
];


module.exports = { presets, plugins };