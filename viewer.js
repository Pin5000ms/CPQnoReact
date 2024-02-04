import * as THREE from './jsm/three.module.js'
import { OrbitControls } from './jsm/OrbitControls.js'
import { RGBColor} from './model/color.js'
import { CreateHighlightMaterials } from './threejs/threeutils.js';

const width = 700;
const height = 500;
var scene, renderer, camera, group;
let mainObject = new THREE.Object3D();

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
        modelViewDiv.appendChild(renderer.domElement);

    scene.add(mainObject);
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