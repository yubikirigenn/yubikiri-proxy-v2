const express = require('express');
const path = require('path');
const { fetchPage } = require('./proxy.js');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// ★★★ 変更点 ★★★
// 静的ファイルを提供するルートを最初に定義します。
// これにより、/style.css や /script.js へのリクエストが正しく処理されます。
app.use(express.static(path.join(__dirname, 'public')));

// '/proxy'エンドポイントへのPOSTリクエストを処理
app.post('/proxy', async (req, res) => {
    // (この部分のコードは変更なし)
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

// ★★★ 変更点 ★★★
// その他のすべてのGETリクエストに対して index.html を返します。
// これを静的ファイル提供の後、かつAPIエンドポイントの後に置くことが重要です。
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// サーバーを指定したポートで起動
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
