import resolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';
import json from '@rollup/plugin-json';
import commonjs from '@rollup/plugin-commonjs';
import wasm from '@rollup/plugin-wasm';
import replace from '@rollup/plugin-replace';
import webWorkerLoader from 'rollup-plugin-web-worker-loader';

const config = {
	input: './src/js/main.js',
	output: {
		dir: './build/static',
		format: 'esm',
		sourcemap: true,
	},
	plugins: [
		resolve({
			preferBuiltins: false,
			mainFields: ['browser', 'module', 'main'],
			extensions: ['.js', '.jsx', '.wasm'] }
		),
		json(),
		wasm(),
		webWorkerLoader(),
		commonjs(),
		replace({
			'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'development'),
		}),
		babel({
			exclude: "node_modules/**",
			extensions: ['.js', '.jsx'],
			babelHelpers: 'bundled'
		}),
	]
};

export default config;
