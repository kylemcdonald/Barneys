
var container = document.createElement( 'div' );
document.body.appendChild( container );

var renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize(document.body.clientWidth, document.body.clientHeight);
document.body.appendChild(renderer.domElement);

var scene = new THREE.Scene();

var width = renderer.domElement.width, height = renderer.domElement.height;
var camera = new THREE.PerspectiveCamera( 45, width/height, .01, 100 );
camera.position.z = 1;
camera.position.y = -1;
scene.add(camera);

var controls = new THREE.OrbitControls( camera );

generate();

function generate() {
	var sqrt3 = Math.sqrt(3);
	var side = 1;
	sailGeometry = buildSail([
		new THREE.Vector3(0, +side / sqrt3, 0),
		new THREE.Vector3(-side / 2, -side / (2 * sqrt3), 0),
		new THREE.Vector3(+side / 2, -side / (2 * sqrt3), 0)
	], .15, 20);

	var sailMaterial = new THREE.MeshNormalMaterial({
		side: THREE.DoubleSide,
		wireframe: false,
		smoothing: THREE.SmoothShading});
	var sailMesh = new THREE.Mesh(sailGeometry, sailMaterial);
	scene.add(sailMesh);

	// var exporter = new THREE.STLExporter();
	// var blob = new Blob([exporter.exportMesh(sailMesh)], {type: "text/plain;charset=utf-8"});
	// saveAs(blob, "mesh.stl");
}

var clock = new THREE.Clock();

function animate() {
	requestAnimationFrame(animate);
	controls.update(clock.getDelta());
	renderer.render(scene, camera);
}

animate();