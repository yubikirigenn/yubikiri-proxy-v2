const axios = require('axios');

/**
 * 指定されたURLからページのHTMLコンテンツを取得する関数
 * @param {string} url - 取得したいページのURL
 * @returns {Promise<string>} - ページのHTMLコンテンツ
 */
async function fetchPage(url) {
    try {
        // 外部サイトにリクエストを送信。ブラウザからのアクセスに見せかけるヘッダーを付与。
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
                'Accept-Encoding': 'gzip, deflate, br', // 圧縮されたレスポンスを扱えるようにする
            },
            // Gzipなどで圧縮されたレスポンスを自動で解凍する
            decompress: true,
        });
        // 取得したHTMLデータを返す
        return response.data;
    } catch (error) {
        // エラーが発生した場合、コンソールに詳細を出力
        console.error(`Error fetching URL: ${url}`, error.message);
        // エラーを呼び出し元に伝えるために、エラーを再スローする
        throw new Error(`Failed to fetch the URL. Status: ${error.response?.status}`);
    }
}

// この関数を他のファイルから 'require' できるようにエクスポートする
module.exports = { fetchPage };
