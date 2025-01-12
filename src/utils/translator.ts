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

export async function translateToBaiduId(text: string): Promise<string> {
    const config = vscode.workspace.getConfiguration('i18nHelper');
    const appid = config.get<string>('baiduAppId') || '';
    const secret = config.get<string>('baiduSecret') || '';
    
    if (!appid || !secret) {
        // console.log('使用默认ID生成方式');
        return `id_${text.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;
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
        // console.log('发送翻译请求:', url + '?' + params.toString());
        const response = await fetch(`${url}?${params.toString()}`);
        const data = await response.json() as BaiduTranslateResponse;
        // console.log('翻译响应:', data);
        
        if (data.trans_result?.[0]?.dst) {
            const translatedText = data.trans_result[0].dst;
            const id = translatedText
                .toLowerCase()
                .replace(/[^a-zA-Z0-9]+(.)?/g, (_, chr) => chr ? chr.toUpperCase() : '');
            // console.log('生成的ID:', id);
            return id;
        }
        throw new Error('Translation failed: No result');
    } catch (error) {
        // console.error('翻译错误:', error);
        return `id_${text.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;
    }
} 