const axios = require('axios');
const cheerio = require('cheerio');

/**
 * URLをプロキシ経由の絶対URLに変換するヘルパー関数
 */
function toProxiedUrl(rawUrl, baseUrl) {
    if (!rawUrl || rawUrl.startsWith('data:') || rawUrl.startsWith('javascript:')) {
        return rawUrl;
    }
    try {
        const absoluteUrl = new URL(rawUrl, baseUrl).toString();
        return `/proxy?url=${encodeURIComponent(absoluteUrl)}`;
    } catch (e) {
        return rawUrl;
    }
}

/**
 * srcset属性（レスポンシブ画像用）を書き換えるヘルパー関数
 */
function rewriteSrcset(srcset, baseUrl) {
    return srcset.split(',').map(part => {
        const item = part.trim().split(/\s+/);
        if (item.length === 1) return toProxiedUrl(item[0], baseUrl);
        if (item.length > 1) return `${toProxiedUrl(item[0], baseUrl)} ${item.slice(1).join(' ')}`;
        return part;
    }).join(', ');
}

/**
 * 外部URLからコンテンツを取得し、必要に応じて内容を書き換えるメイン関数
 * @param {string} url - ターゲットのURL
 * @returns {Promise<object>} - { status: number, headers: object, data: Buffer|string }
 */
async function fetchAndRewrite(url) {
    try {
        const response = await axios.get(url, {
            responseType: 'arraybuffer',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                'Accept-Encoding': 'gzip, deflate, br',
                'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-User': '?1',
                'Upgrade-Insecure-Requests': '1',
                'Referer': 'https://www.google.com/'
            },
            validateStatus: () => true,
        });

        const contentType = response.headers['content-type'] || '';
        const responseHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': '*',
            'Content-Type': contentType,
        };

        if (response.status >= 400) {
            return { status: response.status, headers: responseHeaders, data: response.data };
        }

        // --- コンテンツタイプに応じた書き換え処理 ---

        // 1. HTMLの場合
        if (contentType.includes('text/html')) {
            const html = Buffer.from(response.data).toString('utf8');
            const $ = cheerio.load(html);

            $('a, link, form').each((i, el) => {
                const $el = $(el);
                const href = $el.attr('href');
                if (href) $el.attr('href', toProxiedUrl(href, url));
                const action = $el.attr('action');
                if (action) $el.attr('action', toProxiedUrl(action, url));
            });

            $('img, script, iframe, video, audio, source').each((i, el) => {
                const $el = $(el);
                const src = $el.attr('src');
                if (src) $el.attr('src', toProxiedUrl(src, url));
                const srcset = $el.attr('srcset');
                if (srcset) $el.attr('srcset', rewriteSrcset(srcset, url));
            });
            
            responseHeaders['Content-Type'] = 'text/html; charset=UTF-8';
            return { status: 200, headers: responseHeaders, data: $.html() };
        }

        // 2. JavaScript または JSON の場合
        if (contentType.includes('javascript') || contentType.includes('json')) {
            let textData = Buffer.from(response.data).toString('utf8');
            
            // 正規表現で "https://..." や 'https://...' 形式のURLを探す
            const urlRegex = /(['"])(https?:\/\/[^\s"'<>]+)\1/g;
            
            let rewrittenData = textData.replace(urlRegex, (match, quote, urlInQuote) => {
                if (urlInQuote.includes('.scratch.mit.edu') || urlInQuote.includes('.turbowarp.org')) {
                    const proxied = toProxiedUrl(urlInQuote, url);
                    return `${quote}${proxied}${quote}`;
                }
                return match;
            });
            
            // JSONの場合、さらに中身を再帰的に書き換える
            if (contentType.includes('json')) {
                try {
                    let jsonObj = JSON.parse(rewrittenData);
                    
                    function traverseAndRewrite(obj) {
                        for (let key in obj) {
                            if (typeof obj[key] === 'string') {
                                if (obj[key].startsWith('http') && (obj[key].includes('.scratch.mit.edu') || obj[key].includes('.turbowarp.org'))) {
                                   obj[key] = toProxiedUrl(obj[key], url);
                                }
                            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                                traverseAndRewrite(obj[key]);
                            }
                        }
                    }
                    
                    traverseAndRewrite(jsonObj);
                    rewrittenData = JSON.stringify(jsonObj);
                } catch (e) {
                    console.log('[Info] JSON parsing failed, using text replacement result.');
                }
            }
            
            return { status: 200, headers: responseHeaders, data: rewrittenData };
        }

        // 3. 上記以外はそのまま返す
        return { status: 200, headers: responseHeaders, data: response.data };

    } catch (error) {
        console.error(`[Proxy Error] URL: ${url} | Message: ${error.message}`);
        throw new Error(`Proxy failed to fetch the URL.`);
    }
}

module.exports = { fetchAndRewrite };