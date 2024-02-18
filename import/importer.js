import { Model } from '../model/model.js'
import { Node } from '../model/node.js'
import { ConvertThreeGeometryToMesh } from '../threejs/threeutils.js';
import { ColorToMaterialConverter } from './importerutils.js';
import { RGBColorFromFloatComponents } from '../model/color.js'
import { MeshInstanceId } from '../model/meshinstance.js';

import { ConvertModelToThreeObject, ModelToThreeConversionOutput, ModelToThreeConversionParams } from '../threejs/threeconverter.js';
import { LoadfromObject3D, UpdateMeshesSelection } from '../viewer.js';
import { TreeNode } from './treenode.js';


let model = new Model();

export function ImportJsonData(jsonData){
    model = new Model();
    let colorToMaterial = new ColorToMaterialConverter (model);
    let rootNode = model.GetRootNode ();
    ImportNode (jsonData, jsonData.root, rootNode, colorToMaterial);

    console.log(rootNode);

    
    var treeViewDiv = document.getElementById('treeViewDiv');
    treeViewDiv.innerHTML = '';
    CreateTreeView(treeViewDiv, rootNode, true);
    //CreateTreeView2(treeViewDiv, rootNode);


    let params = new ModelToThreeConversionParams ();
    //params.forceMediumpForMaterials = this.hasHighpDriverIssue;
    let output = new ModelToThreeConversionOutput ();
    ConvertModelToThreeObject (model, params, output,
    //callbacks
    {
        onTextureLoaded : () => {
            //callbacks.onTextureLoaded ();
        },
        onModelLoaded : (threeObject) => {
            LoadfromObject3D(threeObject);
            //this.defaultMaterials = output.defaultMaterials;
            //this.objectUrls = output.objectUrls;
            // if (importResult.upVector === Direction.X) {
            //     let rotation = new THREE.Quaternion ().setFromAxisAngle (new THREE.Vector3 (0.0, 0.0, 1.0), Math.PI / 2.0);
            //     threeObject.quaternion.multiply (rotation);
            // } else if (importResult.upVector === Direction.Z) {
            //     let rotation = new THREE.Quaternion ().setFromAxisAngle (new THREE.Vector3 (1.0, 0.0, 0.0), -Math.PI / 2.0);
            //     threeObject.quaternion.multiply (rotation);
            // }
            //callbacks.onModelFinished (importResult, threeObject);
            //this.inProgress = false;
        }
    });
}

function CreateTreeView2(parent_Element, rootNode){
    
    
    for(let childNode of rootNode.childNodes){
        let node = new TreeNode(childNode.name, childNode.GetId());
        node.AddDomElements (parent_Element);
        CreateTreeView2(node.mainElement, childNode);
    }
    if(!rootNode.IsMeshNode()){
        for(let meshid of rootNode.meshIndices){
            let node = new TreeNode(rootNode.name, rootNode.GetId());
            node.AddDomElements (parent_Element);
        }
    }
    

}


//Create TreeView Recursively
function CreateTreeView(parent_Element, rootNode, isRoot)
{
    
    var ulElement = document.createElement('ul');
    if(isRoot){
        ulElement.className = 'tree';
        ulElement.style = "margin-left : -50px"
    }

    //ul 下層可能是 li 或 li + details + summary
    for(let childNode of rootNode.childNodes){
        var liElement = document.createElement('li');
        //ul => li
        if(childNode.IsMeshNode()){
            liElement.textContent = childNode.name;

            // var buttonElement = document.createElement('button');
            // liElement.appendChild(buttonElement);

            liElement.addEventListener('click', function() {
                console.log(childNode.meshIndices[0]);
                UpdateMeshesSelection(new MeshInstanceId (childNode.GetId (), childNode.meshIndices[0]));
            });

            // console.log(childNode.GetId ());
            // console.log(childNode.meshIndices[0])
            
            ulElement.appendChild(liElement);
            CreateTreeView(liElement, childNode);
        }
        //ul => li + details + summary 不用設定liElement.textContent
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
        for(let meshid of rootNode.meshIndices){
            var liElement_mesh = document.createElement('li');
            liElement_mesh.textContent = rootNode.name;

            // var buttonElement_mesh = document.createElement('button');
            // liElement_mesh.appendChild(buttonElement_mesh);

            
            liElement_mesh.addEventListener('click', function() {
                console.log(meshid);
                UpdateMeshesSelection(new MeshInstanceId (rootNode.GetId (), meshid));
            });

            // console.log(rootNode.GetId ());
            // console.log(meshid)

            ulElement.appendChild(liElement_mesh);
        }
    }
    
    parent_Element.appendChild(ulElement);
}



// model = new Model();
// let colorToMaterial = new ColorToMaterialConverter (model);
// let rootNode = model.GetRootNode ();
// ImportNode (jsonData, jsonData.root, rootNode, colorToMaterial);
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