import * as vscode from 'vscode';
import { translateToBaiduId } from './translator';

function generateFallbackId(text: string): string {
    // 生成一个基于文本内容和时间戳的默认ID
    const timestamp = Date.now();
    const sanitizedText = text
        .slice(0, 20)  // 限制长度
        .replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_');  // 保留中文和字母数字
    return `text_${sanitizedText}_${timestamp}`;
}

export async function extractI18n(
    document: vscode.TextDocument,
    selection: vscode.Selection
): Promise<{ updatedCode: string; i18nKey: string }> {
    const text = document.getText(selection);
    // console.log('text的值', text)
    let i18nKey = await translateToBaiduId(text).catch(() => generateFallbackId(text));
    
    // 检查是否已经导入了必要的依赖
    const fullText = document.getText();
    // console.log('fullText的值', fullText);

    // 找到所有的 import 语句，处理不同的换行符
    const importRegex = /import[\s\S]+?from\s+['"][^'"]+['"];?/g;
    let lastImportMatch;
    let lastImportEnd = 0;
    
    let allImports = [];
    while ((lastImportMatch = importRegex.exec(fullText)) !== null) {
        allImports.push(lastImportMatch[0]);
        lastImportEnd = lastImportMatch.index + lastImportMatch[0].length;
    }
    // console.log('找到的所有导入语句:', allImports);
    // console.log('最后一个导入语句结束位置:', lastImportEnd);

    // 生成新的导入语句，添加换行符
    let imports = '';
    if (!fullText.includes('import { defineMessages }')) {
        imports += `import { defineMessages } from 'react-intl'\n`;
    }
    if (!fullText.includes('import { useIntl }')) {
        imports += `import { useIntl } from '@umijs/max'\n`;
    }

    // 检查是否已经存在 intlObj 定义
    const hasIntlObj = fullText.includes('const intlObj = defineMessages(');
    
    // 生成 intlObj 定义，确保有足够的换行
    let intlObjContent = '';
    if (!hasIntlObj) {
        intlObjContent = `\nconst intlObj = defineMessages({\n`;
    }
    
    // 添加新的翻译项，使用原始文本作为 defaultMessage
    const newMessage = `  ${i18nKey}: {\n    id: '${i18nKey}',\n    defaultMessage: '${text}',\n  },\n`;
    
    if (hasIntlObj) {
        // 如果已存在 intlObj，在最后一个大括号前插入新的翻译项
        const intlObjRegex = /const\s+intlObj\s*=\s*defineMessages\s*\(\s*{([\s\S]*?)\n}\s*\)/;
        const intlObjMatch = intlObjRegex.exec(fullText);
        
        if (intlObjMatch) {
            const existingContent = intlObjMatch[1];
            
            // 检查是否已经存在相同的翻译项
            if (!existingContent.includes(`id: '${i18nKey}'`)) {
                // 计算插入位置：找到最后一个正确格式的项
                const position = document.positionAt(
                    intlObjMatch.index + intlObjMatch[0].indexOf('\n}')
                );
                
                // 在最后一个 } 前插入新项，确保前面有逗号
                const insertText = existingContent.trim().endsWith(',') 
                    ? `\n  ${i18nKey}: {\n    id: '${i18nKey}',\n    defaultMessage: '${text}',\n  },`
                    : `,\n  ${i18nKey}: {\n    id: '${i18nKey}',\n    defaultMessage: '${text}',\n  },`;
                
                await vscode.window.activeTextEditor?.edit(editBuilder => {
                    editBuilder.insert(position, insertText);
                });
            }
        }
    } else {
        // 如果不存在 intlObj，创建新的定义
        intlObjContent += newMessage + '})\n\n';
        
        // 在最后一个 import 后插入，确保有换行
        if (lastImportEnd > 0) {
            const position = document.positionAt(lastImportEnd);
            await vscode.window.activeTextEditor?.edit(editBuilder => {
                editBuilder.insert(position, '\n' + imports + intlObjContent);
            });
        }
    }

    // 返回要替换的代码
    return {
        updatedCode: `{t(intlObj.${i18nKey})}`,
        i18nKey
    };
} 