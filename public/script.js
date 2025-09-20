// 同じサーバー内で通信するので、URLは /proxy という相対パスだけでOK
const PROXY_ENDPOINT = '/proxy';

const urlInput = document.getElementById('page-url');
const fetchButton = document.getElementById('fetch-button');
const loadingDiv = document.getElementById('loading');
const resultFrame = document.getElementById('result-frame');

fetchButton.addEventListener('click', async () => {
    const targetUrl = urlInput.value;
    if (!targetUrl) {
        alert('URLを入力してください。');
        return;
    }

    loadingDiv.classList.remove('hidden');
    resultFrame.srcdoc = '';

    try {
        const response = await fetch(PROXY_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url: targetUrl }),
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const htmlContent = await response.text();
        resultFrame.srcdoc = htmlContent;

    } catch (error) {
        console.error('Error:', error);
        alert(`ページの取得に失敗しました: ${error.message}`);
    } finally {
        loadingDiv.classList.add('hidden');
    }
});
