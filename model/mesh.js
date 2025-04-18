import { ModelObject3D } from './object.js';

export class Mesh extends ModelObject3D
{
    constructor ()
    {
        super ();
        this.vertices = [];
        this.vertexColors = [];
        this.normals = [];
        this.uvs = [];
        this.lines = [];
        this.triangles = [];

        this.brepfaces = []
    }

    VertexCount ()
    {
        return this.vertices.length;
    }

    VertexColorCount ()
    {
        return this.vertexColors.length;
    }

    NormalCount ()
    {
        return this.normals.length;
    }

    TextureUVCount ()
    {
        return this.uvs.length;
    }

    LineCount ()
    {
        return this.lines.length;
    }

    LineSegmentCount ()
    {
        let lineSegmentCount = 0;
        for (let line of this.lines) {
            lineSegmentCount += line.SegmentCount ();
        }
        return lineSegmentCount;
    }

    TriangleCount ()
    {
        return this.triangles.length;
    }

    BrepFaceCount ()
    {
        return this.brepfaces.length;
    }

    AddVertex (vertex)
    {
        this.vertices.push (vertex);
        return this.vertices.length - 1;
    }

    SetVertex (index, vertex)
    {
        this.vertices[index] = vertex;
    }

    GetVertex (index)
    {
        return this.vertices[index];
    }

    AddVertexColor (color)
    {
        this.vertexColors.push (color);
        return this.vertexColors.length - 1;
    }

    SetVertexColor (index, color)
    {
        this.vertexColors[index] = color;
    }

    GetVertexColor (index)
    {
        return this.vertexColors[index];
    }

    AddNormal (normal)
    {
        this.normals.push (normal);
        return this.normals.length - 1;
    }

    SetNormal (index, normal)
    {
        this.normals[index] = normal;
    }

    GetNormal (index)
    {
        return this.normals[index];
    }

    AddTextureUV (uv)
    {
        this.uvs.push (uv);
        return this.uvs.length - 1;
    }

    SetTextureUV (index, uv)
    {
        this.uvs[index] = uv;
    }

    GetTextureUV (index)
    {
        return this.uvs[index];
    }

    AddLine (line)
    {
        this.lines.push (line);
        return this.lines.length - 1;
    }

    GetLine (index)
    {
        return this.lines[index];
    }

    AddTriangle (triangle)
    {
        this.triangles.push (triangle);
        return this.triangles.length - 1;
    }

    GetTriangle (index)
    {
        return this.triangles[index];
    }

    AddBrepFace (brepface)
    {
        this.brepfaces.push (brepface);
        return this.brepfaces.length - 1;
    }

    GetBrepFace (index)
    {
        return this.brepfaces[index];
    }

    EnumerateVertices (onVertex)
    {
        for (const vertex of this.vertices) {
            onVertex (vertex);
        }
    }

    EnumerateTriangleVertexIndices (onTriangleVertexIndices)
    {
        for (const triangle of this.triangles) {
            onTriangleVertexIndices (triangle.v0, triangle.v1, triangle.v2);
        }
    }

    EnumerateTriangleVertices (onTriangleVertices)
    {
        for (const triangle of this.triangles) {
            let v0 = this.vertices[triangle.v0];
            let v1 = this.vertices[triangle.v1];
            let v2 = this.vertices[triangle.v2];
            onTriangleVertices (v0, v1, v2);
        }
    }

    Clone ()
    {
        let cloned = new Mesh ();

        cloned.SetName (this.GetName ());
        this.CloneProperties (cloned);

        for (let i = 0; i < this.VertexCount (); i++) {
            let vertex = this.GetVertex (i);
            cloned.AddVertex (vertex.Clone ());
        }

        for (let i = 0; i < this.VertexColorCount (); i++) {
            let color = this.GetVertexColor (i);
            cloned.AddVertexColor (color.Clone ());
        }

        for (let i = 0; i < this.NormalCount (); i++) {
            let normal = this.GetNormal (i);
            cloned.AddNormal (normal.Clone ());
        }

        for (let i = 0; i < this.TextureUVCount (); i++) {
            let uv = this.GetTextureUV (i);
            cloned.AddTextureUV (uv.Clone ());
        }

        for (let i = 0; i < this.LineCount (); i++) {
            let line = this.GetLine (i);
            cloned.AddLine (line.Clone ());
        }

        for (let i = 0; i < this.TriangleCount (); i++) {
            let triangle = this.GetTriangle (i);
            cloned.AddTriangle (triangle.Clone ());
        }

        return cloned;
    }
}
