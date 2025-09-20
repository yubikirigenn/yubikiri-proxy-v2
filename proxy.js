const axios = require('axios');
const cheerio = require('cheerio'); // Cheerioをインポート

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
        return rawUrl; // 無効なURLの場合はそのまま返す
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
        if (item.length === 1) {
            return toProxiedUrl(item[0], baseUrl);
        }
        if (item.length > 1) {
            return `${toProxiedUrl(item[0], baseUrl)} ${item.slice(1).join(' ')}`;
        }
        return part;
    }).join(', ');
}


async function fetchAndRewrite(url) {
    try {
        const response = await axios.get(url, {
            responseType: 'arraybuffer', // HTML以外のコンテンツ（画像など）も扱えるようにする
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
            },
            validateStatus: () => true, // 404などのエラーも受け取る
        });

        const contentType = response.headers['content-type'] || '';

        // HTMLの場合のみ、中身を書き換える
        if (contentType.includes('text/html')) {
            const html = Buffer.from(response.data).toString('utf8');
            const $ = cheerio.load(html);

            // href属性を持つタグ (a, link)
            $('a, link').each((i, el) => {
                const href = $(el).attr('href');
                if (href) $(el).attr('href', toProxiedUrl(href, url));
            });

            // src属性を持つタグ (img, script, iframe, video, audio, source)
            $('img, script, iframe, video, audio, source').each((i, el) => {
                const src = $(el).attr('src');
                if (src) $(el).attr('src', toProxiedUrl(src, url));

                const srcset = $(el).attr('srcset');
                if (srcset) $(el).attr('srcset', rewriteSrcset(srcset, url));
            });
            
            // formのaction属性
            $('form').each((i, el) => {
                const action = $(el).attr('action');
                if (action) $(el).attr('action', toProxiedUrl(action, url));
            });

            // 書き換えたHTMLを返す
            return {
                headers: { 'Content-Type': 'text/html; charset=UTF-8' },
                data: $.html(),
            };
        }

        // HTML以外（CSS, JS, 画像など）はそのまま返す
        return {
            headers: { 'Content-Type': contentType },
            data: response.data,
        };

    } catch (error) {
        console.error(`Error fetching URL: ${url}`, error.message);
        throw new Error(`Failed to fetch the URL. Status: ${error.response?.status}`);
    }
}

// 他のファイルから使えるように関数をエクスポート
module.exports = { fetchAndRewrite };
