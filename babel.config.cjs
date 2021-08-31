const presets = [
	["@babel/preset-env", {
		"debug": !!process.env.DEBUG || false,
		"useBuiltIns": false,
	}],
	"@babel/preset-react"
];

const plugins = [
	["@babel/plugin-transform-runtime", {
		"absoluteRuntime": false,
		"corejs": 3,
		"helpers": true,
		"regenerator": false,
	}],
	["formatjs", { removeDefaultMessage: !!process.env.NODE_ENV?.startsWith('prod') }]
];



module.exports = { presets, plugins };