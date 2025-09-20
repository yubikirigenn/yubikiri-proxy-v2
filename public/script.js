// public/script.js の executeProxy関数を書き換える

const executeProxy = async (url) => {
    if (!url || !url.trim()) {
        alert('URLを入力してください。');
        return;
    }
    
    // iframeのsrcを直接プロキシURLに設定する
    // これにより、ブラウザの履歴も正しく機能しやすくなる
    resultFrame.src = `/proxy?url=${encodeURIComponent(url)}`;

    // UIの切り替え
    if (!content.classList.contains('visible')) {
        topLarge.style.opacity = '0';
        topLarge.style.transform = 'scale(0.9)';
        setTimeout(() => {
            topLarge.style.display = 'none';
            content.classList.add('visible');
            topSmall.style.top = '0';
        }, 300);
    }
};
