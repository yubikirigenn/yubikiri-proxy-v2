const express = require('express');
const path = require('path');
// v2のproxy.jsは関数をエクスポートしているので、それに合わせる
const { fetchPage } = require('./proxy.js'); 

const app = express();
const PORT = process.env.PORT || 3000;

// 1. POSTリクエストのJSONボディを解析するミドルウェアを最初に設定
app.use(express.json());

// 2. 静的ファイルを提供するミドルウェアを設定
//    ブラウザからの /style.css や /script.js のリクエストは、
//    ここで public フォルダの中身が自動的に返されます。
app.use(express.static(path.join(__dirname, 'public')));

// 3. プロキシAPIのエンドポイントを設定
//    /proxy へのPOSTリクエストのみ、ここで処理されます。
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


// 4. 【重要】ルートURL ('/') へのGETリクエストが来た時だけ、index.htmlを返す
//    v2ではindex.htmlはpublicフォルダにあるので、パスを修正します。
//    app.get('*', ...) を使わないことで、CSSのリクエストを邪魔しません。
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


// サーバーを起動
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
