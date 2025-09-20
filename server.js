const express = require('express');
const path = require('path');
const fs = require('fs'); // Node.jsのファイルシステムモジュールを追加
const { fetchPage } = require('./proxy.js');

const app = express();
const PORT = process.env.PORT || 3000;

console.log('--- Server starting up... ---');

// デバッグ：現在のディレクトリ構造を出力
console.log(`Current directory (__dirname): ${__dirname}`);
try {
    const filesInRoot = fs.readdirSync(__dirname);
    console.log('Files in root directory:', filesInRoot);

    const filesInPublic = fs.readdirSync(path.join(__dirname, 'public'));
    console.log('Files in public/ directory:', filesInPublic);
} catch (e) {
    console.error('Error reading directories:', e.message);
}
console.log('-----------------------------');


app.use(express.json());

// デバッグ：全てのリクエストをログに出力するミドルウェア
app.use((req, res, next) => {
    console.log(`[Request Log] Path: ${req.path}, Method: ${req.method}`);
    next();
});

// 静的ファイル提供
app.use(express.static(path.join(__dirname, 'public')));

// APIエンドポイント
app.post('/proxy', async (req, res) => {
    // (この部分は変更なし)
    const { url } = req.body;
    if (!url) { return res.status(400).json({ error: 'URL is required.' }); }
    try {
        const htmlContent = await fetchPage(url);
        res.send(htmlContent);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// その他のGETリクエスト
app.get('*', (req, res) => {
    console.log(`[Catch-All] Serving index.html for path: ${req.path}`);
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// サーバー起動
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
