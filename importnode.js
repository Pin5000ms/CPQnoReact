import {Model} from './model/model.js'
import {Node} from './model/node.js'

let model = new Model();

export function TestImportNode(jsonData){
    //let colorToMaterial = new ColorToMaterialConverter (this.model);
    let rootNode = model.GetRootNode ();
    ImportNode (jsonData, jsonData.root, rootNode, null);
    console.log(rootNode);
    var treeViewDiv = document.getElementById('treeViewDiv');
    CreateTreeView(treeViewDiv, rootNode);
}

function CreateTreeView(parent_Element, rootNode)
{
    if(rootNode.childNodes.length !== 0){
        var detailsElement = document.createElement('details');
        var summaryElement = document.createElement('summary');
        summaryElement.textContent = rootNode.name;
        var ulElement = document.createElement('ul');
        detailsElement.appendChild(summaryElement);
        detailsElement.appendChild(ulElement);

        for(let childNode of rootNode.childNodes){

            var liElement = document.createElement('li');
            liElement.textContent = childNode.name;
            CreateTreeView(liElement, childNode);

            ulElement.appendChild(liElement);
        }

        //root不用加details和summary
        if (parent_Element.tagName.toLowerCase() === 'div'){
            parent_Element.appendChild(ulElement);
        }
        else{
            parent_Element.appendChild(detailsElement);
        }
        
    }
}


function ImportNode (resultContent, occtNode, parentNode, colorToMaterial)
{
    //console.log(occtNode.meshes);
    for (let nodeMeshIndex of occtNode.meshes) {
        let occtMesh = resultContent.meshes[nodeMeshIndex];
        //console.log(occtMesh);
        //let mesh = ImportMesh (occtMesh, colorToMaterial);
        //let meshIndex = model.AddMesh (mesh);
        //parentNode.AddMeshIndex (meshIndex);
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
        //let color = RGBColorFromFloatComponents (occtMesh.color[0], occtMesh.color[1], occtMesh.color[2]);
        //materialIndex = colorToMaterial.GetMaterialIndex (color.r, color.g, color.b, null);
        materialIndex = colorToMaterial.GetMaterialIndex (130, 130, 130, null);
    }
    let mesh = ConvertThreeGeometryToMesh (occtMesh, materialIndex, null);
    if (occtMesh.name) {
        mesh.SetName (occtMesh.name);
    }
    for (let brepFace of occtMesh.brep_faces) {
        if (brepFace.color === null) {
            continue;
        }
        //let faceColor = RGBColorFromFloatComponents (brepFace.color[0], brepFace.color[1], brepFace.color[2]);
        //let faceMaterialIndex = colorToMaterial.GetMaterialIndex (faceColor.r, faceColor.g, faceColor.b, null);
        let faceMaterialIndex = colorToMaterial.GetMaterialIndex (130, 130, 1300, null);
        for (let i = brepFace.first; i <= brepFace.last; i++) {
            let triangle = mesh.GetTriangle (i);
            triangle.SetMaterial (faceMaterialIndex);
        }
    }
    return mesh;
}