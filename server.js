// server.js
const express = require('express');
const path = require('path');
const { fetchAndRewrite } = require('./proxy.js');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.get('/proxy', async (req, res) => {
    const { url } = req.query;
    if (!url) {
        return res.status(400).send('URL parameter is required.');
    }
    try {
        const result = await fetchAndRewrite(url);
        // proxy.jsから返されたステータスコード、ヘッダー、データを設定
        res.status(result.status).set(result.headers).send(result.data);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});