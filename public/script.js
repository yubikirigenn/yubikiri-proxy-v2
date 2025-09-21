document.addEventListener('DOMContentLoaded', () => {
    // ... グローバル変数とDOM要素の取得は、前回の回答と全く同じ ...
    let proxiedActive = false;
    let hideTimer = null;
    const topLarge = document.getElementById('top-large');
    const topSmall = document.getElementById('top-small');
    const content = document.getElementById('content');
    const inputLarge = document.getElementById('url-input-large');
    const buttonLarge = document.getElementById('fetch-button-large');
    const inputSmall = document.getElementById('url-input-small');
    const buttonSmall = document.getElementById('fetch-button-small');


    // ... setTopSmallVisible関数は同じ ...
    const setTopSmallVisible = (visible) => {
        // ...
    };

    // ... loadInProxy関数は同じ ...
    const loadInProxy = async (url) => {
        // ...
    };

    // ... initTopBarAutoHide関数は同じ ...
    const initTopBarAutoHide = () => {
        // ...
    };


    // ★★★★★ ここからが、URL移動を実現するための新しいコードです ★★★★★

    /**
     * content div内のクリックを監視し、リンククリックを乗っ取る関数
     */
    const initLinkHijacking = () => {
        // content div全体にクリックイベントリスナーを1つだけ設定
        content.addEventListener('click', (event) => {
            // クリックされた要素（event.target）を取得
            let targetElement = event.target;

            // クリックされたのが<a>タグ（リンク）か、あるいは<a>タグの子要素かをチェック
            // <a>タグが見つかるまで、親要素をたどっていく (最大5階層まで)
            for (let i = 0; i < 5; i++) {
                if (targetElement && targetElement.tagName === 'A') {
                    break; // <a>タグが見つかった！
                }
                if (!targetElement || targetElement === content) {
                    targetElement = null; // content divまで来てしまったら終了
                    break;
                }
                targetElement = targetElement.parentElement;
            }

            // もし<a>タグが見つかったら...
            if (targetElement) {
                // 1. ブラウザの通常のページ遷移をキャンセル！
                event.preventDefault();

                // 2. リンクのhref属性から、プロキシ経由のURLを取得
                const proxiedUrl = targetElement.getAttribute('href');
                
                // 3. /proxy?url=... の形式になっているかを確認
                if (proxiedUrl && proxiedUrl.startsWith('/proxy?url=')) {
                    // 4. URLをデコードして、入力欄に表示する
                    try {
                        const decodedUrl = decodeURIComponent(proxiedUrl.substring('/proxy?url='.length));
                        if (inputSmall) inputSmall.value = decodedUrl;
                        if (inputLarge) inputLarge.value = decodedUrl;

                        // 5. 新しいページを読み込むために、loadInProxy関数を再実行！
                        loadInProxy(decodedUrl);

                    } catch (e) {
                        console.error('URLのデコードに失敗:', e);
                    }
                } else {
                    console.log('通常の外部リンク、または処理できないリンクです:', proxiedUrl);
                }
            }
        });
    };

    // --- イベントリスナーの設定（変更なし） ---
    // ...

    // --- 初期化処理 ---
    initTopBarAutoHide();
    initLinkHijacking(); // ★ 新しい関数をここで呼び出す！
});