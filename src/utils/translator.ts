import fetch from 'node-fetch';
import * as crypto from 'crypto';
import * as vscode from 'vscode';

interface BaiduTranslateResponse {
    from: string;
    to: string;
    trans_result: {
        src: string;
        dst: string;
    }[];
}

export async function translateToBaidu(text: string): Promise<{ id: string; translatedText: string; }> {
    const config = vscode.workspace.getConfiguration('i18nHelper');
    const appid = config.get<string>('baiduAppId') || '';
    const secret = config.get<string>('baiduSecret') || '';
    
    if (!appid || !secret) {
        // 如果没有配置百度翻译，使用本地生成ID的方式
        const id = generateLocalId(text);
        return { id, translatedText: text };
    }

    const salt = Date.now().toString();
    const signStr = appid + text + salt + secret;
    const sign = crypto.createHash('md5').update(signStr).digest('hex');
    
    const url = 'https://fanyi-api.baidu.com/api/trans/vip/translate';
    const params = new URLSearchParams();
    params.append('q', text);
    params.append('from', 'zh');
    params.append('to', 'en');
    params.append('appid', appid);
    params.append('salt', salt);
    params.append('sign', sign);

    try {
        const response = await fetch(`${url}?${params.toString()}`);
        const data = await response.json() as BaiduTranslateResponse;
        
        if (data.trans_result?.[0]?.dst) {
            const translatedText = data.trans_result[0].dst;
            const id = generateIdFromTranslation(translatedText);
            return { id, translatedText };
        }
        throw new Error('Translation failed: No result');
    } catch (error) {
        const id = generateLocalId(text);
        return { id, translatedText: text };
    }
}

// 从翻译结果生成ID
function generateIdFromTranslation(translatedText: string): string {
    // 1. 转换为小写
    let id = translatedText.toLowerCase();
    
    // 2. 只保留字母和数字，将其他字符转换为驼峰格式
    id = id.replace(/[^a-z0-9]+(.)?/g, (_, chr) => chr ? chr.toUpperCase() : '');
    
    // 3. 如果生成的ID过长，截取合适的长度（保持语义完整性）
    if (id.length > 30) {
        // 按驼峰分割
        const words = id.split(/(?=[A-Z])/);
        // 保留前几个单词，确保总长度不超过30
        let result = '';
        for (const word of words) {
            if ((result + word).length <= 30) {
                result += word;
            } else {
                break;
            }
        }
        return result;
    }
    
    return id;
}

// 本地生成ID的方式
function generateLocalId(text: string): string {
    // 1. 提取中文的前10个字符
    const shortText = text.slice(0, 10);
    
    // 2. 生成拼音（需要安装 pinyin 包）
    const pinyin = require('pinyin');
    const pinyinResult = pinyin(shortText, {
        style: pinyin.STYLE_NORMAL,
        heteronym: false
    }).flat().join('');
    
    // 3. 添加时间戳后缀（取后4位）以确保唯一性
    const timestamp = Date.now().toString().slice(-4);
    
    // 4. 组合ID（限制总长度为30）
    let id = pinyinResult.toLowerCase().replace(/[^a-z0-9]+/g, '');
    if (id.length > 25) {
        id = id.slice(0, 25);
    }
    
    return `${id}_${timestamp}`;
} 