const axios = require('axios');
const cheerio = require('cheerio');

/**
 * URLをプロキシ経由の絶対URLに変換するヘルパー関数
 * @param {string} rawUrl - 元のURL (例: "/css/style.css")
 * @param {string} baseUrl - 基準となるページのURL (例: "https://www.example.com/page")
 * @returns {string} - プロキシされたURL (例: "/proxy?url=https%3A%2F%2Fwww.example.com%2Fcss%2Fstyle.css")
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
 * @param {string} srcset - 元のsrcset (例: "img-sm.jpg 1x, img-lg.jpg 2x")
 * @param {string} baseUrl - 基準となるページのURL
 * @returns {string} - プロキシされたsrcset
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
            return {
                status: response.status,
                headers: responseHeaders,
                data: response.data,
            };
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
            return {
                status: 200,
                headers: responseHeaders,
                data: $.html(),
            };
        }

        // 2. JavaScript または JSON の場合 (Scratchのために新しく追加)
        if (contentType.includes('javascript') || contentType.includes('json')) {
            let textData = Buffer.from(response.data).toString('utf8');
            
            // Scratchが使いそうなURLを正規表現で探し、プロキシ経由のURLに置換する
            const scratchUrlRegex = /https?:\/\/([a-zA-Z0-9-]+\.)*(scratch\.mit\.edu|turbowarp\.org)/g;
            
            const rewrittenData = textData.replace(scratchUrlRegex, (match) => {
                // toProxiedUrl は /proxy?url=... を返すので、それでOK
                return toProxiedUrl(match, url);
            });

            return {
                status: 200,
                headers: responseHeaders,
                data: rewrittenData,
            };
        }

        // 3. 上記以外（画像、CSSなど）は、CORSヘッダーを付与してそのまま返す
        return {
            status: 200,
            headers: responseHeaders,
            data: response.data,
        };

    } catch (error) {
        console.error(`[Proxy Error] URL: ${url} | Message: ${error.message}`);
        throw new Error(`Proxy failed to fetch the URL.`);
    }
}

module.exports = { fetchAndRewrite };