export class TreeNode
{
	constructor(name, id){
        this.name = name;
        this.id = id;
		this.mainElement = document.createElement('div');
        this.mainElement.setAttribute ('title', this.name);
    }

    SetClickEvent(onClick){
        this.mainElement.classList.add('clickable');
        this.mainElement.style.cursor = 'pointer';
        this.mainElement.addEventListener('click', onClick);
    }


    AddDomElements (parentDiv)
    {
        parentDiv.appendChild (this.mainElement);
    }
}