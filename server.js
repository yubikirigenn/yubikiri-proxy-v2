const express = require('express');
const path = require('path');
const { fetchPage } = require('./proxy.js');

const app = express();
const PORT = process.env.PORT || 3000;

// 1. ビュー（HTMLファイル）が置かれているディレクトリを設定
app.set('views', path.join(__dirname, 'views'));

// 2. 静的ファイル（CSS, JS）が置かれているディレクトリを設定
// これが最も重要な行です。
app.use(express.static(path.join(__dirname, 'public')));

// 3. POSTリクエストのJSONボディを解析する設定
app.use(express.json());

// 4. APIエンドポイントの定義
app.post('/proxy', async (req, res) => {
    const { url } = req.body;
    if (!url) { return res.status(400).json({ error: 'URL is required.' }); }
    try {
        const htmlContent = await fetchPage(url);
        res.send(htmlContent);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 5. その他の全てのGETリクエストに対して index.html を返す
// このルートは必ず最後に定義します。
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// サーバーの起動
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
