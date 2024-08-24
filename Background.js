document.getElementById('runQuery').addEventListener('click', () => {
    const query = document.getElementById('query').value;
    console.log('Sending query:', query);

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];
        chrome.scripting.executeScript({
            target: { tabId: activeTab.id },
            func: (query) => {
                window.postMessage({ type: 'RUN_QUERY', query: query }, '*');
            },
            args: [query]
        });
    });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'QUERY_RESULTS') {
        console.log('Received query results:', message.data);
        const results = JSON.parse(message.data);
        displayResultsInTable(results);
    }
});

function displayResultsInTable(results) {
    const output = document.getElementById('output');
    output.innerHTML = '';  // Clear previous results

    if (Array.isArray(results) && results.length > 0) {
        const table = document.createElement('table');
        table.className = 'results-table';

        // Create table header
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        Object.keys(results[0]).forEach(key => {
            const th = document.createElement('th');
            th.textContent = key;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);
