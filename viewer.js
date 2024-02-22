import * as THREE from './jsm/three.module.js'
import { OrbitControls } from './jsm/OrbitControls.js'
import { RGBColor} from './model/color.js'
import { CreateHighlightMaterials } from './threejs/threeutils.js';

const width = 700;
const height = 500;
var scene, renderer, camera, group;
let mainObject = new THREE.Object3D();
let edgeObject = new THREE.Object3D();

// 创建射线投射器
var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();
var modelViewDiv = document.getElementById('modelViewDiv');

export function LoadfromJsonData(jsonData) {

    var modelViewDiv = document.getElementById('modelViewDiv');
    // Remove the existing renderer DOM element if it exists
    const existingRendererElement = document.querySelector('canvas');
    if (existingRendererElement) {
        modelViewDiv.removeChild(existingRendererElement);
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
    renderer.setClearColor(0x000000); // background color

    if(modelViewDiv)
        modelViewDiv.appendChild(renderer.domElement);

    mainObject = new THREE.Object3D();

    
    LoadGeometry(mainObject, jsonData);



    scene.add(mainObject);
    console.log(mainObject);

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
    const controls = new OrbitControls(camera, renderer.domElement);
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


export function LoadfromObject3D(_mainObject) {
    mainObject = _mainObject;

    

    BuildScene();


    GenerateEdges();
    


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
    const controls = new OrbitControls(camera, renderer.domElement);
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

function BuildScene(){

    // Remove the existing renderer DOM element if it exists
    const existingRendererElement = document.querySelector('canvas');
    if (existingRendererElement) {
        modelViewDiv.removeChild(existingRendererElement);
    }

    // Initialize Three.js scene, camera, and renderer
    scene = new THREE.Scene();
    // const directionalLight = new THREE.DirectionalLight (0x888888);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1); // White light with intensity 1
    directionalLight.position.set(1, 1, 1); // Set the position of the light
    scene.add(directionalLight);

    //var axesHelper = new THREE.AxesHelper( 100 );
    //scene.add( axesHelper );

    const ambientLight = new THREE.AmbientLight(0x444444);
    scene.add(ambientLight);

    const backgroundLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1); // Sky color, ground color, intensity
    scene.add(backgroundLight);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000); // background color

    

    if(modelViewDiv)
    {
        modelViewDiv.appendChild(renderer.domElement);
    }
        

    scene.add(mainObject);
}


function GenerateEdges(){
    // 监听鼠标点击事件
    modelViewDiv.addEventListener('click', onMouseClick, false);

    //Add Edge
    EnumerateMeshes ((mesh) => {
        let edges = new THREE.EdgesGeometry (mesh.geometry);
        let line = new THREE.LineSegments (edges, new THREE.LineBasicMaterial ({
            color: 0x000000
        }));

        line.applyMatrix4 (mesh.matrixWorld);
        line.userData = mesh.userData;
        line.visible = mesh.visible;

        let positions = line.geometry.attributes.position;
        console.log(positions.count)


        let positions2 = mesh.geometry.attributes.position;
        console.log(positions2.count)

        let points = [];
        for (let i = 0; i < positions.count; i++) {
            let vertex = new THREE.Vector3().fromBufferAttribute(positions, i);
            if (isNaN(vertex.x) || isNaN(vertex.y) || isNaN(vertex.z)) {
                console.log('Vector contains NaN values');
            } else {
                points.push(vertex);
            }
        }

        //let threshold = 0.1; // 定义距离的阈值
        //let result = isCircle(points, threshold);

        CreateLine(positions, line);

        // if (result.isCircle) {
        //     CreateLine(positions, new THREE.LineBasicMaterial({ color: 0xFFFFFF }));
        // } else {
        //     CreateLine(positions, line.material);
        // }

        

        
    });
    scene.add(edgeObject);
    
}

function CreateLine(positions, line){
    
    // 假设 line 是要拆分的线段对象
    let lineSegments = [];  

    // 遍历属性缓冲区中的顶点位置
    for (let i = 0; i < positions.count; i += 2) {
        // 获取每个顶点的位置
        let vertex1 = new THREE.Vector3().fromBufferAttribute(positions, i);
        let vertex2 = new THREE.Vector3().fromBufferAttribute(positions, i + 1);

        // 创建两个顶点组成的几何体
        let geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
            vertex1.x, vertex1.y, vertex1.z,
            vertex2.x, vertex2.y, vertex2.z
        ]), 3));

        // 使用这两个顶点创建新的线段对象,使用现有材质的副本创建新的材质
        let singleLine = new THREE.Line(geometry, line.material.clone());

        singleLine.userData = line.userData;
        singleLine.visible = line.visible;

        // 将新的线段对象添加到数组中
        lineSegments.push(singleLine);

        
    }

    // 将拆分后的线段对象添加到场景中
    lineSegments.forEach(function(singleLine){
        edgeObject.add(singleLine);
    });
}


function isCircle(points, threshold) {
    // 计算几何中心
    let center = new THREE.Vector3();
    for (let i = 0; i < points.length; i++) {
        center.add(points[i]);
    }
    center.divideScalar(points.length);

    // 计算每个点到几何中心的距离
    let distances = [];
    for (let i = 0; i < points.length; i++) {
        let distance = points[i].distanceTo(center);
        distances.push(distance);
    }

    // 判断距离是否相等
    for (let i = 1; i < distances.length; i++) {
        if (Math.abs(distances[i] - distances[0]) > threshold) {
            return { isCircle: false, radius: null };
        }
    }

    // 计算近似半径
    let sum = distances.reduce((acc, cur) => acc + cur, 0);
    let averageDistance = sum / distances.length;

    return { isCircle: true, radius: averageDistance };
}



export function UpdateMeshesSelection (meshInstanceId)
{
    let highlightColor = new RGBColor (142, 201, 240);
    SetMeshesHighlight (highlightColor, meshInstanceId);
}

function isHighlighted(meshUserData, selectedMeshInstanceId){
    //console.log(meshUserData.originalMeshInstance.id);
    if (selectedMeshInstanceId !== null && meshUserData.originalMeshInstance.id.IsEqual (selectedMeshInstanceId))
    {
        return true;
    }
    return false;
}

function SetMeshesHighlight (highlightColor, selectedMeshInstanceId)
{
    //let withPolygonOffset = this.mainModel.HasLinesOrEdges ();
    let withPolygonOffset = true;
    EnumerateMeshesAndLines ((mesh) => {
        let highlighted = isHighlighted (mesh.userData, selectedMeshInstanceId);
        if (highlighted) 
        {
            if (mesh.userData.threeMaterials === null) {
                mesh.userData.threeMaterials = mesh.material; //原本的material暫存到userData.threeMaterials
                mesh.material = CreateHighlightMaterials (mesh.userData.threeMaterials, highlightColor, withPolygonOffset);
            }
        } 
        else 
        {
            if (mesh.userData.threeMaterials !== null) {
                mesh.material = mesh.userData.threeMaterials; //還原成原本的material
                mesh.userData.threeMaterials = null;
            }
        }
    });

    //Render ();
    //renderer.render(scene, camera);
}

function EnumerateMeshesAndLines (enumerator)
{
    if (mainObject === null) {
        return;
    }
    mainObject.traverse ((obj) => {
        if (obj.isMesh) {
            enumerator (obj);
        } else if (obj.isLineSegments) {
            enumerator (obj);
        }
    });
}

function EnumerateMeshes (enumerator)
{
    if (mainObject === null) {
        return;
    }
    mainObject.traverse ((obj) => {
        if (obj.isMesh) {
            enumerator (obj);
        }
    });
}

function EnumerateLines (enumerator)
{
    if (edgeObject === null) {
        return;
    }
    edgeObject.traverse ((obj) => {
        enumerator (obj);
    });
}



// 设置鼠标点击事件
function onMouseClick(event) {

    EnumerateLines((line)=>{
        if(line.id === 2699){
            console.log(line)
        }
        if (line.userData.threeMaterials !== null) {
            line.material = line.userData.threeMaterials; //還原成原本的material
            //line.userData.threeMaterials = null;
        }
    })

    // 获取modelViewDiv元素相对于浏览器窗口的位置
    var boundingRect = modelViewDiv.getBoundingClientRect();

    // 计算鼠标点击位置相对于modelViewDiv元素的坐标
    var mouseX = event.clientX - boundingRect.left;
    var mouseY = event.clientY - boundingRect.top;

    //console.log(mouseX)
    //console.log(mouseY)

    // 计算鼠标点击位置
    mouse.x = ((mouseX) / width) * 2 - 1;
    mouse.y = -((mouseY) / height) * 2 + 1;


    let local_thres = computeThreshold();

    // 通过相机和鼠标位置更新射线
    raycaster.setFromCamera(mouse, camera);
    raycaster.params.Line.threshold = local_thres;

    // 计算物体与射线的相交情况
    var intersects = raycaster.intersectObjects(edgeObject.children);


    while(intersects.length > 1){
        local_thres = local_thres/2;
        raycaster.params.Line.threshold = local_thres;
        intersects = raycaster.intersectObjects(edgeObject.children);
    }

    

    for (let i = 0; i < intersects.length; i++) {
        let intersectedObject = intersects[i].object;

        let l = calculateLineLength(intersectedObject);
        

        intersectedObject.userData.threeMaterials = intersectedObject.material;
        intersectedObject.material = new THREE.LineBasicMaterial({ color: 0x8ec9f0 });

        


        // 计算输入线段的法向量
        let positions = intersectedObject.geometry.attributes.position;
        let inputLineVertex1 = new THREE.Vector3(positions.getX(0), positions.getY(0), positions.getZ(0));
        let inputLineVertex2 = new THREE.Vector3(positions.getX(1), positions.getY(1), positions.getZ(1));
        //let inputNormal = new THREE.Vector3().crossVectors(inputLineVertex2, inputLineVertex1);

        let points = [
            inputLineVertex1,
            inputLineVertex2,
        ];

        let candidate = [];
        for (let i = 0; i < edgeObject.children.length; i++) {
            let line = edgeObject.children[i];
            let l_curr = calculateLineLength(line);
            if(line.userData.originalMeshInstance.id.IsEqual(intersectedObject.userData.originalMeshInstance.id) && 
                Math.abs(l_curr - l) < l/100 && 
                line.uuid !== intersectedObject.uuid)//需要排除當前選擇線段
            {
                candidate.push(i);
            }
        }


        let continueProcess = true;
        let findclosedloop = false;
        let findidxes = [];
        while(continueProcess){
            let pushhead = false;
            let find = false;
            let findidx = 0;
            for (let i = 0; i < candidate.length; i++){
                let positions = edgeObject.children[candidate[i]].geometry.attributes.position;
                let vertex1 = new THREE.Vector3(positions.getX(0), positions.getY(0), positions.getZ(0));
                let vertex2 = new THREE.Vector3(positions.getX(1), positions.getY(1), positions.getZ(1));

                // 计算当前线段的法向量
                //let normal = new THREE.Vector3().crossVectors(vertex2, vertex1);

                // 计算两个法向量之间的夹角
                //let angle = inputNormal.angleTo(normal);

                // 检查夹角是否小于阈值，如果是，则认为这两条线在同一个平面上
                
                if(vertex1.equals(points[0])){
                    points.unshift(vertex2);
                    pushhead = true;
                    find = true;
                    findidx = candidate[i];
                    candidate.splice(i, 1);
                    break;
                }
                else if(vertex1.equals(points[points.length - 1])){
                    points.push(vertex2);
                    find = true;
                    findidx = candidate[i];
                    candidate.splice(i, 1);
                    break;
                }
                else if(vertex2.equals(points[0])){
                    points.unshift(vertex1);
                    pushhead = true;
                    find = true;          
                    findidx = candidate[i];
                    candidate.splice(i, 1);
                    break;
                }
                else if(vertex2.equals(points[points.length - 1])){
                    points.push(vertex1);
                    find = true;
                    findidx = candidate[i];
                    candidate.splice(i, 1);
                    break;
                }
                else{
                    continue;
                }
            }

            if(find){
                if (arePointsCoplanar(points)) {
                    findidxes.push(findidx);
                }
                else{
                    if(pushhead){
                        points.shift();
                    }
                    else{
                        points.pop();
                    }
                }
            }
            else{
                continueProcess = false;
            }
            if(points[0].equals(points[points.length-1])){
                continueProcess = false;
                findclosedloop = true;
            }
            
            
        }

        if(findclosedloop){
            for(let i = 0; i < findidxes.length; i++){
                if(findidxes[i] !== undefined){
                    let line = edgeObject.children[findidxes[i]];
                    
                    line.userData.threeMaterials = line.material; //原本的material暫存到userData.threeMaterials
                    line.material = new THREE.LineBasicMaterial({ color: 0x8ec9f0 });
                    l += calculateLineLength(line);
                }
            }
        }

        let dynamicTextElement = document.getElementById('length');
        dynamicTextElement.innerHTML = 'Length : ' + l.toString();
        
    }


    // 初始化最小距离和最近的对象
    // let minDistance = Infinity;
    // let nearestObject = null;

    // for (let i = 0; i < intersects.length; i++) {
    //     let intersectedObject = intersects[i].object;
        
    //     // 计算射线与对象的交点到射线起点的距离
    //     let distance = intersects[i].distance;
    
    //     // 如果距离小于当前最小距离，则更新最小距离和最近的对象
    //     if (distance < minDistance) {
    //         minDistance = distance;
    //         nearestObject = intersectedObject;
    //     }
    // }

    // //在遍历完成后，nearestObject 就是与射线最接近的对象
    // if (nearestObject !== null) {
    //     // 这里执行针对最近对象的操作
    //     let l = calculateLineLength(nearestObject);
    //     let dynamicTextElement = document.getElementById('length');
    //     dynamicTextElement.innerHTML = 'Length : ' + l.toString();
    //     nearestObject.material.color.set(0xff0000);
    // }
    
}


function arePointsCoplanar(points) {
    if (points.length < 3) {
        return true; // 如果只有两个点，它们总是共面的
    }

    // 从第一个点开始，构建一个平面方程
    let p0 = points[0];
    let normal = new THREE.Vector3().subVectors(points[1], p0).cross(new THREE.Vector3().subVectors(points[2], p0)).normalize();
    let constant = -normal.dot(p0);

    // 检查其他点是否满足平面方程
    for (let i = 3; i < points.length; i++) {
        if (Math.abs(normal.dot(points[i]) + constant) > Number.EPSILON) {
            return false; // 如果任何一个点不满足平面方程，则返回 false
        }
    }

    return true;
}


function calculateLineLength(line) {
    // 获取顶点位置的属性缓冲区
    let positions = line.geometry.attributes.position;

    // 获取起始点和结束点的位置
    let startX = positions.getX(0);
    let startY = positions.getY(0);
    let startZ = positions.getZ(0);

    let endX = positions.getX(1);
    let endY = positions.getY(1);
    let endZ = positions.getZ(1);

    // 计算起始点和结束点之间的距离
    let length = Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2 + (endZ - startZ) ** 2);

    return length;
}


// 根据场景中最大物体的尺寸和摄像机的视野范围来计算阈值
function computeThreshold() {

    // 定义相机的垂直视角（FOV）
    let fov = camera.fov * (Math.PI / 180); // 将角度转换为弧度

    // 计算相机到屏幕的距离
    let cameraToScreenDistance = height / (2 * Math.tan(fov / 2));

    // 计算画布的宽高比
    let aspectRatio = width / height;

    // 计算视角在水平方向上的范围
    let fovHorizontal = 2 * Math.atan(Math.tan(fov / 2) * aspectRatio);

    // 计算屏幕上一个像素对应到场景内的实际距离
    let pixelSize = 2 * Math.tan(fovHorizontal / (2 * width)) * cameraToScreenDistance;
    
    return 20*pixelSize;
}



//以下是stp-web-viewer的寫法

function LoadGeometry(targetObject, jsonData) {
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
    //updateMeshDataDisplay();
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