import { Model } from './model/model.js'
import { Node } from './model/node.js'
import { ConvertThreeGeometryToMesh } from './threejs/threeutils.js';
import { ColorToMaterialConverter } from './importerutils.js';
import { RGBColorFromFloatComponents} from './model/color.js'

let model = new Model();

export function TestImportNode(jsonData){
    model = new Model();
    let colorToMaterial = new ColorToMaterialConverter (model);
    let rootNode = model.GetRootNode ();
    ImportNode (jsonData, jsonData.root, rootNode, colorToMaterial);
    console.log(rootNode);

    
    var treeViewDiv = document.getElementById('treeViewDiv');
    treeViewDiv.innerHTML = '';
    CreateTreeView(treeViewDiv, rootNode, true);
}


//Create TreeView Recursively
function CreateTreeView(parent_Element, rootNode, isRoot)
{
    //ul => li or li + details + summary
    var ulElement = document.createElement('ul');
    if(isRoot){
        ulElement.className = 'tree';
        ulElement.style = "margin-left : -50px"
    }
    

    for(let childNode of rootNode.childNodes){
        var liElement = document.createElement('li');
        //ul => li
        if(childNode.IsMeshNode()){
            liElement.textContent = childNode.name;
            ulElement.appendChild(liElement);
            CreateTreeView(liElement, childNode);
        }
        //ul => li + details + summary
        else{
            var detailsElement = document.createElement('details');
            var summaryElement = document.createElement('summary');
            detailsElement.appendChild(summaryElement);
            summaryElement.textContent = childNode.name;
            liElement.appendChild(detailsElement);
            ulElement.appendChild(liElement);
            CreateTreeView(detailsElement, childNode);
        }
    }
    if(!rootNode.IsMeshNode()){
        for(let mesh of rootNode.meshIndices){
            var liElement_mesh = document.createElement('li');
            liElement_mesh.textContent = rootNode.name;
            ulElement.appendChild(liElement_mesh);
        }
    }
    
    parent_Element.appendChild(ulElement);
}


function ImportNode (resultContent, occtNode, parentNode, colorToMaterial)
{
    //console.log(occtNode.meshes);
    for (let nodeMeshIndex of occtNode.meshes) {
        let occtMesh = resultContent.meshes[nodeMeshIndex];
        //console.log(occtMesh);
        let mesh = ImportMesh (occtMesh, colorToMaterial);
        let meshIndex = model.AddMesh (mesh);
        parentNode.AddMeshIndex (meshIndex);
    }
    for (let childOcctNode of occtNode.children) {
        let childNode = new Node ();
        childNode.SetName (childOcctNode.name);
        parentNode.AddChildNode (childNode);
        ImportNode (resultContent, childOcctNode, childNode, colorToMaterial);
    }
}

function ImportMesh (occtMesh, colorToMaterial)
{
    let materialIndex = null;
    if (occtMesh.color) {
        let color = RGBColorFromFloatComponents (occtMesh.color[0], occtMesh.color[1], occtMesh.color[2]);
        materialIndex = colorToMaterial.GetMaterialIndex (color.r, color.g, color.b, null);
    }
    let mesh = ConvertThreeGeometryToMesh (occtMesh, materialIndex, null);
    if (occtMesh.name) {
        mesh.SetName (occtMesh.name);
    }
    for (let brepFace of occtMesh.brep_faces) {
        if (brepFace.color === null) {
            continue;
        }
        let faceColor = RGBColorFromFloatComponents (brepFace.color[0], brepFace.color[1], brepFace.color[2]);
        let faceMaterialIndex = colorToMaterial.GetMaterialIndex (faceColor.r, faceColor.g, faceColor.b, null);
        for (let i = brepFace.first; i <= brepFace.last; i++) {
            let triangle = mesh.GetTriangle (i);
            triangle.SetMaterial (faceMaterialIndex);
        }
    }
    return mesh;
}