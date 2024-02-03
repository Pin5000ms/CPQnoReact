import { Load } from "./viewer.js";
import { TestImportNode } from "./importnode.js";


export function openFile() {
    
    // 選擇文件輸入元素
    var fileInput = document.getElementById('fileInput');
    
    // 模擬點擊文件輸入元素
    fileInput.click();
    
    // 監聽文件選擇事件
    fileInput.addEventListener('change', function() {
        // 獲取選擇的文件
        var selectedFile = fileInput.files[0];
        
        if (selectedFile) {
            // 建立文件讀取器
            var reader = new FileReader();
            
            // 設置讀取器加載完成的回調函數
            reader.onload = function(event) {                
                // 獲取文件內容 (以 ArrayBuffer 形式)
                var fileContentArrayBuffer = event.target.result;

                // 將 ArrayBuffer 轉換為 byte array
                var byteArray = new Uint8Array(fileContentArrayBuffer);

                // 將 byte array 傳遞給 JavaScript 函數
                byteArrayToJsonData(byteArray);
            };
            
            // 讀取文件內容 (以 ArrayBuffer 形式)
            reader.readAsArrayBuffer(selectedFile);
        }
    });
}

// 範例JavaScript函數，用於處理文件內容
function byteArrayToJsonData(byteArray) {
    // 在這裡處理文件內容，例如顯示在控制台或顯示在網頁上
    //console.log("文件內容:", content);

    var worker = new Worker ('./loaders/occt-import-js-worker.js');
    worker.onmessage = function (ev) {
        //console.log (ev.data);
        Load(ev.data)
        TestImportNode(ev.data)
    }
    worker.postMessage ({
        format: 'step',
        buffer: byteArray,
        params: null
    });


    // const occtimportjs = require ('js/occt-import-js.js')();

    // occtimportjs.then ((occt) => {
    //     let result = occt.ReadStepFile (byteArray, null);
    //     Load(result)
    // });
}


