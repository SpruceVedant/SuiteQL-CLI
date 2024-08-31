document.addEventListener('DOMContentLoaded', () => {
    // Load query history and set up event listeners
    loadQueryHistory();

    document.getElementById('runQuery').addEventListener('click', () => {
        const query = document.getElementById('query').value;
        if (query) {
            saveQueryToHistory(query);
            runQuery(query);
        }
    });

    document.getElementById('queryHistory').addEventListener('change', (event) => {
        const selectedQuery = event.target.value;
        if (selectedQuery) {
            document.getElementById('query').value = selectedQuery;
        }
    });

    document.getElementById('runScript').addEventListener('click', () => {
        const script = document.getElementById('scriptSelect').value;
        if (script) {
            if (script === 'checkUnappliedPayments') {
                runUnappliedPaymentsCheck(); // Run the specific script
            }
        }
    });
});

function runQuery(query) {
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
}

function runUnappliedPaymentsCheck() {
    console.log('Running unapplied payments check...');

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];
        chrome.scripting.executeScript({
            target: { tabId: activeTab.id },
            func: () => {
                window.postMessage({ type: 'RUN_UNAPPLIED_PAYMENTS_CHECK' }, '*');
            }
        });
    });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'QUERY_RESULTS') {
        console.log('Received query results:', message.data);
        const results = JSON.parse(message.data);
        openResultsInNewWindow(results);
    } else if (message.type === 'UNAPPLIED_PAYMENTS_RESULT') {
        console.log('Received unapplied payments result:', message.data);
        document.getElementById('output').textContent = message.data;
    }
});

// Function to save the query to history
function saveQueryToHistory(query) {
    const history = JSON.parse(localStorage.getItem('queryHistory')) || [];
    if (!history.includes(query)) {
        history.unshift(query);
        if (history.length > 10) {
            history.pop(); 
        }
        localStorage.setItem('queryHistory', JSON.stringify(history));
        loadQueryHistory(); 
    }
}

// Load query history into the dropdown
function loadQueryHistory() {
    const history = JSON.parse(localStorage.getItem('queryHistory')) || [];
    const historyDropdown = document.getElementById('queryHistory');
    historyDropdown.innerHTML = '<option value="" disabled selected>Select a previous query...</option>'; // Reset options

    history.forEach(query => {
        const option = document.createElement('option');
        option.value = query;
        option.textContent = query.length > 50 ? query.substring(0, 47) + '...' : query;
        historyDropdown.appendChild(option);
    });
}

// Mapping of transaction types to their URL structures
const transactionUrlMapping = {
    SalesOrd: (id) => `https://td2929968.app.netsuite.com/app/accounting/transactions/salesord.nl?id=${id}&whence=`,
    RtnAuth: (id) => `https://td2929968.app.netsuite.com/app/accounting/transactions/rtnauth.nl?id=${id}&whence=`,
    // Add more transaction types as needed
};

// Function to determine the correct URL for the transaction
function getTransactionUrl(type, id) {
    if (transactionUrlMapping[type]) {
        return transactionUrlMapping[type](id);
    }
    return null;
}

function openResultsInNewWindow(results) {
    const newWindow = window.open('', '_blank', 'width=800,height=600');
    const doc = newWindow.document;

    doc.write('<html><head><title>Query Results</title></head><body>');
    doc.write('<h2>Query Results</h2>');

    const exportButtonHtml = `
        <div id="exportButtons" style="position: fixed; top: 10px; right: 10px;">
            <button id="exportToCSV">Export to CSV</button>
            <button id="exportToExcel">Export to Excel</button>
            <button id="exportToPDF">Export to PDF</button>
        </div>
    `;
    doc.write(exportButtonHtml);

    if (Array.isArray(results) && results.length > 0) {
        const table = doc.createElement('table');
        table.style.width = '100%';
        table.style.borderCollapse = 'collapse';
        table.style.border = '1px solid #ddd';

        const thead = doc.createElement('thead');
        const headerRow = doc.createElement('tr');
        Object.keys(results[0]).forEach(key => {
            const th = doc.createElement('th');
            th.style.border = '1px solid #ddd';
            th.style.padding = '8px';
            th.style.backgroundColor = '#007bff';
            th.style.color = 'white';
            th.textContent = key;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);

        const tbody = doc.createElement('tbody');
        results.forEach(result => {
            const row = doc.createElement('tr');
            Object.entries(result).forEach(([key, value]) => {
                const td = doc.createElement('td');
                td.style.border = '1px solid #ddd';
                td.style.padding = '8px';

                if (key === 'transaction' && result['type']) {
                    // Generate a URL based on the transaction type
                    const url = getTransactionUrl(result['type'], value);
                    if (url) {
                        const link = doc.createElement('a');
                        link.href = url;
                        link.target = '_blank';
                        link.textContent = value !== null ? value : '';
                        link.style.color = '#007bff';  // Blue color to indicate a link
                        link.style.textDecoration = 'underline';  // Underline the link
                        td.appendChild(link);
                    } else {
                        td.textContent = value !== null ? value : '';
                    }
                } else {
                    td.textContent = value !== null ? value : '';
                }

                row.appendChild(td);
            });
            tbody.appendChild(row);
        });
        table.appendChild(tbody);

        doc.body.appendChild(table);

        // Attach export functionality
        newWindow.exportToCSV = function() {
            const csvContent = results.map(row => Object.values(row).map(value => `"${value}"`).join(',')).join('\n');
            const csvBlob = new Blob([csvContent], { type: 'text/csv' });
            const csvUrl = URL.createObjectURL(csvBlob);

            const a = doc.createElement('a');
            a.href = csvUrl;
            a.download = 'query_results.csv';
            a.click();
        };

        newWindow.exportToExcel = function() {
            const excelContent = `
                <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
                <head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Sheet 1</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>
                <body>
                <table>
                    ${results.map(row => '<tr>' + Object.values(row).map(value => `<td>${value}</td>`).join('') + '</tr>').join('')}
                </table>
                </body>
                </html>`;
            const excelBlob = new Blob([excelContent], { type: 'application/vnd.ms-excel' });
            const excelUrl = URL.createObjectURL(excelBlob);

            const a = doc.createElement('a');
            a.href = excelUrl;
            a.download = 'query_results.xls';
            a.click();
        };

        newWindow.exportToPDF = function() {
            const doc = new jsPDF();
            const rows = results.map(row => Object.values(row));
            doc.autoTable({ head: [Object.keys(results[0])], body: rows });
            doc.save('query_results.pdf');
        };
