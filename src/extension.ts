import * as vscode from 'vscode';
import { detectChineseText } from './utils/detector';
import { extractI18n } from './utils/extractor';
import { updateLocaleFiles } from './utils/localeUpdater';

class I18nError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'I18nError';
    }
}

export function activate(context: vscode.ExtensionContext) {
    // console.log('i18n-helper 插件已激活');

    // 注册中文检测功能
    const chineseDetector = vscode.languages.createDiagnosticCollection('chinese');
    
    // 监听文档变化
    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument(event => {
            if (event.document.languageId === 'typescriptreact') {
                const diagnostics = detectChineseText(event.document);
                chineseDetector.set(event.document.uri, diagnostics);
            }
        })
    );

    // 注册提取文本到i18n的命令
    let disposable = vscode.commands.registerCommand('i18n-helper.extractText', async () => {
        // console.log('开始提取文本到 i18n');
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }

        const document = editor.document;
        const selection = editor.selection;
        const text = document.getText(selection);

        if (!text) {
            vscode.window.showWarningMessage('请先选择要国际化的文本');
            return;
        }

        try {
            // console.log('选中的文本:', text);
            
            // 获取生成的代码
            const { updatedCode, i18nKey } = await extractI18n(document, selection);
            
            // 等待文件更新完成
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // 重新获取文档内容并找到原始文本的精确位置
            const updatedFullText = document.getText();
            const lines = updatedFullText.split('\n');
            let found = false;
            
            // 遍历每一行查找精确匹配的文本
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                const index = line.indexOf(text);
                if (index !== -1) {
                    // 确保找到的是完整的词，而不是 defaultMessage 中的文本
                    const lineBeforeText = line.substring(0, index);
                    const lineAfterText = line.substring(index + text.length);
                    
                    // 检查是否在 defaultMessage 中
                    if (!lineBeforeText.includes('defaultMessage:')) {
                        // 计算精确的位置
                        const lineStart = document.offsetAt(new vscode.Position(i, 0));
                        const startPos = document.positionAt(lineStart + index);
                        const endPos = document.positionAt(lineStart + index + text.length);
                        
                        // 替换文本
                        await editor.edit(editBuilder => {
                            editBuilder.replace(new vscode.Selection(startPos, endPos), updatedCode);
                        });
                        found = true;
                        break;
                    }
                }
            }
            
            if (!found) {

                vscode.window.showErrorMessage('国际化处理失败,未匹配到最开始的文本')
            }

            // 更新语言包文件 后续版本加入科举哥脚本
            // await updateLocaleFiles(i18nKey, text);
            
            // console.log('处理成功，i18nKey:', i18nKey);
            vscode.window.showInformationMessage('国际化处理成功！');
        } catch (error) {
            console.error('处理失败:', error);
            vscode.window.showErrorMessage(`国际化处理失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {} 