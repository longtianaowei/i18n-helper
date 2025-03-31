import * as vscode from 'vscode';
import { translateToBaidu } from './translator';

export async function extractI18n(
    document: vscode.TextDocument,
    selection: vscode.Selection, // 默认使用 {t("${i18nKey}")}
    useCurlyBraces: boolean = true
): Promise<{ updatedCode: string; i18nKey: string; translatedText: string; }> {
    const text = document.getText(selection);
    const { id: i18nKey, translatedText } = await translateToBaidu(text);

    // 根据 useCurlyBraces 参数决定替换的格式
    const updatedCode = useCurlyBraces ? `{t("${i18nKey}")}` : `t("${i18nKey}")`;

    // 返回要替换的代码
    return {
        updatedCode,
        i18nKey,
        translatedText
    };
}