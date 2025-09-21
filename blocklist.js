// blocklist.js

// ブロックしたい広告・トラッカードメインのリスト
// Setを使うことで、リストからの検索が高速になります。
const blockedDomains = new Set([
    // Google Ads & Analytics
    'googlesyndication.com',
    'googletagservices.com',
    'google-analytics.com',
    'doubleclick.net',
    'adservice.google.com',

    // Other common ad/tracking networks
    'criteo.com',
    'criteo.net',
    'adnxs.com',
    'adform.net',
    'rubiconproject.com',
    'openx.net',
    'pubmatic.com',
    'outbrain.com',
    'taboola.com',
    'scorecardresearch.com', // comScore
]);

/**
 * 指定されたURLがブロックリストに含まれているかをチェックする関数
 * @param {string} urlString - チェックしたいURL
 * @returns {boolean} - ブロック対象であればtrue, そうでなければfalse
 */
function isBlocked(urlString) {
    try {
        const url = new URL(urlString);
        const domain = url.hostname;

        // 'www.google-analytics.com' のようなサブドメインもチェックするため、
        // ドメインがブロックリストのいずれかのドメインで "終わるか" を確認する
        for (const blockedDomain of blockedDomains) {
            if (domain.endsWith(blockedDomain)) {
                return true;
            }
        }
        return false;
    } catch (e) {
        // 無効なURLの場合はブロックしない
        return false;
    }
}

// isBlocked関数を他のファイルから使えるようにエクスポートする
module.exports = { isBlocked };