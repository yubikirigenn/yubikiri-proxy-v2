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
    // ★ テーマ切り替えボタンの要素もここで取得
    const themeSwitch = document.getElementById('theme-switch');

    // ==========================================================
    //  機能1：テーマ切り替え機能
    // ==========================================================
    
    /**
     * 指定されたテーマを適用し、設定をlocalStorageに保存する関数
     * @param {string} theme - 'light' または 'dark'
     */
    const applyTheme = (theme) => {
        if (theme === 'light') {
            document.body.classList.add('light-theme');
        } else {
            document.body.classList.remove('light-theme');
        }
        localStorage.setItem('theme', theme);
    };

    // テーマ切り替えボタンのクリックイベントを設定
    if (themeSwitch) {
        themeSwitch.addEventListener('click', () => {
            const isLight = document.body.classList.contains('light-theme');
            applyTheme(isLight ? 'dark' : 'light');
        });
    }

    // ==========================================================
    //  機能2：プロキシとUI制御機能
    // ==========================================================

    const setTopSmallVisible = (visible) => {
        if (!topSmall) return;
        if (visible) {
            topSmall.style.top = '0';
        } else {
            topSmall.style.top = '-60px';
        }
    };

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

    const initLinkHijacking = () => {
        content.addEventListener('click', (event) => {
            let targetElement = event.target;
            for (let i = 0; i < 5; i++) {
                if (targetElement && targetElement.tagName === 'A') break;
                if (!targetElement || targetElement === content) { targetElement = null; break; }
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
                    } catch (e) { console.error('URLのデコードに失敗:', e); }
                } else {
                    if (proxiedUrl && (proxiedUrl.startsWith('http') || proxiedUrl.startsWith('mailto:'))) {
                        window.open(proxiedUrl, '_blank');
                    }
                }
            }
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

    // 最初に、保存されたテーマを適用する
    const savedTheme = localStorage.getItem('theme') || 'dark';
    applyTheme(savedTheme);

    // 次に、各種イベントを初期化する
    initTopBarAutoHide();
    initLinkHijacking();
});