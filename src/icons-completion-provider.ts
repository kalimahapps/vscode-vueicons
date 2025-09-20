import type { CompletionItemProvider, TextDocument, CompletionItem } from 'vscode';
import { Position, Range } from 'vscode';
import iconService from '@/icon-service';
import { findQuoteBackwards, getIconMarkdown } from '@/utils';

export class IconsCompletionProvider implements CompletionItemProvider {
	provideCompletionItems(document: TextDocument, position: Position): CompletionItem[] {
		const lineRange = new Range(
			new Position(position.line, 0),
			new Position(position.line, position.character)
		);
		const lineText = document.getText(lineRange);

		const quoteIndex = findQuoteBackwards(lineText, position.character);
		if (quoteIndex === -1){
			return [];
		}

		const range = new Range(position.line, quoteIndex + 1, position.line, position.character);

		return iconService.loadCompletionItems(range);
	}

	async resolveCompletionItem(item: CompletionItem): Promise<CompletionItem> {
		item.documentation = await getIconMarkdown(item.label.toString());

		return item;
	}
}
