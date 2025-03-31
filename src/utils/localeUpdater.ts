import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export async function updateLocaleFiles(key: string, text: string, translatedText: string): Promise<void> {
    const config = vscode.workspace.getConfiguration('i18nHelper');
    const localesPath = config.get<string>('localesPath') || 'src/locales';
    
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        throw new Error('No workspace folder found');
    }

    const rootPath = workspaceFolders[0].uri.fsPath;
    const zhPath = path.join(rootPath, localesPath, 'zh-CN.json');
    const enPath = path.join(rootPath, localesPath, 'en-US.json');

    // 确保目录存在
    const dir = path.dirname(zhPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    await updateLocaleFile(zhPath, key, text);
    await updateLocaleFile(enPath, key, translatedText);
}

async function updateLocaleFile(filePath: string, key: string, value: string): Promise<void> {
    let content: Record<string, string> = {};
    
    if (fs.existsSync(filePath)) {
        try {
            const fileContent = fs.readFileSync(filePath, 'utf8');
            content = JSON.parse(fileContent.trim() || '{}');
        } catch (error) {
            console.error(`Error reading ${filePath}:`, error);
            content = {};
        }
    }

    content[key] = value;
    
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
} 