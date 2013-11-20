import rhinoscriptsyntax as rs
import math
from operator import itemgetter, attrgetter

def GetCorner(object):
	return rs.BoundingBox(object)[0]

def GetWidth(object):
	box = rs.BoundingBox(object)
	return math.fabs(box[1][0] - box[0][0])

def GetDepth(object):
	box = rs.BoundingBox(object)
	return math.fabs(box[3][1] - box[0][1])

def roundInt(x):
	return math.trunc(round(x))

meshes = rs.GetObjects("Select meshes to spread out", False, True, True)
n = len(meshes)

sortedMeshes = []
for i in range(n):
	mesh = meshes[i]
	corner = GetCorner(mesh)
	sortedMeshes.append((corner[0], corner[1], corner[2], mesh))

# sortedMeshes = sorted(sortedMeshes, key=itemgetter(0), reverse=False)
sortedMeshes = sorted(sortedMeshes, key=itemgetter(0), reverse=False)
sortedMeshes = sorted(sortedMeshes, key=itemgetter(1), reverse=False)
sortedMeshes = sorted(sortedMeshes, key=itemgetter(2), reverse=False)

offset = 0
textHeight = 1
spacing = 1
layerHeight = 2.9 
textGroup = rs.AddGroup()
for i in range(n):
	mesh = sortedMeshes[i][3]
	corner = GetCorner(mesh)
	rs.MoveObject(mesh, rs.VectorSubtract((0, offset, 0), corner))
	layer = roundInt(corner[2] / layerHeight)
	x = roundInt(corner[0])
	y = roundInt(corner[1])
	text = rs.AddText(str(layer) + ": " + str(y) + ", " + str(x), (0, offset, 0), textHeight)
	rs.RotateObject(text, (0, offset, 0), 90)
	rs.MoveObject(text, (-spacing, 0, 0))
	rs.AddObjectsToGroup(text, textGroup)
	offset += GetDepth(mesh) + spacing