// A container to place our objects into
var container, stats;
var camera, scene, renderer, controls;
var listener, audioLoader, audioArray, analyser;
var pointLight, skyBox, ringGroup;
var colorTracker;
init();
render();
function init() {
scene = new THREE.Scene();
// stats = new Stats();
// document.body.appendChild( stats.dom );
/*
* PerspectiveCamera( fov, aspect, near, far )
* fov — Camera  vertical field of view.
* aspect — Camera  aspect ratio.
* near — Camera near plane. (Objects outside the near and far plane won't be rendered)
* far — Camera far plane.
*/
camera = new THREE.PerspectiveCamera( 75,
    window.innerWidth/window.innerHeight, 0.1, 10000 );
// Move camera back and above the object
camera.position.set(-0.00008331137458831904, 1557, 0.0004590835129425484);
colorTracker = new ColorTracker();
//Create an AudioListener and add it to the camera
listener = new THREE.AudioListener();
camera.add( listener );
// create an Audio source
sound = new THREE.Audio( listener );
audioLoader = new THREE.AudioLoader();
var url = '../WebAssets/audio/ThoseDays.mp3'
// Load a sound and set it as the Audio object's buffer
audioLoader.load( url , function( buffer ) {
  sound.setBuffer( buffer );
  sound.setLoop(true);
  sound.setVolume(0.5);
  sound.play();
},
function ( xhr ) {
  console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
},
function ( xhr ) {
  console.log( 'An error happened' );
});

//Create an AudioAnalyser, passing in the sound and desired fftSize
var bufferLength = 512;
analyser = new THREE.AudioAnalyser( sound, bufferLength );
audioArray = new Uint8Array(bufferLength);
// The threejs webgl renderer
renderer = new THREE.WebGLRenderer({antialias: true});
// Tell renderer the dimensions of our screen
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setPixelRatio( window.devicePixelRatio );
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Attach renderer to DOM element
document.body.appendChild( renderer.domElement );
// adding orbit controls to allow camera movement with the cursor
controls = new THREE.OrbitControls( camera, renderer.domElement );
controls.enableDamping = true;
controls.dampingFactor = 0.9;
controls.zoomSpeed = 0.5;
controls.rotateSpeed = 0.5;
// Create our objects geometry with built-in sphere knot algorithim
geometry = new THREE.SphereGeometry( 5, 32, 32 );
// The material properties of our object
material = new THREE.MeshStandardMaterial( { color: 0xFFFFFF,
  emissive: 0xFFFFFF, emissiveIntensity:1.0, side: THREE.DoubleSide } ); // color is in hexidecimal
// Use our geometry and material to create a mesh (What's a mesh? https://en.wikipedia.org/wiki/Polygon_mesh)
sphere = new THREE.Mesh( geometry, material );
var skyBoxMat = new THREE.MeshStandardMaterial( { roughness:0.4, color: 0xFFFFFF,
  emissive: 0x000000, emissiveIntensity:0, side: THREE.DoubleSide } ); // color is in hexidecimal
var skyBoxGeom = new THREE.SphereGeometry(2500, 32, 32);
skyBox = new THREE.Mesh(skyBoxGeom, skyBoxMat);
scene.add(skyBox);
/* Create a point light source with color 0xdddddd, intesity 0.5 */
pointLight = new THREE.PointLight(0xFFFFFF, 1.0);
pointLight.shadowCameraVisible = true;
sphere.add(pointLight);
scene.add( sphere );
var geometry = new THREE.CircleBufferGeometry( 8, 20 );
ringGroup = new THREE.Group();
ringGroup.castShadow = true;
ringGroup.recieveShadow = true;
var ringCount = 40;
if( window.mobileAndTabletcheck() ) {
  ringCount = 25;
}
var ringRadius = 50;
for(var i = 0; i < ringCount; i++) {
  ringGroup.add(generateRing(i * 3, i * ringRadius + ringRadius, ringGroup));
}
scene.add(ringGroup);
window.addEventListener( 'resize', onWindowResize, false );
};
function generateRing(count, radius, group) {
var ring = new THREE.Group();
var material = new THREE.MeshStandardMaterial( { color: 0xFFFFFF,
  emissive: 0xFFFFFF, emissiveIntensity:0, side: THREE.DoubleSide } ); // color is in hexidecimal
var geometry = new THREE.CircleBufferGeometry( 8, 20 );
for(var i = 0; i < count; i++) {
  var angle = ((1.0 * i) / count ) * Math.PI * 2;
  var x = radius * Math.cos( angle );
  var z = radius * Math.sin( angle );
  var newSphere = new THREE.Mesh( geometry, material );
  newSphere.position.set(x, -20, z);
  newSphere.castShadow = true;
  newSphere.recieveShadow = true;
  newSphere.lookAt(camera.position);
  ring.add(newSphere);
}
ring.radius = radius;
return ring;
};
// Our rendering loop
function render() {
// Rendering function is called each time the
// browser requests a new frame
requestAnimationFrame( render );
controls.update();
colorTracker.update();
// stats.update();
// Rotate our object
var size = analyser.getAverageFrequency() * 0.01;
audioArray = analyser.getFrequencyData();

//Update center sphere pos, size and color
var sphereScale = size * 8 + 2;
sphere.scale.set(sphereScale, sphereScale, sphereScale);
sphere.material.emissiveIntensity = size * 2;
sphere.position.y = 0.9 * sphere.position.y + 0.1 * (size * 800 - 150);
pointLight.color = colorTracker.getColor(analyser.getAverageFrequency(), 200);
pointLight.intensity = size * 1.5;
skyBox.roughness = size * 1.5;
for(var i = 0; i < ringGroup.children.length; i++) {
  //update change the rotation of the rings over time
  var curr = ringGroup.children[i];
  curr.rotation.y += Math.sin(Date.now() *0.001 + i * 0.15) * 0.02 * colorTracker.tracker1.red/255;
  curr.rotation.z += Math.cos(Date.now() * 0.001 + i * 0.1) * 0.005;
  curr.position.y = 0.6 * curr.position.y + 0.4 * audioArray[i] ;
  //update ring size based off audio
  for(var j = 0; j < curr.children.length; j++) {
    var scale = audioArray[i] * 0.013 ;
    curr.children[j].scale.set(scale, scale, scale);
    curr.children[j].lookAt(sphere.position);
  }
}
renderer.render(scene, camera);
};
function onWindowResize( event ) {
camera.aspect = window.innerWidth / window.innerHeight;
camera.updateProjectionMatrix();
renderer.setSize( window.innerWidth, window.innerHeight );
};
