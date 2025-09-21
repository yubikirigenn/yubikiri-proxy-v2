const axios = require('axios');
const cheerio = require('cheerio');
const { isBlocked } = require('./blocklist.js');

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

function rewriteSrcset(srcset, baseUrl) {
    return srcset.split(',').map(part => {
        const item = part.trim().split(/\s+/);
        if (item.length === 1) return toProxiedUrl(item[0], baseUrl);
        if (item.length > 1) return `${toProxiedUrl(item[0], baseUrl)} ${item.slice(1).join(' ')}`;
        return part;
    }).join(', ');
}

async function fetchAndRewrite(url) {
    // 最初に、リクエストされたURLがブロック対象かをチェック
    if (isBlocked(url)) {
        console.log(`[AdBlock] Blocked URL: ${url}`);
        return {
            status: 204, // No Content
            headers: { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' },
            data: '',
        };
    }

    try {
        const response = await axios.get(url, {
            responseType: 'arraybuffer',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                'Accept-Encoding': 'gzip, deflate, br',
                'Accept-Language': 'ja,en-US;q=0.9,en',
                'Connection': 'keep-alive',
                'DNT': '1',
                'Sec-GPC': '1',
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

        if (contentType.includes('javascript') || contentType.includes('json')) {
            let textData = Buffer.from(response.data).toString('utf8');
            const urlRegex = /(['"])(https?:\/\/[^\s"'<>]+)\1/g;
            let rewrittenData = textData.replace(urlRegex, (match, quote, urlInQuote) => {
                if (urlInQuote.includes('.scratch.mit.edu') || urlInQuote.includes('.turbowarp.org')) {
                    return `${quote}${toProxiedUrl(urlInQuote, url)}${quote}`;
                }
                return match;
            });
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
                } catch (e) { console.log('[Info] JSON parsing failed, using text replacement result.'); }
            }
            return { status: 200, headers: responseHeaders, data: rewrittenData };
        }
        
        return { status: 200, headers: responseHeaders, data: response.data };

    } catch (error) {
        console.error(`[Proxy Error] URL: ${url} | Message: ${error.message}`);
        throw new Error(`Proxy failed to fetch the URL.`);
    }
}

module.exports = { fetchAndRewrite };