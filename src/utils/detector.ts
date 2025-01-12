import * as vscode from 'vscode';

export function detectChineseText(document: vscode.TextDocument): vscode.Diagnostic[] {
    const text = document.getText();
    const diagnostics: vscode.Diagnostic[] = [];
    
    // 中文字符的正则表达式
    const chineseRegex = /[\u4e00-\u9fa5]+/g;
    let match;

    while ((match = chineseRegex.exec(text)) !== null) {
        const startPos = document.positionAt(match.index);
        const endPos = document.positionAt(match.index + match[0].length);
        const range = new vscode.Range(startPos, endPos);

        const diagnostic = new vscode.Diagnostic(
            range,
            '检测到中文文本，建议进行国际化处理',
            vscode.DiagnosticSeverity.Information
        );

        diagnostics.push(diagnostic);
    }

    return diagnostics;
} 