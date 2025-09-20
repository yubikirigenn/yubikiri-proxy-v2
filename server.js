const express = require('express');
const path = require('path');
const { fetchPage } = require('./proxy.js');

const app = express();
const PORT = process.env.PORT || 3000;

// POSTリクエストのJSONボディを解析するミドルウェア
app.use(express.json());

// 'public'フォルダから全ての静的ファイル(index.html, style.css, script.js)を提供する
// これがブラウザからのリクエストに対するメインの応答になります。
// ルートURL('/')へのアクセスも、自動的に'public/index.html'を返します。
app.use(express.static(path.join(__dirname, 'public')));

// プロキシ処理専用のAPIエンドポイント
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

// app.get('*', ...) はもう不要です！

// サーバーを起動
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
