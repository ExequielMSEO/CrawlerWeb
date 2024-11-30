document.addEventListener('DOMContentLoaded', () => {
    const urlInput = document.getElementById('urlInput');
    const crawlButton = document.getElementById('crawlButton');
    const downloadButton = document.getElementById('downloadButton');
    const urlTableBody = document.getElementById('urlTableBody');
    const status = document.getElementById('status');
    const progress = document.getElementById('progress');
    
    let crawledUrls = [];

    crawlButton.addEventListener('click', async () => {
        const url = urlInput.value.trim();
        if (!url) {
            alert('Please enter a valid URL');
            return;
        }

        // Reset UI
        crawledUrls = [];
        urlTableBody.innerHTML = '';
        downloadButton.disabled = true;
        crawlButton.disabled = true;
        status.textContent = 'Crawling...';
        progress.style.width = '0%';

        try {
            const response = await fetch('/crawl', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url }),
            });

            if (!response.ok) {
                throw new Error('Crawling failed');
            }

            const data = await response.json();
            crawledUrls = data.urls;
            
            // Update table
            crawledUrls.forEach(({ url, level }) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${url}</td>
                    <td>${level}</td>
                `;
                urlTableBody.appendChild(row);
            });

            status.textContent = `Crawling complete! Found ${crawledUrls.length} URLs`;
            downloadButton.disabled = false;
            progress.style.width = '100%';
        } catch (error) {
            status.textContent = 'Error: ' + error.message;
        } finally {
            crawlButton.disabled = false;
        }
    });

    downloadButton.addEventListener('click', () => {
        const content = crawledUrls.map(({ url, level }) => `${url},${level}`).join('\n');
        const blob = new Blob([content], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'crawled_urls.txt';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    });
});
