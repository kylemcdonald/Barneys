import rhinoscriptsyntax as rs

baseMesh = rs.GetObject("Select base", rs.filter.surface, True)
intersectingMeshes = rs.GetObjects("Select intersecting", False, True, True)
for i in range(len(intersectingMeshes)):
	intersectingMesh = intersectingMeshes[i]
	rs.BooleanIntersection(baseMesh, intersectingMesh, False)
	rs.DeleteObject(intersectingMesh)
rs.DeleteObject(baseMesh)