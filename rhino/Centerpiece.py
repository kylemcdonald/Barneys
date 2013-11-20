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

complete = True
layerHeight = 2.95

buildScaffolding = False
scaffoldSide = .75

placement = (0, 0)#(60/3, 35/3)
icicleCount = 1#int(rand(6, 20))
layerRange = (15, 15)#(60,40)#(60, rand(10, 50))
maxScaleRange = (60, 60)#(10,20)#(rand(10, 15), rand(10, 35)) # (10, 20)
minScale = 0.8#rand(0, .9) # 0
outerReduce = .09#rand(.01, .06) # .03
wiggle = .04#rand(.01, .1) # .05
smoothAmount = .3#rand(.1, .9) # .1
count = 60#int(rand(30, 120)) # 60

downwards = True
downwardsLayers = 25
downwardsReduce = .06

hollow = False
shrinkPasses = 5
innerReduce = .04

def smooth(x, amount):
	for i in range(len(x)):
		next = x[(i + 1) % count]
		previous = x[(i - 1 + count) % count]
		cur = x[i]
		target = (next + previous) / 2
		x[i] = lerp(cur, target, smoothAmount)

def shrink(x, reduce):
	for i in range(len(x)):
		x[i] *= random.uniform(1 - reduce, 1)
		x[i] = max(x[i], 0)

def scale(x, amount):
	for i in range(len(x)):
		x[i] *= amount

def upwardsShaping(x):
	return 1 - math.pow(x * .5, 2)
	# return 1 - ((1 - math.cos(x * math.pi)) / 2) * .15

def downwardsShaping(x):
	return 1 - math.pow(x * .9, 8)

def piece(layers, maxScale):
	curves = []
	initialRadii = []
	results = []
	for i in range(count):
		initialRadii.append(random.uniform(minScale * maxScale, maxScale))

	# outerExtrusions
	outerExtrusions = []
	radii = initialRadii[:]
	for layer in range(layers):
		height = layer * layerHeight
		smooth(radii, smoothAmount)
		shrink(radii, outerReduce)
		scale(radii, random.uniform(1 - wiggle, 1 + wiggle))
		scale(radii, upwardsShaping(layer / (layers - 1)))
		vertices = []
		for i in range(count):
			theta = 2 * math.pi * i / count
			vertices.append((math.sin(theta) * radii[i], math.cos(theta) * radii[i], height))
		vertices.append(vertices[0])
		curve = rs.AddCurve(vertices, 5)
		curves.append(curve)
		if complete:
			extrusion = rs.ExtrudeCurveStraight(curve, (0, 0, 0), (0, 0, layerHeight))
			rs.CapPlanarHoles(extrusion)
			outerExtrusions.append(extrusion)
			if not hollow:
				results.append(extrusion)

	if hollow:
		for i in range(shrinkPasses):
			shrink(radii, innerReduce)

		# innerExtrusions
		for layer in range(layers):
			actualLayer = layers - layer - 1
			height = actualLayer * layerHeight
			smooth(radii, smoothAmount)
			shrink(radii, innerReduce)
			vertices = []
			for i in range(count):
				theta = 2 * math.pi * i / count
				vertices.append((math.sin(theta) * radii[i], math.cos(theta) * radii[i], height))
			vertices.append(vertices[0])
			curve = rs.AddCurve(vertices, 5)
			curves.append(curve)
			if complete:
				extrusion = rs.ExtrudeCurveStraight(curve, (0, 0, 0), (0, 0, layerHeight))
				rs.CapPlanarHoles(extrusion)
				result = rs.BooleanDifference(outerExtrusions[actualLayer], extrusion)
				results.append(result)
	
	if downwards:
		radii = initialRadii[:]
		for layer in range(downwardsLayers):
			height = -(layer + 1) * layerHeight
			smooth(radii, smoothAmount)
			shrink(radii, downwardsReduce)
			scale(radii, random.uniform(1 - wiggle, 1 + wiggle))
			scale(radii, downwardsShaping(layer / (downwardsLayers - 1)))
			vertices = []
			for i in range(count):
				theta = 2 * math.pi * i / count
				vertices.append((math.sin(theta) * radii[i], math.cos(theta) * radii[i], height))
			vertices.append(vertices[0])
			curve = rs.AddCurve(vertices, 5)
			curves.append(curve)
			if complete:
				extrusion = rs.ExtrudeCurveStraight(curve, (0, 0, 0), (0, 0, layerHeight))
				rs.CapPlanarHoles(extrusion)
				outerExtrusions.append(extrusion)
				if not hollow:
					results.append(extrusion)

	if buildScaffolding:
		scaffoldBase = rs.AddRectangle((-scaffoldSide/2, -scaffoldSide/2, 0), scaffoldSide, scaffoldSide)
		scaffold = rs.ExtrudeCurveStraight(scaffoldBase, (0, 0, 0), (0, 0, (layers - 1) * layerHeight))
		rs.CapPlanarHoles(scaffold)
		rs.DeleteObject(scaffoldBase)
		results.append(scaffold)

	if complete:
		rs.DeleteObjects(curves)
		rs.AddObjectsToGroup(results, rs.AddGroup())
		return results
	else:
		rs.AddObjectsToGroup(curves, rs.AddGroup())
		return curves

for i in range(icicleCount):
	translation = (random.gauss(0, placement[0]), random.gauss(0, placement[1]), 0)
	distance = rs.VectorLength(translation)
	layers = int(map(distance, 0, placement[0], layerRange[0], layerRange[1]))
	maxScale = map(i, 0, placement[0], maxScaleRange[0], maxScaleRange[1])
	objects = piece(layers, maxScale)
	rs.MoveObject(objects, translation)
	# rs.RotateObject(objects, (0, 0, 0), 60 * i)