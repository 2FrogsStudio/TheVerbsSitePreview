let installingWorker;
let waitingWorker;

function showUpdateBar() {
    document.getElementById('snackbar').classList.add('show');
}

document.getElementById('reload-button').addEventListener('click', function(){
    if (waitingWorker) {
        waitingWorker.postMessage({action: 'skipWaiting'});
    } else {
        document.getElementById('snackbar').classList.remove('show');
    }    
});

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js').then(reg => {
        reg.onupdatefound = () => {
            installingWorker = reg.installing;
            installingWorker.onstatechange = () => {
                if (!reg.waiting || !reg.active) {
                    return;
                }
                if (installingWorker.state !== 'installed' ||
                    installingWorker === reg.active) {
                    return;
                }
                waitingWorker = reg.waiting;
                showUpdateBar();
            };
        };

        if (reg.waiting) {
            waitingWorker = reg.waiting;
            showUpdateBar();
        }
    });

    let isReloaded;
    navigator.serviceWorker.addEventListener('controllerchange', function () {
        if (isReloaded) return;
        window.location.reload();
        isReloaded = true;
    });
}