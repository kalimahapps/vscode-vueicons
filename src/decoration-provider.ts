import type { DecorationOptions, TextEditorDecorationType } from 'vscode';
import { window, Range, Uri, DecorationRangeBehavior } from 'vscode';
import iconService from '@/icon-service';
import { getIconMarkdown, isDarkTheme } from '@/utils';

export class IconDecorationProvider {
	private decorationType: TextEditorDecorationType;

	constructor() {
		this.decorationType = window.createTextEditorDecorationType({
			textDecoration: 'none; opacity: 0.6 !important;',
			rangeBehavior: DecorationRangeBehavior.ClosedClosed,
		});
	}

	private clearDecorations(): void {
		const editor = window.activeTextEditor;
		if (!editor) {
			return;
		}

		// Clear all existing decorations
		editor.setDecorations(this.decorationType, []);
	}

	private generateDecorations(): [string, Range][] {
		const editor = window.activeTextEditor;
		const allowedExtensions = ['.vue', '.js', '.ts'];
		const shouldRenderDecorations = allowedExtensions.some((extension) => {
			 return editor?.document.fileName.endsWith(extension);
		});

		if (!editor || !shouldRenderDecorations) {
			return [];
		}

		const data: [string, Range][] = [];
		const text = editor.document.getText();
		const iconsData = iconService.getIconsData();
		const iconsGroups = iconsData.map((icon) => {
			return icon.group;
		}).join('|');

		const iconRegex = new RegExp(`["'](?<name>(${iconsGroups})+:[\\da-z-]+)["']`, 'gud');

		const regexArray = [...text.matchAll(iconRegex)];

		for (const match of regexArray) {
			const iconName = match.groups!.name;

			const [nameGroupStart, nameGroupEnd] = match.indices!.groups!.name;
			const startPos = editor.document.positionAt(nameGroupStart);
			const endPos = editor.document.positionAt(nameGroupEnd);

			data.push([iconName, new Range(startPos, endPos)]);
		}

		return data;
	};

	async updateDecorations(): Promise<void> {
		// clear decorations
		this.clearDecorations();
		const foundIcons = this.generateDecorations();
		const isDark = isDarkTheme();

		const decorations: DecorationOptions[] = [];
		for (const icon of foundIcons) {
			const [iconName, range] = icon;

			const svgContent = await iconService.loadIcon(iconName, {
				'color': isDark ? '#fff' : '#000',
				'font-size': '16px',
			});

			if (!svgContent) {
				continue;
			}

			// Convert SVG to data URI
			const svgDataUri = `data:image/svg+xml;base64,${Buffer.from(svgContent).toString('base64')}`;

			decorations.push({
				range,
				renderOptions: {
					after: {
						contentIconPath: Uri.parse(svgDataUri),
						margin: '0 0 0 5px',
						width: '24px',
					},
				},
				hoverMessage: await getIconMarkdown(iconName),
			});
		}

		// Apply all decorations at once
		const editor = window.activeTextEditor;
		if (editor) {
			editor.setDecorations(this.decorationType, decorations);
		}
	}

	dispose(): void {
		this.decorationType.dispose();
		this.clearDecorations();
	}
}