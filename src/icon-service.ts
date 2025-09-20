import * as fsPromises from 'node:fs/promises';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { logger } from './utils';
import { getPackageInfo, importModule } from 'local-pkg';
import type { Range } from 'vscode';
import { CompletionItemKind, CompletionItem, window } from 'vscode';
import { pathToFileURL } from 'node:url';
import * as ChangeCase from 'change-case';
import { renderToString } from '@vue/server-renderer';

type IconData = {
	name: string;
	url: string;
	prefix: string;
	license: string;
	repo: string;
	version: string;
	count: number;
	group: string;
};
export class IconService {
	private packageRootPath: string | undefined;
	private packageInfo: {
		name: string;
		version: string | undefined;
		rootPath: string;
		packageJsonPath: string;
	} | undefined;

	private iconsData: IconData[] = [];

	constructor() {
		this.packageRootPath = this.findPackageJsonPath();
		if (!this.packageRootPath) {
			logger.error('No package.json found in the workspace ');
			window.showErrorMessage('VueIcons: No package.json found in the workspace');
		}
	}

	public async loadPackageInfo() {
		if (!this.packageRootPath){
			return;
		}

		this.packageInfo = await getPackageInfo('@kalimahapps/vue-icons', { paths: [path.dirname(this.packageRootPath)] });
		if (!this.packageInfo) {
			window.showErrorMessage('@kalimahapps/vue-icons package not found. Please ensure it is installed in your workspace.');
			logger.error('@kalimahapps/vue-icons package not found. Please ensure it is installed in your workspace.');
			return;
		}

		logger.info('Found @kalimahapps/vue-icons package');
	}

	private findPackageJsonPath(): string | undefined {
		const activeFilePath = window.activeTextEditor?.document.uri.fsPath;

		if (!activeFilePath) {
			return undefined;
		}

		const activeDirectory = path.dirname(activeFilePath);
		let currentPath = activeDirectory;
		while (currentPath !== path.parse(currentPath).root) {
			const packageJsonPath = path.join(currentPath, 'package.json');
			if (fs.existsSync(packageJsonPath)) {
				return packageJsonPath;
			}
			currentPath = path.dirname(currentPath);
		}
		return undefined;
	}

	async loadIconsGroups(){
		if (!this.packageInfo) {
			return;
		}

		const contentFilePath = path.join(this.packageInfo.rootPath, 'icons', 'content.json');
		if (!fs.existsSync(contentFilePath)) {
			logger.info('contents.json does not exist');
			return;
		}

		const contentFileData = await fsPromises.readFile(contentFilePath, 'utf8');
		this.iconsData = JSON.parse(contentFileData);
	}

	async loadIcon(label: string, style?: Record<string, string>): Promise<string|undefined> {
		if (!this.packageInfo) {
			return undefined;
		}

		const [group] = label.split(':');
		const iconPath = path.join(this.packageInfo.rootPath, 'icons', group, 'index.js');

		if (!fs.existsSync(iconPath)) {
			return undefined;
		}

		const fileUrl = pathToFileURL(iconPath).href;
		const icons = await importModule(fileUrl);
		const labelPascalCase = ChangeCase.pascalCase(label, {
			split: ChangeCase.splitSeparateNumbers,
			mergeAmbiguousCharacters: true,
		});

		const icon = icons[labelPascalCase];

		if (!icon) {
			logger.error(`No icon found for ${label} at ${iconPath}`);
			return undefined;
		}

		const iconSvg = await renderToString(icon({}));
		if (style) {
			const styleString = Object.entries(style)
				.map(([key, value]) => {
					return `${key}: ${value};`;
				})
				.join(' ');
			return iconSvg.replace('<svg ', `<svg style="${styleString}" `);
		}
		return iconSvg;
	}

	async loadIconsList() {
		if (!this.packageInfo) {
			logger.error('Package info not loaded. Cannot load icons list.');
			return [];
		}
		const iconsListFilePath = path.join(this.packageInfo.rootPath, 'icons', 'icons-list.json');
		const fileExists = fs.existsSync(iconsListFilePath);
		if (!fileExists){
			logger.error('Icons list file not found:', iconsListFilePath);
			window.showErrorMessage('VueIcons: Icons list file not found');
			return [];
		}

		const iconsFileContent = await fsPromises.readFile(iconsListFilePath, 'utf8');
		const parsedFileContent = JSON.parse(iconsFileContent) as string[];
		logger.info(`Loaded ${parsedFileContent.length} icons`);
		return parsedFileContent;
	}

	loadCompletionItems(range: Range): CompletionItem[] {
		if (!this.packageInfo) {
			return [];
		}

		const iconsList = path.join(this.packageInfo.rootPath, 'icons', 'icons-list.json');

		try {
			const iconsData = fs.readFileSync(iconsList, 'utf8');
			const icons = JSON.parse(iconsData) as string[];

			return icons.map((icon) => {
				const item = new CompletionItem(icon, CompletionItemKind.Value);
				item.insertText = icon;
				item.detail = 'Vue Icons';
				item.range = range;
				return item;
			});
		} catch (error) {
			logger.error('Failed to load icons list:', error);
			window.showErrorMessage('Failed to load @kalimahapps/vue-icons icons list');
			return [];
		}
	}

	getIconsData() {
		return this.iconsData;
	}

	async reloadPackageData(){
		const checkPackageRootPath = this.findPackageJsonPath();
		if (!checkPackageRootPath) {
			logger.error('No package.json found in the workspace, cannot reload package data');
			return;
		}

		if (checkPackageRootPath === this.packageRootPath) {
			logger.info('No change in package root path, skipping reload');
			return;
		}

		logger.info(`Package root path changed from ${this.packageRootPath} to ${checkPackageRootPath}`);
		logger.info('Reloading ...');

		// load other items
		await this.loadIconsList();
		await this.loadIconsGroups();
	}
}

const iconServiceInstace = new IconService();

export default iconServiceInstace;
