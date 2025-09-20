const express = require('express');
const path = require('path');
const { fetchPage } = require('./proxy.js');

const app = express();
const PORT = process.env.PORT || 3000;

// 現在のスクリプトが存在するディレクトリの絶対パスを取得
const BASE_DIR = __dirname;
console.log(`[Server] Base directory is: ${BASE_DIR}`);

// publicフォルダの絶対パスを定義
const publicPath = path.resolve(BASE_DIR, 'public');
console.log(`[Server] Serving static files from: ${publicPath}`);

// viewsフォルダの絶対パスを定義
const viewsPath = path.resolve(BASE_DIR, 'views');
console.log(`[Server] View files are in: ${viewsPath}`);


// --- Middleware & Routes ---

// 1. 静的ファイルを提供するミドルウェア
//    /style.css へのリクエストは、publicPath 内の style.css を探す
app.use(express.static(publicPath));

// 2. POSTリクエストのJSONボディを解析するミドルウェア
app.use(express.json());

// 3. APIエンドポイントの定義
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

// 4. その他の全てのGETリクエストに対して index.html を返す
//    このルートは必ず最後に定義します。
app.get('*', (req, res) => {
    res.sendFile(path.join(viewsPath, 'index.html'));
});

// サーバーの起動
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
