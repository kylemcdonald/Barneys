import rhinoscriptsyntax as rs

meshes = rs.GetObjects("Select meshes to save", False, True, True)
for i in range(len(meshes)):
	mesh = meshes[i]
	rs.UnselectAllObjects()
	rs.SelectObject(mesh)
	filename = "/Users/kyle/Desktop/export/mesh-" + str(i) + ".stl"
	rs.Command("_-Export " + filename + " _Enter _Enter")