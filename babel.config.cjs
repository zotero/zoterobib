const presets = [
	["@babel/preset-env", {
		"debug": !!process.env.DEBUG || false,
		"corejs": { version: 3 },
		"useBuiltIns": "usage",
	}],
	"@babel/preset-react"
];

const plugins = [
	["formatjs", { removeDefaultMessage: !!process.env.NODE_ENV?.startsWith('prod') }]
];


module.exports = { presets, plugins };