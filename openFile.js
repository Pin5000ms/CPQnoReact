function openFile() {
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
                processFileContent(byteArray);
            };
            
            // 讀取文件內容 (以 ArrayBuffer 形式)
            reader.readAsArrayBuffer(selectedFile);
        }
    });
}

// 範例JavaScript函數，用於處理文件內容
function processFileContent(byteArray) {
    // 在這裡處理文件內容，例如顯示在控制台或顯示在網頁上
    //console.log("文件內容:", content);

    var worker = new Worker ('loaders/occt-import-js-worker.js');
    worker.onmessage = function (ev) {
        console.log (ev.data);
        Load(ev.data)
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


const width = window.innerWidth;
const height = window.innerHeight;
var scene, renderer, camera, group;

async function Load(jsonData) {

    // Remove the existing renderer DOM element if it exists
    const existingRendererElement = document.querySelector('canvas');
    if (existingRendererElement) {
        document.body.removeChild(existingRendererElement);
    }

    // Initialize Three.js scene, camera, and renderer
    scene = new THREE.Scene();
    // const directionalLight = new THREE.DirectionalLight (0x888888);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1); // White light with intensity 1
    directionalLight.position.set(1, 1, 1); // Set the position of the light
    scene.add(directionalLight);

    const ambientLight = new THREE.AmbientLight(0x444444);
    scene.add(ambientLight);

    const backgroundLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1); // Sky color, ground color, intensity
    scene.add(backgroundLight);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setClearColor(0xffffff); // background color
    document.body.appendChild(renderer.domElement);

    const mainObject = new THREE.Object3D();
    LoadGeometry(mainObject, jsonData);
    scene.add(mainObject);

    // Calculate the bounding box of the loaded geometry
    const bbox = new THREE.Box3().setFromObject(mainObject);

    // Calculate the center of the bounding box
    const center = new THREE.Vector3();
    bbox.getCenter(center);

    // Calculate the size of the bounding box
    const size = new THREE.Vector3();
    bbox.getSize(size);

    // Calculate the maximum dimension of the bounding box
    const maxDimension = Math.max(size.x, size.y, size.z);

    // Calculate the distance from the camera to the object based on the maximum dimension
    const distance = maxDimension * 2;

    // Calculate the far value based on the distance to the object
    const farValue = distance + maxDimension;

    camera = new THREE.PerspectiveCamera(75, width / height, 0.1, farValue);
    // Set the camera position and look at the center of the bounding box
    camera.position.set(center.x, center.y, center.z + maxDimension);
    camera.lookAt(center);

    // Add OrbitControls
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // Enable smooth camera movement
    controls.dampingFactor = 0.05; // Set the damping factor for the controls
    controls.enableZoom = true;
    controls.enableRotate = true;
    controls.enablePan = true;
    controls.screenSpacePanning = false; // Disable panning in screen space

    // Render the scene
    function animate() {
        requestAnimationFrame(animate);
        controls.update(); // Update the OrbitControls
        renderer.render(scene, camera);
    }
    animate();
}

async function LoadGeometry(targetObject, jsonData) {
    prepareGroup(targetObject, jsonData);
}

function prepareGroup(targetObject, result) {
    // process the geometries of the result
    group = new THREE.Group();
    var i = 0;
    for (let resultMesh of result.meshes) {
        const { mesh, edges } = BuildMesh(resultMesh, true);
        
        // Generate a unique name for each mesh
        const uniqueName = resultMesh.name + "_" + i;
        resultMesh.name = uniqueName;
        i++;

        group.add(mesh);
        if (edges) {
            group.add(edges);
        }
    }
    targetObject.add(group);
    updateMeshDataDisplay();
}

function BuildMesh(geometryMesh, showEdges) {
    let geometry = new THREE.BufferGeometry();

    geometry.setAttribute("position", new THREE.Float32BufferAttribute(geometryMesh.attributes.position.array, 3));
    if (geometryMesh.attributes.normal) {
        geometry.setAttribute("normal", new THREE.Float32BufferAttribute(geometryMesh.attributes.normal.array, 3));
    }
    geometry.name = geometryMesh.name;
    const index = Uint32Array.from(geometryMesh.index.array);
    geometry.setIndex(new THREE.BufferAttribute(index, 1));

    const outlineMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
    const defaultMaterial = new THREE.MeshPhongMaterial({
        color: geometryMesh.color ? new THREE.Color(geometryMesh.color[0], geometryMesh.color[1], geometryMesh.color[2]) : 0xcccccc,
        specular: 0,
    });
    let materials = [defaultMaterial];
    const edges = showEdges ? new THREE.Group() : null;
    if (geometryMesh.brep_faces && geometryMesh.brep_faces.length > 0) {
        for (let faceColor of geometryMesh.brep_faces) {
            const color = faceColor.color ? new THREE.Color(faceColor.color[0], faceColor.color[1], faceColor.color[2]) : defaultMaterial.color;
            materials.push(new THREE.MeshPhongMaterial({ color: color, specular: 0 }));
        }
        const triangleCount = geometryMesh.index.array.length / 3;
        let triangleIndex = 0;
        let faceColorGroupIndex = 0;
        while (triangleIndex < triangleCount) {
            const firstIndex = triangleIndex;
            let lastIndex = null;
            let materialIndex = null;
            if (faceColorGroupIndex >= geometryMesh.brep_faces.length) {
                lastIndex = triangleCount;
                materialIndex = 0;
            } else if (triangleIndex < geometryMesh.brep_faces[faceColorGroupIndex].first) {
                lastIndex = geometryMesh.brep_faces[faceColorGroupIndex].first;
                materialIndex = 0;
            } else {
                lastIndex = geometryMesh.brep_faces[faceColorGroupIndex].last + 1;
                materialIndex = faceColorGroupIndex + 1;
                faceColorGroupIndex++;
            }
            geometry.addGroup(firstIndex * 3, (lastIndex - firstIndex) * 3, materialIndex);
            triangleIndex = lastIndex;

            if (edges) {
                const innerGeometry = new THREE.BufferGeometry();
                innerGeometry.setAttribute("position", geometry.attributes.position);
                if (geometryMesh.attributes.normal) {
                    innerGeometry.setAttribute("normal", geometry.attributes.normal);
                }
                innerGeometry.setIndex(new THREE.BufferAttribute(index.slice(firstIndex * 3, lastIndex * 3), 1));
                const innerEdgesGeometry = new THREE.EdgesGeometry(innerGeometry, 180);
                const edge = new THREE.LineSegments(innerEdgesGeometry, outlineMaterial);
                edges.add(edge);
            }
        }
    }

    const mesh = new THREE.Mesh(geometry, materials.length > 1 ? materials : materials[0]);
    mesh.name = geometryMesh.name;

    if (edges) {
        edges.renderOrder = mesh.renderOrder + 1;
    }

    return { mesh, geometry, edges };
}

function updateMeshDataDisplay() {
    const meshDataContainer = document.getElementById("meshDataContainer");
    meshDataContainer.innerHTML = "";

    group.children.forEach((child, index) => {
        if (child instanceof THREE.Mesh) {
            const { name, type, uuid } = child;
            const meshDataItem = document.createElement("div");

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.checked = true; // Set the checkbox as checked by default
            meshDataItem.appendChild(checkbox);
    
            const button = document.createElement("button");
            button.textContent = "Move Down"; // Modify the button text as needed
            meshDataItem.appendChild(button);
    
            const label = document.createElement("label");
            label.textContent = name;
            meshDataItem.appendChild(label);
    
            meshDataContainer.appendChild(meshDataItem);

            checkbox.addEventListener("change", function () {
                if (!checkbox.checked) {
                    // Make mesh invisible
                    child.visible = false;
                    // Check if there is a child after the mesh
                    if (index < group.children.length - 1) {
                        let edge = group.children[index + 1];
                        // Process the edges
                        edge.visible = false;
                    }
                } else {
                    // Make mesh visible
                    child.visible = true;
                    // Check if there is a child after the mesh
                    if (index < group.children.length - 1) {
                        var edge = group.children[index + 1];
                        // Process the edges
                        edge.visible = true;
                    }
                }
                renderer.render(scene, camera);
            });
    
            button.addEventListener("click", function () {
                // Move the mesh down
                child.position.y -= 1; // Adjust the value as needed
                // Check if there is a child after the mesh
                if (index < group.children.length - 1) {
                    var edge = group.children[index + 1];
                    // Process the edges
                    edge.position.y += -1;
                }
                renderer.render(scene, camera);
            });
        }
    });

    const checkboxes = document.querySelectorAll("#meshDataContainer input[type='checkbox']");

    const hideAllBtn = document.getElementById("hide_all");
    hideAllBtn.addEventListener("click", function () {
        group.children.forEach((child) => {
            child.visible = false;
        });
        checkboxes.forEach((checkbox) => {
            checkbox.checked = false;
        });
    });

    const showAllBtn = document.getElementById("show_all");
    showAllBtn.addEventListener("click", function () {
        group.children.forEach((child) => {
            child.visible = true;
        });
        checkboxes.forEach((checkbox) => {
            checkbox.checked = true;
        });
    });
    
    const disablEdgesBtn = document.getElementById("disable_edges");
    disablEdgesBtn.addEventListener("click", function () {
        group.children.forEach((child, index) => {
            if (child instanceof THREE.Mesh) {
                if (index < group.children.length - 1) {
                    var edge = group.children[index + 1];
                    // Process the edges
                    edge.visible = false;
                }
            }
        });
    });
}