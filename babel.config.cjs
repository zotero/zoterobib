const presets = [
	["@babel/preset-env", {
		"debug": !!process.env.DEBUG || false,
		"useBuiltIns": false,
	}],
	"@babel/preset-react"
];

const plugins = [
	["@babel/plugin-proposal-decorators", { "legacy": true }],
	["@babel/plugin-proposal-class-properties", { "loose" : true }],
	["@babel/plugin-proposal-private-methods", { "loose": true }],
	["@babel/plugin-proposal-private-property-in-object", { "loose": true }],
	["@babel/plugin-transform-runtime", {
		"absoluteRuntime": false,
		"corejs": 3,
		"helpers": true,
		"regenerator": false,
	}]

];

module.exports = { presets, plugins };