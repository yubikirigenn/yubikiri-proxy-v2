const express = require('express');
const path = require('path');
// proxy.jsからfetchPage関数をインポートする
const { fetchPage } = require('./proxy.js');

const app = express();
const PORT = process.env.PORT || 3000;

// POSTリクエストのJSONボディを解析するためのミドルウェア
app.use(express.json());
// 'public'フォルダ内の静的ファイル（CSS, JS）を提供
app.use(express.static(path.join(__dirname, 'public')));

// ルートURL ('/') にアクセスがあった場合、index.htmlを返す
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// '/proxy'エンドポイントへのPOSTリクエストを処理
app.post('/proxy', async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'URL is required.' });
    }

    try {
        // インポートしたfetchPage関数を使って、プロキシ処理を実行
        const htmlContent = await fetchPage(url);
        // 成功したら、取得したHTMLをクライアントに送信
        res.send(htmlContent);
    } catch (error) {
        // fetchPageでエラーが発生した場合、エラーメッセージをクライアントに返す
        res.status(500).json({ error: error.message });
    }
});

// サーバーを指定したポートで起動
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
