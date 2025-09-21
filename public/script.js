document.addEventListener('DOMContentLoaded', () => {
    // --- グローバル変数 ---
    let proxiedActive = false;
    let hideTimer = null;

    // --- DOM要素の取得 ---
    const topLarge = document.getElementById('top-large');
    const topSmall = document.getElementById('top-small');
    const content = document.getElementById('content');
    const inputLarge = document.getElementById('url-input-large');
    const buttonLarge = document.getElementById('fetch-button-large');
    const inputSmall = document.getElementById('url-input-small');
    const buttonSmall = document.getElementById('fetch-button-small');

    // --- 関数定義 ---

    /**
     * 上部バーの表示/非表示を制御する関数
     */
    const setTopSmallVisible = (visible) => {
        if (!topSmall) return;
        if (visible) {
            topSmall.style.top = '0';
        } else {
            topSmall.style.top = '-60px';
        }
    };

    /**
     * URLをプロキシ経由で取得し、divに内容を注入するメイン関数
     * (この関数は省略されていませんでした)
     */
    const loadInProxy = async (url) => {
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
        
        try {
            if (!proxiedActive) {
                proxiedActive = true;
                topLarge.style.opacity = '0';
                topLarge.style.transform = 'scale(0.9)';
                setTimeout(() => {
                    topLarge.style.display = 'none';
                    content.classList.add('visible');
                }, 300);
            }
            content.innerHTML = `<div style="padding: 24px; text-align: center; color: #eee; font-size: 1.2em;">読み込み中...</div>`;
            
            const response = await fetch(`/proxy?url=${encodeURIComponent(targetUrl)}`);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`サーバーエラー: ${response.status} ${errorText}`);
            }

            const html = await response.text();
            content.innerHTML = html;

            setTopSmallVisible(true);

        } catch (error) {
            console.error('プロキシエラー:', error);
            content.innerHTML = `<div style="padding: 24px; color: #ff6b6b; font-size: 1.2em;">ページの取得に失敗しました。<br><br>${error.message}</div>`;
            proxiedActive = false;
            setTopSmallVisible(false);
            topLarge.style.display = '';
            topLarge.style.opacity = '1';
            topLarge.style.transform = 'none';
            content.classList.remove('visible');
        }
    };

    /**
     * 上部バーの自動表示/非表示イベントを初期化する関数
     * (この関数は省略されていませんでした)
     */
    const initTopBarAutoHide = () => {
        document.addEventListener('mousemove', (e) => {
            if (!proxiedActive) return;
            if (e.clientY <= 80) {
                clearTimeout(hideTimer);
                setTopSmallVisible(true);
            } else {
                clearTimeout(hideTimer);
                hideTimer = setTimeout(() => setTopSmallVisible(false), 300);
            }
        });
        document.addEventListener('mouseleave', () => {
            if (!proxiedActive) return;
            clearTimeout(hideTimer);
            hideTimer = setTimeout(() => setTopSmallVisible(false), 300);
        });
    };

    /**
     * content div内のクリックを監視し、リンククリックを乗っ取る関数
     * (この関数は新しく追加したものです)
     */
    const initLinkHijacking = () => {
        content.addEventListener('click', (event) => {
            let targetElement = event.target;
            for (let i = 0; i < 5; i++) {
                if (targetElement && targetElement.tagName === 'A') break;
                if (!targetElement || targetElement === content) {
                    targetElement = null;
                    break;
                }
                targetElement = targetElement.parentElement;
            }

            if (targetElement) {
                event.preventDefault();
                const proxiedUrl = targetElement.getAttribute('href');
                
                if (proxiedUrl && proxiedUrl.startsWith('/proxy?url=')) {
                    try {
                        const decodedUrl = decodeURIComponent(proxiedUrl.substring('/proxy?url='.length));
                        if (inputSmall) inputSmall.value = decodedUrl;
                        if (inputLarge) inputLarge.value = decodedUrl;
                        loadInProxy(decodedUrl);
                    } catch (e) {
                        console.error('URLのデコードに失敗:', e);
                    }
                } else {
                    // 外部リンクやmailto:などを新しいタブで開く
                    if (proxiedUrl && (proxiedUrl.startsWith('http') || proxiedUrl.startsWith('mailto:'))) {
                        window.open(proxiedUrl, '_blank');
                    }
                    console.log('処理できないリンクです:', proxiedUrl);
                }
            }
        });
    };

    // --- イベントリスナーの設定 ---
    // ★★★★★ おそらく、この部分が私の前回の説明で省略されていました ★★★★★
    
    // 大きな入力フォームのイベントリスナー
    if (buttonLarge && inputLarge) {
        buttonLarge.addEventListener('click', () => loadInProxy(inputLarge.value));
        inputLarge.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') loadInProxy(inputLarge.value);
        });
    }

    // 小さな入力フォームのイベントリスナー
    if (buttonSmall && inputSmall) {
        buttonSmall.addEventListener('click', () => loadInProxy(inputSmall.value));
        inputSmall.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') loadInProxy(inputSmall.value);
        });
    }

    // 2つの入力欄の値を同期させるイベントリスナー
    if(inputLarge && inputSmall){
        inputLarge.addEventListener('input', () => { inputSmall.value = inputLarge.value; });
        inputSmall.addEventListener('input', () => { inputLarge.value = inputLarge.value; });
    }

    // --- 初期化処理 ---
    initTopBarAutoHide();
    initLinkHijacking();
});