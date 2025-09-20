document.addEventListener('DOMContentLoaded', () => {
    // 定数
    const PROXY_ENDPOINT = '/proxy';

    // DOM要素の取得
    const topLarge = document.getElementById('top-large');
    const topSmall = document.getElementById('top-small');
    const content = document.getElementById('content');
    const resultFrame = document.getElementById('result-frame');

    const inputLarge = document.getElementById('url-input-large');
    const buttonLarge = document.getElementById('fetch-button-large');

    const inputSmall = document.getElementById('url-input-small');
    const buttonSmall = document.getElementById('fetch-button-small');

    // プロキシリクエストを実行するメイン関数
    const executeProxy = async (url) => {
        if (!url || !url.trim()) {
            alert('URLを入力してください。');
            return;
        }

        // iframeを空にしておく
        resultFrame.srcdoc = '<div style="color:#333; padding:20px;">読み込み中...</div>';
        
        // 初回実行時のUI切り替え
        if (!content.classList.contains('visible')) {
            topLarge.style.opacity = '0';
            topLarge.style.transform = 'scale(0.9)';
            setTimeout(() => {
                topLarge.style.display = 'none';
                content.classList.add('visible');
                topSmall.style.top = '0';
            }, 300); // CSSのtransition時間と合わせる
        }

        try {
            const response = await fetch(PROXY_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url: url }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `サーバーエラー: ${response.status}`);
            }

            const htmlContent = await response.text();
            resultFrame.srcdoc = htmlContent;

        } catch (error) {
            console.error('プロキシエラー:', error);
            resultFrame.srcdoc = `<div style="color:red; padding:20px;">ページの取得に失敗しました。<br>${error.message}</div>`;
        }
    };

    // イベントリスナーの設定
    buttonLarge.addEventListener('click', () => {
        executeProxy(inputLarge.value);
    });

    inputLarge.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            executeProxy(inputLarge.value);
        }
    });

    buttonSmall.addEventListener('click', () => {
        executeProxy(inputSmall.value);
    });

    inputSmall.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            executeProxy(inputSmall.value);
        }
    });

    // 2つの入力欄の値を同期させる
    inputLarge.addEventListener('input', () => {
        inputSmall.value = inputLarge.value;
    });
    inputSmall.addEventListener('input', () => {
        inputLarge.value = inputSmall.value;
    });
});
