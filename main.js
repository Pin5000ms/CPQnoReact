import { openFile } from "./openFile.js";

document.getElementById('executeButton').addEventListener('click', function() {
    // 调用 openFile.js 中的 openFile 函数
    openFile();
});