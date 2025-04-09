import { ImportJsonData } from "./import/importer.js";


export function openFile() {
    
    
    var fileInput = document.getElementById('fileInput');
    
    
    fileInput.click();
    
    
    fileInput.addEventListener('change', function() {
        
        var selectedFile = fileInput.files[0];
        
        if (selectedFile) {
            
            var reader = new FileReader();
            
            
            reader.onload = function(event) {                
                
                var fileContentArrayBuffer = event.target.result;

                
                var byteArray = new Uint8Array(fileContentArrayBuffer);

                
                byteArrayToJsonData(byteArray);
            };
            
            
            reader.readAsArrayBuffer(selectedFile);
        }
    });
}


let worker = null;

function byteArrayToJsonData(byteArray) {

    if (worker) {
        worker.terminate();
    }


    worker = new Worker('./loaders/occt-import-js-worker.js');


    worker.onmessage = function(ev) {
        ImportJsonData(ev.data);
    };


    worker.postMessage({
        format: 'step',
        buffer: byteArray,
        params: null
    });
}


