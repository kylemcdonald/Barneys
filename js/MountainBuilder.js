
var container;
var camera, controls, scene, renderer;

var baseGeometry, baseMesh, baseMaterial;
var planeMesh, baseBack, baseFront, baseLeft, baseRight;
var facetMeshes = [];
var samplePoints, triangles;

var settings = {
	totalPoints: 256,
	baseHeight: 25,
	edgeSpacing: 50,
	sidePadding: 25,
	vertexPadding: 8,
	modelWidth: 422,
	modelDepth: 190,
	modelHeight: 300,
	modelDetail: .001,
	noiseOctaves: 8,
	noiseFalloff: 1.4,
	noiseOffset: 50,
	minInflation: -.15,
	maxInflation: +.15,
	subdivisions: 3,
};

// for some reason this needs to be 2 when rendering, 4 when exporting
// going to leave it as 2 assuming that this is a bug with the exporter, not renderer
var divider = 2;

var modelNumber = 0;
var actions = {
	exportSTL: function () {
		var exporter = new THREE.STLExporter();
		var blob = new Blob([exporter.exportMeshes(
			facetMeshes.concat(planeMesh, baseFront, baseBack, baseLeft, baseRight)
			)], {type: "text/plain;charset=utf-8"});
		modelNumber++;
		saveAs(blob, "mesh-" + modelNumber + ".stl");
	},
	rebuild: function() {
		samplePlane();
	}
};

var clock = new THREE.Clock();

window.onload = function() {
	init();
	initControls();
	animate();
};

var room;

function random(min, max) {
	return Math.random() * (max - min) + min;
}

function randomCut(min, max, centerCut) {
	var mid = (min + max) / 2;
	return Math.random() > .5 ? 
		random(min, mid - centerCut) :
		random(mid + centerCut, max);
}

function init() {
	container = document.getElementById('container');

	camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 20000);
	scene = new THREE.Scene();
	scene.position.y = 100;
	scene.rotateX(Math.PI / 2);
	scene.updateMatrix();

	var ambient = new THREE.AmbientLight(0x112233);
	scene.add(ambient);

	var pointLight = new THREE.PointLight(0xffeedd);
	pointLight.position.set(0, 300, 100);
	scene.add(pointLight);

	var path = "./textures/cubemap/";
	var format = '.jpg';
	var urls = [
		path + 'px' + format, path + 'nx' + format,
		path + 'py' + format, path + 'ny' + format,
		path + 'pz' + format, path + 'nz' + format
	];
	var textureCube = THREE.ImageUtils.loadTextureCube( urls );
	chromeMaterial = new THREE.MeshBasicMaterial({
		color: 0xffffff, 
		envMap: textureCube,
		side: THREE.DoubleSide
	});
	// chromeMaterial = new THREE.MeshBasicMaterial({color: 0xffffff, wireframe: true});
	// chromeMaterial = new THREE.MeshNormalMaterial({color: 0xffffff, wireframe: true});
	
	var loader = new THREE.OBJLoader();
	loader.load('models/windows.obj', function (object) {
		room = object;
		room.rotateY(-Math.PI / 2);
		room.rotateZ(+Math.PI / 2);
		room.position = {x: -220, y: -110, z: 310};
		var roomMaterial = new THREE.MeshLambertMaterial({color: 0xffffff, side: THREE.DoubleSide});
		room.traverse( function (child) {
			child.material = roomMaterial;	
		});
		scene.add(room);
	});

	camera.position.x = 0;
	camera.position.y = -100;
	camera.position.z = 450;

	samplePlane();

	renderer = new THREE.WebGLRenderer({antialias: true}); // doesn't work?
	renderer.setSize(window.innerWidth, window.innerHeight);

	controls = new THREE.OrbitControls(camera, renderer.domElement);

	container.appendChild(renderer.domElement);

	window.addEventListener('resize', onWindowResize, false);
}
function samplePlane() {
	scene.remove(planeMesh);
	// add four more planes right here for the extruded part
	// then add them to the exported stl
	planeGeometry = new THREE.PlaneGeometry(settings.modelWidth, settings.modelDepth, 1, 1);

	scene.remove(baseBack);
	baseBack = new THREE.Mesh(new THREE.PlaneGeometry(settings.modelWidth, settings.baseHeight, 1, 1), chromeMaterial);
	baseBack.rotateX(+Math.PI / 2), baseBack.position = {x: 0, y: -settings.modelDepth / divider, z: +settings.baseHeight / divider};
	scene.add(baseBack);

	scene.remove(baseFront);
	baseFront = new THREE.Mesh(new THREE.PlaneGeometry(settings.modelWidth, settings.baseHeight, 1, 1), chromeMaterial);
	baseFront.rotateX(-Math.PI / 2), baseFront.position = {x: 0, y: +settings.modelDepth / divider, z: +settings.baseHeight / divider};
	scene.add(baseFront);

	scene.remove(baseLeft);
	baseLeft = new THREE.Mesh(new THREE.PlaneGeometry(settings.modelDepth, settings.baseHeight, 1, 1), chromeMaterial);
	baseLeft.rotateX(+Math.PI / 2), baseLeft.rotateY(-Math.PI / 2), baseLeft.position = {x: -settings.modelWidth / divider, y: 0, z: +settings.baseHeight / divider};
	scene.add(baseLeft);

	scene.remove(baseRight);
	baseRight = new THREE.Mesh(new THREE.PlaneGeometry(settings.modelDepth, settings.baseHeight, 1, 1), chromeMaterial);
	baseRight.rotateX(+Math.PI / 2), baseRight.rotateY(+Math.PI / 2), baseRight.position = {x: +settings.modelWidth / divider, y: 0, z: +settings.baseHeight / divider};
	scene.add(baseRight);

	planeMesh = new THREE.Mesh(planeGeometry, chromeMaterial);
	planeMesh.rotateX(Math.PI);
	scene.add(planeMesh);

	samplePoints = THREE.GeometryUtils.randomPointsInGeometry(planeGeometry, settings.totalPoints);
	samplePoints.remove(function(a) {
		return distanceFromRect(a.x, a.y, settings.modelWidth, settings.modelDepth) < settings.sidePadding;
	});
	var widthPoints = Math.round(settings.modelWidth / settings.edgeSpacing);
	for(var i = 0; i < widthPoints; i++) {
		var x = THREE.Math.mapLinear(i, -1, widthPoints, -settings.modelWidth / 2, +settings.modelWidth / 2);
		samplePoints.push(new THREE.Vector3(x, -settings.modelDepth / 2, 0));
		samplePoints.push(new THREE.Vector3(x, +settings.modelDepth / 2, 0));
	}
	var depthPoints = Math.round(settings.modelDepth / settings.edgeSpacing);
	for(var i = 0; i < depthPoints; i++) {
		var y = THREE.Math.mapLinear(i, -1, depthPoints, -settings.modelDepth / 2, +settings.modelDepth / 2);
		samplePoints.push(new THREE.Vector3(-settings.modelWidth / 2, y, 0));
		samplePoints.push(new THREE.Vector3(+settings.modelWidth / 2, y, 0));
	}
	samplePoints.remove(function(a) {
		return samplePoints.some(function(b) {
			return a != b && a.distanceTo(b) < settings.vertexPadding;
		});
	});

	perlinSeed = Date.now();
	buildMeshes();
}
var perlinSeed = 0;
function buildMeshes() {
	PerlinSimplex.noiseDetail(settings.noiseOctaves, settings.noiseFalloff);

	var allPoints = samplePoints.concat(planeGeometry.vertices).map(getField);
	triangles = triangulate(allPoints);

	// scene.remove(baseMesh);
	// baseGeometry = new THREE.Geometry();
	// var indices = 0;
	// triangles.each(function(x) {
	// 	baseGeometry.vertices.push(x.c, x.b, x.a);
	// 	baseGeometry.faces.push(new THREE.Face3(
	// 		indices++,
	// 		indices++,
	// 		indices++));
	// });

	// baseGeometry.computeFaceNormals();
	// baseMaterial = new THREE.MeshNormalMaterial({color: 0xffffff, wireframe: true});
	// baseMesh = new THREE.Mesh(baseGeometry, baseMaterial);
	scene.add(baseMesh);

	buildSails();
}
function buildSails() {
	settings.subdivisions = Math.floor(settings.subdivisions);
	facetMeshes.map(function(x) {scene.remove(x)});
	facetMeshes = [];
	triangles.each(function(x) {
		var centerCut = .2;
		var inflation = randomCut(settings.minInflation, settings.maxInflation, centerCut);
		var sailGeometry = buildSail([x.a, x.c, x.b], inflation, settings.subdivisions);
		sailGeometry.verticesNeedUpdate = true;
		sailGeometry.normalsNeedUpdate = true;
		sailGeometry.computeFaceNormals();
		sailGeometry.computeVertexNormals();
		var sailMesh = new THREE.Mesh(sailGeometry, chromeMaterial);
		sailMesh.position.z = settings.baseHeight / (divider / 2);
		scene.add(sailMesh);
		facetMeshes.push(sailMesh);
	});
}
function distanceFromRect(x, y, w, h) {
	return Math.min(
		Math.abs(Math.abs(x) - w / 2),
		Math.abs(Math.abs(y) - h / 2));
}
function getField(vertex) {
	var perlinOffset = PerlinSimplex.noise(
		perlinSeed,
		settings.noiseOffset + vertex.x * settings.modelDetail,
		settings.noiseOffset + vertex.y * settings.modelDetail);

	// var perlinOffset = Math.abs(PerlinSimplex.noise(
	// 	settings.noiseOffset + vertex.x * settings.modelDetail,
	// 	settings.noiseOffset + vertex.y * settings.modelDetail) - .5) * 2;

	var distanceFromEdge = rectWindow(vertex.x, vertex.y, settings.modelWidth, settings.modelDepth);
	vertex.z = ((distanceFromEdge) * perlinOffset) * settings.modelHeight;
	return vertex;
}
function initControls() {
  var gui = new dat.GUI();
  gui.add(actions, 'rebuild');
  gui.add(settings, 'totalPoints', 1, 256).onChange(samplePlane);
  gui.add(settings, 'baseHeight', 0, 100).onChange(samplePlane);
  gui.add(settings, 'edgeSpacing', 10, 100).onChange(samplePlane);
  gui.add(settings, 'sidePadding', 0, 50).onChange(samplePlane);
  gui.add(settings, 'vertexPadding', 0, 50).onChange(samplePlane);
  // gui.add(settings, 'modelWidth', 0, 800).onChange(samplePlane);
  // gui.add(settings, 'modelDepth', 0, 800).onChange(samplePlane);
  gui.add(settings, 'modelHeight', 0, 800).onChange(buildMeshes);
  gui.add(settings, 'modelDetail', 0.00001, 0.002).onChange(buildMeshes);
  gui.add(settings, 'noiseOctaves', 1, 8).onChange(buildMeshes);
  gui.add(settings, 'noiseFalloff', 0, 2).onChange(buildMeshes);
  gui.add(settings, 'noiseOffset', 0, 100).onChange(buildMeshes);
  gui.add(settings, 'minInflation', -2, 0).onChange(buildSails);
  gui.add(settings, 'maxInflation', 0, +2).onChange(buildSails);
  gui.add(settings, 'subdivisions', 2, 16).onChange(buildSails);
  gui.add(actions, 'exportSTL');
};
//
function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
	// controls.handleResize();
}
function animate() {
	requestAnimationFrame(animate);
	render();
}
function render() {
	controls.update(clock.getDelta());
	renderer.render(scene, camera);
}