const axios = require('axios');
const cheerio = require('cheerio');

// v1にあったURL書き換えヘルパー関数
function toProxiedUrl(rawUrl, baseUrl) {
    if (!rawUrl || rawUrl.startsWith('data:') || rawUrl.startsWith('javascript:')) {
        return rawUrl;
    }
    try {
        const absoluteUrl = new URL(rawUrl, baseUrl).toString();
        // ★重要★ v2のエンドポイントに合わせて /proxy?url=... にする
        return `/proxy?url=${encodeURIComponent(absoluteUrl)}`;
    } catch (e) {
        return rawUrl;
    }
}
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
 * @returns {Promise<object>} - { headers: object, data: Buffer|string }
 */
async function fetchAndRewrite(url) {
    try {
          const response = await axios.get(url, {
            responseType: 'arraybuffer',
            headers: {
                // User-Agentを最新のChromeのものに更新
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
                // Acceptヘッダーを、実際のブラウザが送るものに近づける
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                'Accept-Encoding': 'gzip, deflate, br',
                'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
                // Sec-Fetch-* ヘッダー群は、ブラウザからのリクエストであることを示す重要な情報
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-User': '?1',
                'Upgrade-Insecure-Requests': '1',
                // Refererヘッダーを追加。Googleから来たように見せかける（サイトによっては逆効果の場合もある）
                'Referer': 'https://www.google.com/'
            },
            validateStatus: () => true,
        });

        const contentType = response.headers['content-type'] || '';

        // ★★★ v1のCORSヘッダー設定をここに追加 ★★★
        const responseHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': '*',
            'Content-Type': contentType,
        };

        // 400以上のエラーステータスだった場合、そのまま返す
        if (response.status >= 400) {
            return {
                status: response.status,
                headers: responseHeaders,
                data: response.data,
            };
        }

        // HTMLの場合のみ、中身を書き換える
        if (contentType.includes('text/html')) {
            const html = Buffer.from(response.data).toString('utf8');
            const $ = cheerio.load(html);

            // a, link, form
            $('a, link, form').each((i, el) => {
                const $el = $(el);
                const href = $el.attr('href');
                if (href) $el.attr('href', toProxiedUrl(href, url));
                const action = $el.attr('action');
                if (action) $el.attr('action', toProxiedUrl(action, url));
            });

            // img, script, iframe, etc.
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

        // HTML以外（CSS, JS, 画像など）は、CORSヘッダーを付与してそのまま返す
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