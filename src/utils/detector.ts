import * as vscode from 'vscode';

export function detectChineseText(document: vscode.TextDocument): vscode.Diagnostic[] {
    const text = document.getText();
    const diagnostics: vscode.Diagnostic[] = [];
    const chineseRegex = /[\u4e00-\u9fa5]+/g;
    
    // 按行处理文本
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // 忽略注释行和 console.log
        if (line.trim().startsWith('//') || 
            line.trim().startsWith('/*') || 
            line.trim().startsWith('*') ||
            line.includes('console.log')) {
            continue;
        }

        let match;
        while ((match = chineseRegex.exec(line)) !== null) {
            // 检查是否在注释中或console.log中
            const lineBeforeMatch = line.substring(0, match.index);
            if (lineBeforeMatch.includes('//') || 
                lineBeforeMatch.includes('console.log') ||
                isInMultilineComment(document, i, match.index)) {
                continue;
            }

            const range = new vscode.Range(
                i,
                match.index,
                i,
                match.index + match[0].length
            );
            
            const diagnostic = new vscode.Diagnostic(
                range,
                '检测到未国际化的中文文本',
                vscode.DiagnosticSeverity.Information
            );
            diagnostics.push(diagnostic);
        }
    }
    
    return diagnostics;
}

// 检查是否在多行注释中
function isInMultilineComment(document: vscode.TextDocument, line: number, column: number): boolean {
    const text = document.getText();
    const position = document.offsetAt(new vscode.Position(line, column));
    
    // 查找最后一个 /* 和最近的 */
    let lastCommentStart = text.lastIndexOf('/*', position);
    if (lastCommentStart === -1) return false;
    
    let nextCommentEnd = text.indexOf('*/', lastCommentStart);
    if (nextCommentEnd === -1) return false;
    
    return position > lastCommentStart && position < nextCommentEnd;
} 