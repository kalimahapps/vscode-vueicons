import { defineExtension, extensionContext } from 'reactive-vscode';
import { languages, window, workspace } from 'vscode';
import { logger } from '@/utils';
import { IconsCompletionProvider } from '@/icons-completion-provider';
import iconService from '@/icon-service';
import { IconDecorationProvider } from '@/decoration-provider';
export default defineExtension(async() => {
	logger.info('VueIcons Extension Activated');

	// Initialize completion provider
	const iconsCompletionProvider = new IconsCompletionProvider();

	// Initialize decoration provider
	const iconDecorationProvider = new IconDecorationProvider();

	// Register completion provider for Vue files only if enabled
	const completionDisposable: any = null;

	// Preload icons on activation
	await iconService.loadPackageInfo();
	await iconService.loadIconsList();
	await iconService.loadIconsGroups();

	// Initial registration
	if (extensionContext.value) {
	 extensionContext.value.subscriptions.push(
			languages.registerCompletionItemProvider(
				[
					{
						language: 'vue',
						scheme: 'file',
					},
					{
						language: 'typescript',
						scheme: 'file',
					},
					{
						language: 'javascript',
						scheme: 'file',
					},
				],
				iconsCompletionProvider,
				'"',
				"'"
			),
			window.onDidChangeActiveTextEditor(async () => {
				iconDecorationProvider.updateDecorations();
				await iconService.reloadPackageData();
			}),
			workspace.onDidChangeTextDocument((event) => {
				if (event.document === window.activeTextEditor?.document) {
					iconDecorationProvider.updateDecorations();
				}
			})
		);

		// Initial decoration update
		iconDecorationProvider.updateDecorations();
	}

	// Return cleanup function
	return () => {
		completionDisposable?.dispose();
		logger.info('Cleared');
	};
});
