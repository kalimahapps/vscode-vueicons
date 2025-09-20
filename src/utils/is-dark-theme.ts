import { ColorThemeKind, window } from 'vscode';

/**
 * Check if the current theme is dark.
 *
 * @return {Boolean} True if the theme is dark, false otherwise.
 */
const isDarkTheme = function(): boolean {
	return window.activeColorTheme.kind === ColorThemeKind.Dark ||
               window.activeColorTheme.kind === ColorThemeKind.HighContrast;
};

export { isDarkTheme };
