const express = require('express');
const path = require('path');
const { fetchPage } = require('./proxy.js');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// --- ここが重要です(1) ---
// 静的ファイル（CSS, JS）のリクエストを最初に処理するようにします。
// これにより、'/style.css' へのアクセスが 'public/style.css' を正しく返すようになります。
app.use(express.static(path.join(__dirname, 'public')));

// APIエンドポイントの処理
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

// --- ここが重要です(2) ---
// 上記のいずれにも一致しない、その他の全てのGETリクエストに対して 'index.html' を返します。
// この行は必ず、静的ファイル提供の後に記述する必要があります。
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// サーバーの起動
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
