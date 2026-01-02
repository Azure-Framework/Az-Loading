window.addEventListener('message', (event) => {
    if (event.data.action === 'updateStats') {
        const d = event.data.data;
        document.getElementById('char-count').innerText = d.characters || 0;
        document.getElementById('cash').innerText = `$${(d.cash || 0).toLocaleString()}`;
        document.getElementById('bank').innerText = `$${(d.bank || 0).toLocaleString()}`;
        document.getElementById('jail').innerText = d.jail || 0;
        document.getElementById('biz').innerText = d.businesses || 0;
        document.getElementById('parked').innerText = d.parked || 0;
    }
});
