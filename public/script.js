document.addEventListener('DOMContentLoaded', () => {
    // DOM要素の取得（HTMLのIDと完全に一致させる）
    const topLarge = document.getElementById('top-large');
    const topSmall = document.getElementById('top-small');
    const content = document.getElementById('content');
    const resultFrame = document.getElementById('result-frame');

    const inputLarge = document.getElementById('url-input-large');
    const buttonLarge = document.getElementById('fetch-button-large');

    const inputSmall = document.getElementById('url-input-small');
    const buttonSmall = document.getElementById('fetch-button-small');

    /**
     * URLをプロキシ経由でiframeに読み込むメイン関数
     * @param {string} url - ユーザーが入力したURL
     */
    const loadInProxy = (url) => {
        if (!url || !url.trim()) {
            alert('URLを入力してください。');
            return;
        }

        // 検索語だった場合、Google検索のURLに変換する
        let targetUrl = url;
        if (!url.includes('.') || url.includes(' ')) {
             if(!url.startsWith('http://') && !url.startsWith('https://')){
                targetUrl = `https://www.google.com/search?q=${encodeURIComponent(url)}`;
             }
        }
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            targetUrl = 'https://' + url;
        }

        // iframeのsrcを、サーバーの/proxyエンドポイントに設定する
        // これでコンテンツの読み込みが開始される
        resultFrame.src = `/proxy?url=${encodeURIComponent(targetUrl)}`;

        // 初回実行時にUIを切り替える
        if (topLarge && content && !content.classList.contains('visible')) {
            topLarge.style.opacity = '0';
            topLarge.style.transform = 'scale(0.9)';
            setTimeout(() => {
                topLarge.style.display = 'none';
                content.classList.add('visible');
                if (topSmall) {
                    topSmall.style.top = '0';
                }
            }, 300); // CSSのtransition時間と合わせる
        }
    };

    // --- イベントリスナーの設定 ---

    // 大きな入力フォーム
    if (buttonLarge && inputLarge) {
        buttonLarge.addEventListener('click', () => {
            loadInProxy(inputLarge.value);
        });
        inputLarge.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                loadInProxy(inputLarge.value);
            }
        });
    }

    // 小さな入力フォーム
    if (buttonSmall && inputSmall) {
        buttonSmall.addEventListener('click', () => {
            loadInProxy(inputSmall.value);
        });
        inputSmall.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                loadInProxy(inputSmall.value);
            }
        });
    }

    // 2つの入力欄の値を同期させる
    if(inputLarge && inputSmall){
        inputLarge.addEventListener('input', () => {
            inputSmall.value = inputLarge.value;
        });
        inputSmall.addEventListener('input', () => {
            inputLarge.value = inputSmall.value;
        });
    }
});