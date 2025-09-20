const express = require('express');
const path = require('path');
// 新しい関数名 'fetchAndRewrite' をインポート
const { fetchAndRewrite } = require('./proxy.js');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// プロキシAPIのエンドポイント
// v1のようにGETリクエストでURLを渡す方式に変更（こちらの方が汎用性が高い）
app.get('/proxy', async (req, res) => {
    const { url } = req.query; // POSTのbodyではなく、GETのクエリパラメータからURLを取得
    if (!url) {
        return res.status(400).send('URL parameter is required.');
    }
    try {
        const result = await fetchAndRewrite(url);
        // ヘッダーとデータをレスポンスに設定
        res.set(result.headers).send(result.data);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// ルートURLへのアクセス
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
