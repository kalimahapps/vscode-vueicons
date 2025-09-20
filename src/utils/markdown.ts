import iconService from '@/icon-service';
import { MarkdownString } from 'vscode';
import { logger, isDarkTheme } from '@/utils';

/**
 * Build the markdown representation for an icon.
 *
 * @param  {string}                iconName The name of the icon.
 * @return {MarkdownString|string}          A MarkdownString representing the icon,
 *                                          or an empty string if not found.
 */
const getIconMarkdown = async function(iconName: string): Promise<MarkdownString|string> {
	const icon = await iconService.loadIcon(iconName, {
		'color': isDarkTheme() ? '#fff' : '#000',
		'font-size': '48px',
	});

	if (!icon) {
		logger.info(`Icon ${iconName} not found.`);
		return '';
	}
	const [group] = iconName.split(':');
	const iconsData = iconService.getIconsData();
	const findIconGroup = iconsData.find((icon) => {
		return icon.group === group;
	});

	if (!findIconGroup) {
		logger.info(`Icon group ${group} not found.`);
		return '';
	}

	const base64String = Buffer.from(icon).toString('base64');
	const iconUrl = `data:image/svg+xml;base64,${base64String}`;

	// Build markdown string
	const markdown = new MarkdownString();
	markdown.supportHtml = true;
	markdown.appendMarkdown(`| ${findIconGroup.name} |\n`);
	markdown.appendMarkdown('|:---:|\n');
	markdown.appendMarkdown(`| ![](${iconUrl}) |\n`);
	markdown.appendMarkdown(`| ${iconName} |\n`);
	markdown.appendMarkdown(`| <small>${findIconGroup.version} \\| ${findIconGroup?.license} |</small>`);
	return markdown;
};

export { getIconMarkdown };