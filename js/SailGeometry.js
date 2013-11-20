function getBarycentric(f, p1, p2, p3) {
	var f1 = p1.clone().sub(f);
	var f2 = p2.clone().sub(f);
	var f3 = p3.clone().sub(f);
	var a = p1.clone().sub(p2).cross(p1.clone().sub(p3)).length();
	var a1 = f2.clone().cross(f3).length() / a;
	var a2 = f3.clone().cross(f1).length() / a;
	var a3 = f1.clone().cross(f2).length() / a;
	return new THREE.Vector3(a1, a2, a3);
}

function sinWindow(x) {
	// return (1 - Math.cos(x * 2 * Math.PI)) / 2;
	return Math.sin(x * Math.PI);
}

function rectWindow(x, y, w, h) {
	var wx = (1 + Math.cos(2 * Math.PI * (x / w))) / 2;
	var wy = (1 + Math.cos(2 * Math.PI * (y / h))) / 2;
	return wx * wy;
}

var centroidWeight =
	sinWindow(1/3) *
	sinWindow(1/3) * 
	sinWindow(1/3);

var equilateralArea = Math.sqrt(3) / 4;

function buildSail(points, height, resolution) {
	var n = resolution;

	var ab = points[1].clone().sub(points[0]);
	var ac = points[2].clone().sub(points[0]);
	var bc = points[2].clone().sub(points[1]);
	var cross = ab.clone().cross(ac);
	var area = cross.length() / 2;
	var normalizedArea = area / equilateralArea;
	var longestSide = Math.max(ab.length(), ac.length(), bc.length());
	var skinniness = longestSide / normalizedArea;
	var offset = cross.clone().normalize();
	offset.multiplyScalar(1 / centroidWeight);
	offset.multiplyScalar(height / skinniness);

	var curvedGeometry = new THREE.PlaneGeometry(1, 1, n - 1, n - 1);
	for(var i = 0; i < n; i++) {
		var t = i / (n - 1);
		var a = points[0].clone().lerp(points[1], t);
		var b = points[0].clone().lerp(points[2], t);
		for(var j = 0; j < n; j++) {
			var k = i * n + j;
			var tt = j / (n - 1);
			var v = a.clone().lerp(b, tt);
			var bary = getBarycentric(v, points[0], points[1], points[2]);
			var weight =
				sinWindow(bary.x) *
				sinWindow(bary.y) * 
				sinWindow(bary.z);
			curvedGeometry.vertices[k] = v.clone().add(offset.clone().multiplyScalar(weight));
		}
	}
	curvedGeometry.computeFaceNormals();
	return curvedGeometry;
}