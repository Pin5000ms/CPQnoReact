window.onload = async function () {
    let fileUrl = 'stp files/1551ABK.stp';
    let response = await fetch (fileUrl);
    let buffer = await response.arrayBuffer ();
    
    let fileBuffer = new Uint8Array (buffer);

    var worker = new Worker ('loaders/occt-import-js-worker.js');
    worker.onmessage = function (ev) {
        console.log (ev.data);
    }
    worker.postMessage ({
        format: 'step',
        buffer: fileBuffer,
        params: null
    });
};