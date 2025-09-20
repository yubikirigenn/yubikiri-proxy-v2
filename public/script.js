document.addEventListener('DOMContentLoaded', () => {
    // --- グローバル変数 ---
    let proxiedActive = false; // プロキシでページが表示されているかを管理するフラグ
    let hideTimer = null; // バーを非表示にするためのタイマー

    // --- DOM要素の取得 ---
    const topLarge = document.getElementById('top-large');
    const topSmall = document.getElementById('top-small');
    const content = document.getElementById('content');
    const resultFrame = document.getElementById('result-frame');
    const inputLarge = document.getElementById('url-input-large');
    const buttonLarge = document.getElementById('fetch-button-large');
    const inputSmall = document.getElementById('url-input-small');
    const buttonSmall = document.getElementById('fetch-button-small');

    // --- 関数定義 ---

    /**
     * 上部バーの表示/非表示を制御する関数
     * @param {boolean} visible - 表示する場合はtrue, 非表示はfalse
     */
    const setTopSmallVisible = (visible) => {
        if (!topSmall) return;
        if (visible) {
            topSmall.style.top = '0';
        } else {
            // CSSで定義された高さ(-60px)まで押し上げる
            topSmall.style.top = '-60px'; 
        }
    };

    /**
     * URLをプロキシ経由でiframeに読み込むメイン関数
     * @param {string} url - ユーザーが入力したURL
     */
    const loadInProxy = (url) => {
        if (!url || !url.trim()) {
            alert('URLを入力してください。');
            return;
        }

        let targetUrl = url;
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            if (url.includes('.') && !url.includes(' ')) {
                targetUrl = 'https://' + url;
            } else {
                targetUrl = `https://www.google.com/search?q=${encodeURIComponent(url)}`;
            }
        }
        
        resultFrame.src = `/proxy?url=${encodeURIComponent(targetUrl)}`;

        if (topLarge && content && !content.classList.contains('visible')) {
            proxiedActive = true; // ★プロキシが有効になったことを記録
            topLarge.style.opacity = '0';
            topLarge.style.transform = 'scale(0.9)';
            setTimeout(() => {
                topLarge.style.display = 'none';
                content.classList.add('visible');
            }, 300);
        }
    };

    /**
     * 上部バーの自動表示/非表示イベントを初期化する関数
     */
    const initTopBarAutoHide = () => {
        document.addEventListener('mousemove', (e) => {
            // このフラグがtrueの時だけ自動表示/非表示を有効にする
            if (!proxiedActive) return;

            // 画面の上端40px以内に入ったら
            if (e.clientY <= 67) {
                clearTimeout(hideTimer); // 非表示タイマーをキャンセル
                setTopSmallVisible(true); // バーを表示
            } else {
                clearTimeout(hideTimer); // 既存のタイマーをリセット
                // 700ミリ秒後にバーを隠すタイマーをセット
                hideTimer = setTimeout(() => setTopSmallVisible(false), 700);
            }
        });

        // マウスがウィンドウから離れた時の処理
        document.addEventListener('mouseleave', () => {
            if (!proxiedActive) return;
            clearTimeout(hideTimer);
            hideTimer = setTimeout(() => setTopSmallVisible(false), 300);
        });
    };

    // --- イベントリスナーの設定 ---

    if (buttonLarge && inputLarge) {
        buttonLarge.addEventListener('click', () => loadInProxy(inputLarge.value));
        inputLarge.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') loadInProxy(inputLarge.value);
        });
    }

    if (buttonSmall && inputSmall) {
        buttonSmall.addEventListener('click', () => loadInProxy(inputSmall.value));
        inputSmall.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') loadInProxy(inputSmall.value);
        });
    }

    if(inputLarge && inputSmall){
        inputLarge.addEventListener('input', () => { inputSmall.value = inputLarge.value; });
        inputSmall.addEventListener('input', () => { inputLarge.value = inputLarge.value; });
    }

    // --- 初期化処理 ---
    initTopBarAutoHide(); // 自動表示/非表示機能を有効化
});