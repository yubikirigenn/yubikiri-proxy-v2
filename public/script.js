document.addEventListener('DOMContentLoaded', () => {
    let proxiedActive = false;
    let hideTimer = null;
    const themeSwitchTop = document.getElementById('theme-switch-top');
    const themeSwitchBar = document.getElementById('theme-switch-bar');
    const topLarge = document.getElementById('top-large');
    const topSmall = document.getElementById('top-small');
    const content = document.getElementById('content');
    const inputLarge = document.getElementById('url-input-large');
    const buttonLarge = document.getElementById('fetch-button-large');
    const inputSmall = document.getElementById('url-input-small');
    const buttonSmall = document.getElementById('fetch-button-small');

    const applyTheme = (theme) => {
        if (theme === 'light') {
            document.body.classList.add('light-theme');
        } else {
            document.body.classList.remove('light-theme');
        }
        localStorage.setItem('theme', theme);
    };
    const handleThemeSwitch = () => {
        const isLight = document.body.classList.contains('light-theme');
        applyTheme(isLight ? 'dark' : 'light');
    };
    if (themeSwitchTop) themeSwitchTop.addEventListener('click', handleThemeSwitch);
    if (themeSwitchBar) themeSwitchBar.addEventListener('click', handleThemeSwitch);

    const setTopSmallVisible = (visible) => {
        if (!topSmall) return;
        if (visible) {
            topLarge.style.top = '0';
        } else {
            topSmall.style.top = '-80px';
        }
    };

    const loadInProxy = async (url) => {
        if (!url || !url.trim()) {
            alert('URLを入力してください。');
            return;
        }
        let targetUrl = url.trim();
        function isValidHttpUrl(string) {
            try {
                const urlObject = new URL(string);
                return urlObject.protocol === "http:" || urlObject.protocol === "https:";
            } catch (_) { return false; }
        }
        if (!isValidHttpUrl(targetUrl)) {
            if (targetUrl.includes('.') && !targetUrl.includes(' ')) {
                targetUrl = 'https://' + targetUrl;
            } else {
                targetUrl = `https://www.google.com/search?q=${encodeURIComponent(targetUrl)}`;
            }
        }
        
        try {
            if (!proxiedActive) {
                proxiedActive = true;
                if (themeSwitchTop) themeSwitchTop.classList.add('hidden');
                if (topLarge) topLarge.style.display = 'none';
                if (content) content.classList.add('visible');
            }
            content.innerHTML = `<div style="padding: 24px; text-align: center; color: var(--text-color); background-color: var(--bg-color); font-size: 1.2em; height: 100%; box-sizing: border-box;">読み込み中...</div>`;
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
            content.innerHTML = `<div style="padding: 24px; color: #ff6b6b; background-color: var(--bg-color); font-size: 1.2em; height: 100%; box-sizing: border-box;">ページの取得に失敗しました。<br><br>${error.message}</div>`;
            if (themeSwitchTop) themeSwitchTop.classList.remove('hidden');
            proxiedActive = false;
            setTopSmallVisible(false);
            if (topLarge) topLarge.style.display = 'block';
            if (content) content.classList.remove('visible');
        }
    };

    const initTopBarAutoHide = () => { /* ... (変更なし) ... */ };
    const initLinkHijacking = () => { /* ... (変更なし) ... */ };
    if (buttonLarge && inputLarge) { /* ... (変更なし) ... */ }
    if (buttonSmall && inputSmall) { /* ... (変更なし) ... */ }
    if(inputLarge && inputSmall){ /* ... (変更なし) ... */ }

    const savedTheme = localStorage.getItem('theme') || 'dark';
    applyTheme(savedTheme);
    initTopBarAutoHide();
    initLinkHijacking();
});