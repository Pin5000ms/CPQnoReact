import * as THREE from './jsm/three.module.js'
import { OrbitControls } from './jsm/OrbitControls.js'
import { RGBColor} from './model/color.js'
import { DisposeThreeObjects, CreateHighlightMaterials, ConvertColorToThreeColor } from './threejs/threeutils.js';

const width = 700;
const height = 500;
var scene, renderer, camera, group;
let mainObject = new THREE.Object3D();
let edgeObject = new THREE.Object3D();
let selectLineObject = new THREE.Object3D();



var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();
var modelViewDiv = document.getElementById('modelViewDiv');

let highlightColor = new RGBColor (142, 201, 240);


export function LoadfromObject3D(_mainObject) {
    
    Clear(mainObject);
    Clear(edgeObject);

    mainObject = _mainObject;

    edgeObject = GenerateEdges();

    scene.add(mainObject);
    scene.add(edgeObject);
    
    
    
    SetViewPoint(mainObject);

}

export function BuildScene(){

    const existingRendererElement = document.querySelector('canvas');
    if (existingRendererElement) 
    {
        scene.clear();
        modelViewDiv.removeChild(existingRendererElement);
    }

    scene = new THREE.Scene();

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    const ambientLight = new THREE.AmbientLight(0x444444);
    scene.add(ambientLight);

    const backgroundLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
    scene.add(backgroundLight);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000);

    if(modelViewDiv)
    {
        modelViewDiv.appendChild(renderer.domElement);
        modelViewDiv.addEventListener('click', onMouseClick, false);
    }

    
}


function SetViewPoint(mainObject){
    const bbox = new THREE.Box3().setFromObject(mainObject);

    const center = new THREE.Vector3();
    bbox.getCenter(center);

    const size = new THREE.Vector3();
    bbox.getSize(size);

    const maxDimension = Math.max(size.x, size.y, size.z);

    const distance = maxDimension * 2;

    const farValue = distance + maxDimension;

    camera = new THREE.PerspectiveCamera(75, width / height, 0.1, farValue);
    camera.position.set(center.x, center.y, center.z + maxDimension);
    camera.lookAt(center);

    SetOrbitControl();
}

function SetOrbitControl(){
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.enableRotate = true;
    controls.enablePan = true;
    controls.screenSpacePanning = false;
    renderer.render(scene, camera);

    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }
    animate();
}



function GenerateEdges(){
    let _edgeObject = new THREE.Object3D();
    EnumerateMeshes ((mesh) => {
        let edges = new THREE.EdgesGeometry (mesh.geometry);
        let line = new THREE.LineSegments (edges, new THREE.LineBasicMaterial ({
            color: 0x000000
        }));


        line.isLineSegments = true;
        line.applyMatrix4 (mesh.matrixWorld);
        line.userData = mesh.userData;
        //line.visible = mesh.visible;
        _edgeObject.add(line);

        Dispose(edges);
        //Dispose(line);
    });

    return _edgeObject;
}

function CreateSubLine(meshes){
    let result = new THREE.Object3D();
    for(let mesh of meshes){
        let edges = new THREE.EdgesGeometry (mesh.geometry);
        let positions = edges.attributes.position;
        for (let i = 0; i < positions.count; i += 2) {
            
            let j = i+1;

            let geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
                positions.array[i*3], positions.array[i*3+1], positions.array[i*3+2],
                positions.array[j*3], positions.array[j*3+1], positions.array[j*3+2],
            ]), 3));


            let singleLine = new THREE.Line(geometry, new THREE.LineBasicMaterial ({
                color: 0xffffff
            }));

            geometry.dispose();

            result.add(singleLine);
        }
    }

    return result;
}



export function UpdateMeshesSelection (meshInstanceId)
{
    SetMeshesHighlight (highlightColor, meshInstanceId);
}

function isHighlighted(meshUserData, selectedMeshInstanceId){
    if (selectedMeshInstanceId !== null && meshUserData.originalMeshInstance.id.IsEqual (selectedMeshInstanceId))
    {
        return true;
    }
    return false;
}

function SetMeshesHighlight (highlightColor, selectedMeshInstanceId)
{
    let withPolygonOffset = true;
    EnumerateMeshesAndLines ((mesh) => {
        
        let highlighted = isHighlighted (mesh.userData, selectedMeshInstanceId);
        if (highlighted) 
        {
            if (mesh.userData.threeMaterials === null) {
                mesh.userData.threeMaterials = mesh.material;
                mesh.material = CreateHighlightMaterials (mesh.userData.threeMaterials, highlightColor, withPolygonOffset);
            }
        } 
        else 
        {
            if (mesh.userData.threeMaterials !== null) {
                mesh.material = mesh.userData.threeMaterials;
                mesh.userData.threeMaterials = null;
            }
        }
    });
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
        if (obj.isLineSegments){
            enumerator (obj);
        }
    });
}

let mode = '';

var form = document.getElementById('myForm');
  form.addEventListener('change', function(event) {
    mode = document.querySelector('input[name="options"]:checked').value;
  });


function onMouseClick(event) {
    if(mode === 'face')
        SelectFace(event);
    else if(mode === 'line')
        SelectLine(event);
}


//選擇面

function SelectFace(event){

    EnumerateMeshes((mesh)=>{
        if (mesh.userData.threeMaterials !== null) {
            mesh.material = mesh.userData.threeMaterials; //還原成原本的material
            mesh.userData.threeMaterials = null;
        }
    })


    var boundingRect = modelViewDiv.getBoundingClientRect();

    var mouseX = event.clientX - boundingRect.left;
    var mouseY = event.clientY - boundingRect.top;


    mouse.x = ((mouseX) / width) * 2 - 1;
    mouse.y = -((mouseY) / height) * 2 + 1;


    let local_thres = computeThreshold();

    raycaster.setFromCamera(mouse, camera);
    raycaster.params.Line.threshold = local_thres;


    var intersects = raycaster.intersectObjects(mainObject.children);

    let minDistance = Infinity;
    let nearestObject = null;

    for (let i = 0; i < intersects.length; i++) {
        let intersectedObject = intersects[i].object;
        
        // 計算射線與物體的交點到射線起點的距離
        let distance = intersects[i].distance;
    
        // 如果距離小於當前最小距離，則更新最小距離和最近的對象
        if (distance < minDistance) {
            minDistance = distance;
            nearestObject = intersectedObject;
        }
    }

    if(nearestObject !== null){
        let a = computeSurfaceArea(nearestObject);
        let dynamicTextElement = document.getElementById('area');
        dynamicTextElement.innerHTML = 'Area : ' + a.toString();

        nearestObject.userData.threeMaterials = nearestObject.material;
        nearestObject.material = new THREE.MeshPhongMaterial ({
            color : ConvertColorToThreeColor (highlightColor),
            side : THREE.DoubleSide
        });
    }
}


function computeSurfaceArea(mesh) {
    let geometry = mesh.geometry;

    if (geometry.isBufferGeometry) {
        let positions = geometry.attributes.position.array;

        let area = 0;

        for (let i = 0; i < positions.length; i += 9) {


            let v1 = new THREE.Vector3(positions[i], positions[i + 1], positions[i + 2]);
            let v2 = new THREE.Vector3(positions[i + 3], positions[i + 4], positions[i + 5]);
            let v3 = new THREE.Vector3(positions[i + 6], positions[i + 7], positions[i + 8]);

            // 计算三角形的面积（使用三角形的两个边向量）
            // let a = v1.distanceTo(v2);
            // let b = v2.distanceTo(v3);
            // let c = v3.distanceTo(v1);
            // let s = (a + b + c) / 2;
            // let triangleArea = Math.sqrt(s * (s - a) * (s - b) * (s - c));

            // 向量 AB 和 AC
            let AB = new THREE.Vector3().subVectors(v2, v1);
            let AC = new THREE.Vector3().subVectors(v3, v1);

            // 叉乘得到的向量
            let crossProduct = new THREE.Vector3().crossVectors(AB, AC);

            // 计算向量的长度作为三角形的面积
            let triangleArea = 0.5 * crossProduct.length();

            area += triangleArea;
        }

        return area;
    } else {
        console.error('Geometry is not a BufferGeometry!');
        return 0;
    }
}



//選擇線

function SelectLine(event){

    edgeObject.remove(selectLineObject);
    Dispose(selectLineObject);
    selectLineObject = new THREE.Object3D();

    var boundingRect = modelViewDiv.getBoundingClientRect();

    var mouseX = event.clientX - boundingRect.left;
    var mouseY = event.clientY - boundingRect.top;

    mouse.x = ((mouseX) / width) * 2 - 1;
    mouse.y = -((mouseY) / height) * 2 + 1;


    let local_thres = computeThreshold();

    raycaster.setFromCamera(mouse, camera);
    raycaster.params.Line.threshold = local_thres;

    var intersects = raycaster.intersectObjects(edgeObject.children);


    while(intersects.length > 2){
        local_thres = local_thres/2;
        raycaster.params.Line.threshold = local_thres;
        intersects = raycaster.intersectObjects(edgeObject.children);
    }

    
    if(intersects.length >=1 )
    {
        let intersectedEdge1 = intersects[0].object;
        //let intersectedEdge2 = intersects[1].object;

        let mesh1 = FindMesh(intersectedEdge1.userData.originalMeshInstance.id);
        //let mesh2 = SelectMesh(intersectedEdge2.userData.originalMeshInstance.id);

        let sublines = CreateSubLine(mesh1);//add sublines to selectObject
        //edgeObject.add(sublines);


        let subintersects = raycaster.intersectObjects(sublines.children);

        if(subintersects.length >=1){
            let subline = subintersects[0].object;
            let singleLine = new THREE.Line(subline.geometry, new THREE.LineBasicMaterial ({
                color: 0x8ec9f0
            }));
            selectLineObject.add(singleLine);

            let l = computeLineLength(subline);
            l = FindClosedCircle(l, sublines, subline);

            edgeObject.add(selectLineObject);

            let dynamicTextElement = document.getElementById('length');
            dynamicTextElement.innerHTML = 'Length : ' + l.toString();
        }
    }

}

function FindMesh(selectedMeshInstanceId){
    let result = [];
    EnumerateMeshes ((mesh) => {
        if(mesh.userData.originalMeshInstance.id.IsEqual (selectedMeshInstanceId)){
            result.push(mesh);
        }
    });
    return result;
}

function FindClosedCircle(l, sublines, subline){
    let positions = subline.geometry.attributes.position;
    let inputLineVertex1 = new THREE.Vector3(positions.getX(0), positions.getY(0), positions.getZ(0));
    let inputLineVertex2 = new THREE.Vector3(positions.getX(1), positions.getY(1), positions.getZ(1));

    let points = [
        inputLineVertex1,
        inputLineVertex2,
    ];

    let candidate = [];
    for (let i = 0; i < sublines.children.length; i++) {
        let line = sublines.children[i];
        let l_curr = computeLineLength(line);
        if( Math.abs(l_curr - l) < l/100 && line.uuid !== subline.uuid)
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
            let positions = sublines.children[candidate[i]].geometry.attributes.position;
            let vertex1 = new THREE.Vector3(positions.getX(0), positions.getY(0), positions.getZ(0));
            let vertex2 = new THREE.Vector3(positions.getX(1), positions.getY(1), positions.getZ(1));
            
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

    if(findclosedloop)
    {
        for(let i = 0; i < findidxes.length; i++){
            if(findidxes[i] !== undefined){
                let line = sublines.children[findidxes[i]];
                let singleLine = new THREE.Line(line.geometry, new THREE.LineBasicMaterial ({
                    color: 0x8ec9f0
                }));

                selectLineObject.add(singleLine);
                l += computeLineLength(singleLine);
            }
        }
        
    }
    return l;
}

function arePointsCoplanar(points) {
    if (points.length < 3) {
        return true; // 如果只有兩個點，它們總是共面的
    }

    // 從第一個點開始，建構一個平面方程
    let p0 = points[0];
    let normal = new THREE.Vector3().subVectors(points[1], p0).cross(new THREE.Vector3().subVectors(points[2], p0)).normalize();
    let constant = -normal.dot(p0);

    // 檢查其他點是否滿足平面方程
    for (let i = 3; i < points.length; i++) {
        if (Math.abs(normal.dot(points[i]) + constant) > Number.EPSILON) {
            return false; // 如果任何一點不滿足平面方程，則傳回 false
        }
    }

    return true;
}


function computeLineLength(line) {
    
    let positions = line.geometry.attributes.position;

    let vertex1 = new THREE.Vector3(positions.getX(0), positions.getY(0), positions.getZ(0));
    let vertex2 = new THREE.Vector3(positions.getX(1), positions.getY(1), positions.getZ(1));

    return vertex1.distanceTo(vertex2);
}


function computeThreshold() {

    let fov = camera.fov * (Math.PI / 180); // 將角度轉換為弧度

    let cameraToScreenDistance = height / (2 * Math.tan(fov / 2));

    let aspectRatio = width / height;

    let fovHorizontal = 2 * Math.atan(Math.tan(fov / 2) * aspectRatio);

    let pixelSize = 2 * Math.tan(fovHorizontal / (2 * width)) * cameraToScreenDistance;
   
    return 20*pixelSize;
}


//Dispose
function Clear (rootObject){
    DisposeThreeObjects (rootObject);
    scene.remove (rootObject);
    rootObject = null;
}

function Dispose(object){

    if (object.material) {
        if (Array.isArray(object.material)) {
            object.material.forEach(material => {
                material.dispose();
            });
        } else {
            object.material.dispose();
        }
    }
    object.userData = null;

    if (object.geometry) {
        object.geometry.dispose();
    }
    object = null;
}

// export function LoadfromJsonData(jsonData) {

//     var modelViewDiv = document.getElementById('modelViewDiv');
    
//     const existingRendererElement = document.querySelector('canvas');
//     if (existingRendererElement) {
//         modelViewDiv.removeChild(existingRendererElement);
//     }

    
//     scene = new THREE.Scene();
    
//     const directionalLight = new THREE.DirectionalLight(0xffffff, 1); 
//     directionalLight.position.set(1, 1, 1);
//     scene.add(directionalLight);

//     const ambientLight = new THREE.AmbientLight(0x444444);
//     scene.add(ambientLight);

//     const backgroundLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
//     scene.add(backgroundLight);

//     renderer = new THREE.WebGLRenderer({ antialias: true });
//     renderer.setSize(width, height);
//     renderer.setClearColor(0x000000);

//     if(modelViewDiv)
//         modelViewDiv.appendChild(renderer.domElement);

//     mainObject = new THREE.Object3D();

    
//     LoadGeometry(mainObject, jsonData);



//     scene.add(mainObject);

    
//     const bbox = new THREE.Box3().setFromObject(mainObject);

    
//     const center = new THREE.Vector3();
//     bbox.getCenter(center);

    
//     const size = new THREE.Vector3();
//     bbox.getSize(size);

    
//     const maxDimension = Math.max(size.x, size.y, size.z);

    
//     const distance = maxDimension * 2;

    
//     const farValue = distance + maxDimension;

//     camera = new THREE.PerspectiveCamera(75, width / height, 0.1, farValue);
    
//     camera.position.set(center.x, center.y, center.z + maxDimension);
//     camera.lookAt(center);


//     const controls = new OrbitControls(camera, renderer.domElement);
//     controls.enableDamping = true;
//     controls.dampingFactor = 0.05;
//     controls.enableZoom = true;
//     controls.enableRotate = true;
//     controls.enablePan = true;
//     controls.screenSpacePanning = false; 

    
//     function animate() {
//         requestAnimationFrame(animate);
//         controls.update();
//         renderer.render(scene, camera);
//     }
//     animate();
// }

function areLinesEqual(line1, line2) {
    let result = false;
    let positions1 = line1.geometry.attributes.position;
    let positions2 = line2.geometry.attributes.position;

    let vertex1 = new THREE.Vector3(positions1.getX(0), positions1.getY(0), positions1.getZ(0));
    let vertex2 = new THREE.Vector3(positions1.getX(1), positions1.getY(1), positions1.getZ(1));

    let vertex3 = new THREE.Vector3(positions2.getX(0), positions2.getY(0), positions2.getZ(0));
    let vertex4 = new THREE.Vector3(positions2.getX(1), positions2.getY(1), positions2.getZ(1));

    if((vertex1.equals(vertex3) && vertex2.equals(vertex4)) || (vertex1.equals(vertex4) && vertex2.equals(vertex2))){
        result = true;
    }

    return result;
}

function isCircle(points, threshold) {
    let center = new THREE.Vector3();
    for (let i = 0; i < points.length; i++) {
        center.add(points[i]);
    }
    center.divideScalar(points.length);

    let distances = [];
    for (let i = 0; i < points.length; i++) {
        let distance = points[i].distanceTo(center);
        distances.push(distance);
    }

    for (let i = 1; i < distances.length; i++) {
        if (Math.abs(distances[i] - distances[0]) > threshold) {
            return { isCircle: false, radius: null };
        }
    }

    let sum = distances.reduce((acc, cur) => acc + cur, 0);
    let averageDistance = sum / distances.length;

    return { isCircle: true, radius: averageDistance };
}



//stp-web-viewer

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