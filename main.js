import { openFile } from "./openFile.js";
import { BuildScene } from "./viewer.js";

document.getElementById('executeButton').addEventListener('click', function() {
    openFile();
});

BuildScene();