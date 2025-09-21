document.addEventListener('DOMContentLoaded', () => {
    // --- グローバル変数 ---
    let proxiedActive = false;
    let hideTimer = null;

    // --- DOM要素の取得 ---
    const topLarge = document.getElementById('top-large');
    const topSmall = document.getElementById('top-small');
    // ★ iframeではなく、<div id="content"> を取得します
    const content = document.getElementById('content'); 
    const inputLarge = document.getElementById('url-input-large');
    const buttonLarge = document.getElementById('fetch-button-large');
    const inputSmall = document.getElementById('url-input-small');
    const buttonSmall = document.getElementById('fetch-button-small');

    // --- 関数定義 ---

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
     * @param {string} url - ユーザーが入力したURL
     */
    const loadInProxy = async (url) => { // asyncキーワードが必須です
        if (!url || !url.trim()) {
            alert('URLを入力してください。');
            return;
        }

        // URLまたは検索語から、実際にアクセスするターゲットURLを決定する
        let targetUrl = url;
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            if (url.includes('.') && !url.includes(' ')) {
                targetUrl = 'https://' + url;
            } else {
                targetUrl = `https://www.google.com/search?q=${encodeURIComponent(url)}`;
            }
        }
        
        // --- ここからが、v1の方式に戻すための重要な変更点です ---

        try {
            // 1. UIを「読み込み中」の状態にする
            if (!proxiedActive) {
                proxiedActive = true;
                topLarge.style.opacity = '0';
                topLarge.style.transform = 'scale(0.9)';
                setTimeout(() => {
                    topLarge.style.display = 'none';
                    // content divを表示状態にする（CSSの.visibleクラスを追加）
                    content.classList.add('visible');
                }, 300);
            }
            // content div の中身を「読み込み中」メッセージにする
            content.innerHTML = `<div style="padding: 24px; text-align: center; color: #eee; font-size: 1.2em;">読み込み中...</div>`;
            
            // 2. サーバーの/proxyエンドポイントに、fetchでリクエストを送る
            const response = await fetch(`/proxy?url=${encodeURIComponent(targetUrl)}`);

            // 3. レスポンスが正常かチェックする
            if (!response.ok) {
                // エラーだった場合、サーバーからのテキストをエラーメッセージとして表示
                const errorText = await response.text();
                throw new Error(`サーバーエラー: ${response.status} ${errorText}`);
            }

            // 4. レスポンスからHTMLテキストを取得する
            const html = await response.text();
            
            // 5. 取得したHTMLを、content divの中身として直接書き込む！
            content.innerHTML = html;

            // 読み込みが成功したので、上部バーを表示する
            setTopSmallVisible(true);

        } catch (error) {
            console.error('プロキシエラー:', error);
            // エラーが発生したら、エラーメッセージをcontent divに表示する
            content.innerHTML = `<div style="padding: 24px; color: #ff6b6b; font-size: 1.2em;">ページの取得に失敗しました。<br><br>${error.message}</div>`;
            // エラーが起きたら、初期画面に戻す準備
            proxiedActive = false;
            setTopSmallVisible(false);
            topLarge.style.display = '';
            topLarge.style.opacity = '1';
            topLarge.style.transform = 'none';
            content.classList.remove('visible');
        }
    };

    const initTopBarAutoHide = () => {
        document.addEventListener('mousemove', (e) => {
            if (!proxiedActive) return;
            if (e.clientY <= 80) { // 感度（降りてくる範囲）
                clearTimeout(hideTimer);
                setTopSmallVisible(true);
            } else {
                clearTimeout(hideTimer);
                hideTimer = setTimeout(() => setTopSmallVisible(false), 300); // 感度（隠れるまでの時間）
            }
        });
        document.addEventListener('mouseleave', () => {
            if (!proxiedActive) return;
            clearTimeout(hideTimer);
            hideTimer = setTimeout(() => setTopSmallVisible(false), 300);
        });
    };

    // --- イベントリスナーの設定（変更なし） ---

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

    // --- 初期化処理（変更なし） ---
    initTopBarAutoHide();
});