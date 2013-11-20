import rhinoscriptsyntax as rs
import random
import math

def rand(min, max):
	return random.uniform(min, max)

def lerp(a, b, t):
	return a * (1 - t) + (b * t)

def map(x, inmin, inmax, outmin, outmax):
	if inmin == inmax:
		return outmax
	else:
		return ((x - inmin) / (inmax - inmin)) * (outmax - outmin) + outmin

def layerShape(t):
	# return math.sqrt(1 - math.pow(2 * t - 1, 2)) / 2
	return math.sin(math.pi * math.pow(t, 1.3)) / 3

# 23.75 x 95 x 2.9
def radiusShape(theta, t):
	base = 1
	base += math.sin(24 * (theta + t)) * .08
	base += math.sin(24 * (theta - t)) * .08
	base += math.sin(12 * (theta + t)) * .10
	base += math.sin(12 * (theta - t)) * .10
	# if math.sin(12 * (theta + t)) > 0:
	# 	base -= .02
	# else:
	# 	base += .02
	# if math.sin(12 * (theta - t)) > 0:
	# 	base -= .02
	# else:
	# 	base += .02
	# if math.sin(12 * (theta + t) + math.pi) > 0:
	# 	base -= .02
	# else:
	# 	base += .02
	# if math.sin(12 * (theta - t) + math.pi) > 0:
	# 	base -= .02
	# else:
	# 	base += .02
	return base

complete = True
layerHeight = 2.90
layerCount = 40
baseRadius = 112
phase = (10 / 360) * 2 * math.pi
vertexCount = 320

curves = []
for i in range(layerCount):
	vertices = []
	z = layerHeight * i
	t = map(i, -1, layerCount, 0, 1) #i / (layerCount - 1)
	radius = baseRadius * layerShape(t)
	for j in range(vertexCount):
		theta = map(j, 0, vertexCount, 0, 2 * math.pi)
		curRadius = radiusShape(theta, t) * radius
		vertices.append((math.sin(phase + theta) * curRadius, math.cos(phase + theta) * curRadius, z))
	vertices.append(vertices[0])
	curve = rs.AddCurve(vertices)
	curves.append(curve)
	extrusion = rs.ExtrudeCurveStraight(curve, (0, 0, 0), (0, 0, layerHeight))
	rs.CapPlanarHoles(extrusion)
rs.DeleteObjects(curves)