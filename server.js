const express = require('express');
const path = require('path');
const { fetchPage } = require('./proxy.js'); // proxy.jsをインポート

const app = express();
const PORT = process.env.PORT || 3000;

// 'public'フォルダの絶対パスを定義
const publicDirectoryPath = path.join(__dirname, 'public');

// サーバー起動時に、publicフォルダの場所をログに出力（確認のため）
console.log(`[INFO] Serving static files from: ${publicDirectoryPath}`);

// 1. 静的ファイルを提供するミドルウェアを最初に設定
//    'public'フォルダの中にあるファイル（index.html, style.cssなど）を
//    ブラウザから直接アクセスできるようにします。
app.use(express.static(publicDirectoryPath));

// 2. POSTリクエストのJSONボディを解析するミドルウェア
//    これは必ずAPIルートの前に置きます。
app.use(express.json());

// 3. プロキシ処理を行うAPIルート
app.post('/proxy', async (req, res) => {
    const { url } = req.body;
    if (!url) {
        return res.status(400).json({ error: 'URL is required.' });
    }
    try {
        const htmlContent = await fetchPage(url);
        res.send(htmlContent);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 4. サーバーを起動
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
