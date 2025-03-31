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
    // 命令1：生成 {t("${i18nKey}")}
    let disposable1 = vscode.commands.registerCommand('i18n-helper.extractTextWithCurlyBraces', async () => {
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
            const { updatedCode, i18nKey, translatedText } = await extractI18n(document, selection, true);

            // 替换选中的文本为 updatedCode
            editor.edit(editBuilder => {
                editBuilder.replace(selection, updatedCode);
            });

            // 读取配置项
            const shouldUpdateLocaleFiles = vscode.workspace.getConfiguration('i18nHelper').get<boolean>('updateLocaleFiles', true);

            // 根据配置是否需要更新语言包文件
            if (shouldUpdateLocaleFiles) {
                await updateLocaleFiles(i18nKey, text, translatedText);
            }

            // console.log('处理成功，i18nKey:', i18nKey);
            vscode.window.showInformationMessage('国际化处理成功！');
        } catch (error) {
            console.error('处理失败:', error);
            vscode.window.showErrorMessage(`国际化处理失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    });

    let disposable2 = vscode.commands.registerCommand('i18n-helper.extractTextWithoutCurlyBraces', async () => {
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
            const { updatedCode, i18nKey, translatedText } = await extractI18n(document, selection, false);

            // 替换选中的文本为 updatedCode
            editor.edit(editBuilder => {
                editBuilder.replace(selection, updatedCode);
            });

            // 读取配置项
            const shouldUpdateLocaleFiles = vscode.workspace.getConfiguration('i18nHelper').get<boolean>('updateLocaleFiles', true);

            // 根据配置是否需要更新语言包文件
            if (shouldUpdateLocaleFiles) {
                await updateLocaleFiles(i18nKey, text, translatedText);
            }

            // console.log('处理成功，i18nKey:', i18nKey);
            vscode.window.showInformationMessage('国际化处理成功！');
        } catch (error) {
            console.error('处理失败:', error);
            vscode.window.showErrorMessage(`国际化处理失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    });

    context.subscriptions.push(disposable1);
    context.subscriptions.push(disposable2);

}

export function deactivate() {} 