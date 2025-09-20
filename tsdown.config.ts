import { defineConfig } from 'tsdown';

export default defineConfig({
	entry: ['src/extension.ts'],
	format: ['cjs'],
	minify: true,
	unbundle: false,
	shims: false,
	dts: false,
	external: ['vscode'],
});
