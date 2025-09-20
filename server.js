const express = require('express');
const path = require('path');
const { fetchPage } = require('./proxy.js');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// -------------------------------------------------------------
// 【最終手段】静的ファイルをすべて手動でルーティングする
// -------------------------------------------------------------

// '/style.css' へのリクエストを処理
app.get('/style.css', (req, res) => {
    // res.type()でContent-Typeを明示的に'text/css'に設定する
    res.type('text/css');
    // public/style.css ファイルを送信する
    res.sendFile(path.join(__dirname, 'public', 'style.css'));
});

// '/script.js' へのリクエストを処理
app.get('/script.js', (req, res) => {
    // Content-Typeを'application/javascript'に設定する
    res.type('application/javascript');
    // public/script.js ファイルを送信する
    res.sendFile(path.join(__dirname, 'public', 'script.js'));
});

// express.static はもう信用しないのでコメントアウトまたは削除します
// app.use(express.static(path.join(__dirname, 'public')));
// -------------------------------------------------------------

// プロキシAPIのエンドポイント
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

// ルートURL ('/') へのGETリクエストが来た時だけ、index.htmlを返す
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// サーバーを起動
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
