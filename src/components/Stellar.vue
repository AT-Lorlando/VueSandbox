<template>
  <div id="container">
  </div>
</template>

<script>
import * as THREE from 'three';
import Stats from 'stats-js';
import { OrbitControls } from './OrbitControl.js';

const CAMERA_DIST = 3000

var controls;

let SCREEN_WIDTH = window.innerWidth;
let SCREEN_HEIGHT = window.innerHeight;
let aspect = SCREEN_WIDTH / SCREEN_HEIGHT;
let mouseX = 0, mouseY = 0, clicked = false;

let container, stats;
let camera, scene, renderer, activeCamera, cameraDebug;
let activeStar, toStar = null, count=0;
let extoStar;

let starTab = [], meshTab = [];
let sun, starPassion, starSkill, starDegree, starCamera;
let satelliteTab = [];
let satelliteSkillCampus;

let cameraBis, cameraTierce;
let cameraHelper, cameraBisHelper, cameraTierceHelper;
const frustumSize = 600;

var rotWorldMatrix, rotObjectMatrix;

/* Star object 
  dist = distance with the sun
  height = size of the star
  clr = color
  ..
  ..
  axe = axe parameter, maybe useful later
  orbiteWith = For satellite, link to the star*/
class Star {
  constructor( parameters) {
    this.dist=0;
    this.height=20;
    this.clr=0xffffff;
    this.rotationSpeed=0;
    this.orbitalSpeed=1;
    this.axis = new THREE.Vector3(0,1,0);
    this.orbiteWith=null,

    this.setValues( parameters );

    this.mesh=new THREE.Mesh(
      new THREE.SphereGeometry( this.height, 8, 8 ),
      new THREE.MeshBasicMaterial( { color: this.clr, wireframe: false } )
    );

    // this.mesh.geometry.computeBoundingSphere();


    this.orbit = new THREE.Line(
      new THREE.EdgesGeometry(
        new THREE.CircleGeometry(this.dist, 90).rotateX(Math.PI/2)),
        new THREE.MeshBasicMaterial({
          color: this.orbiteWith ? 0x00ff00 : 0xff0000,
          transparent: true,
          opacity: .5,
          side: THREE.BackSide})
    );
  }

  orbite(r) {
    if (this.orbiteWith) {
      this.mesh.position.z = this.orbiteWith.mesh.position.z + this.dist* Math.cos( r * this.orbitalSpeed)
      this.mesh.position.x = this.orbiteWith.mesh.position.x + this.dist* Math.sin( r * this.orbitalSpeed)
    } else {
      this.mesh.position.z = this.dist* Math.cos( r * this.orbitalSpeed);
      this.mesh.position.x = this.dist* Math.sin( r * this.orbitalSpeed); 
    }
  }

  rotate(r) {
    rotateAroundObjectAxis(this.mesh, this.axis, (r%360)*Math.PI/36000*this.rotationSpeed)
  }

  update(r) {
    this.orbite(r)
    this.rotate(r)
  }

  setValues( values ) {

		if ( values === undefined ) return;

		for ( const key in values ) {

			const newValue = values[ key ];

			if ( newValue === undefined ) {
				console.warn( 'Star: \'' + key + '\' parameter is undefined.' );
				continue;
			}

			const currentValue = this[ key ];

			if ( currentValue === undefined ) {
				console.warn( 'Star:' + this.type + ': \'' + key + '\' is not a property of this material.' );
				continue;
			}

			if ( currentValue && currentValue.isColor ) {

				currentValue.set( newValue );

			} else if ( ( currentValue && currentValue.isVector3 ) && ( newValue && newValue.isVector3 ) ) {

				currentValue.copy( newValue );

			} else {

				this[ key ] = newValue;

			}
		}
	}
};

scene = new THREE.Scene();
const axesHelper = new THREE.AxesHelper( 1000 );
scene.add( axesHelper );

container = document.createElement( 'div' );
document.body.appendChild( container );

renderer = new THREE.WebGLRenderer( { antialias: true } );
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT );
container.appendChild( renderer.domElement );
renderer.autoClear = false;

stats = new Stats();
container.appendChild( stats.dom );

camera = new THREE.PerspectiveCamera( 50, aspect, 45, 50000 );
controls = new OrbitControls( camera, renderer.domElement );
// controls.autoRotate = true;

starInit();
backgroundInit();
cameraInit();
animate();

activeCamera = camera;
cameraDebug.lookAt( sun.mesh.position )

camera.lookAt( sun.mesh.position )

let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();

// Add event listeners
document.addEventListener("pointerdown", onPointerDown, false);
// document.addEventListener("pointermove", onPointerHover, false);
document.addEventListener("pointermove", onPointerMove, false);
// document.addEventListener("pointerup", onPointerUp, false);
window.addEventListener( 'resize', onWindowResize );

function onKeyDown( event ) {
  console.log('Key Down');
}

function onPointerDown( event ) {
  clicked = true
  document.addEventListener("pointerup", onPointerUp, false);
}

function onPointerUp ( event ) {
  clicked = false;
  document.removeEventListener('pointerup', onPointerUp, false);

  raycaster.setFromCamera( mouse, activeCamera );
    const intersects = raycaster.intersectObjects( meshTab );
    if ( intersects.length > 0 ) {
      meshclicked(intersects[0].object)
    }
  
}

function onPointerMove( event ) {
	mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
}

function onPointerHover( event )
{
  //
}

function cameraInit() {
  // Adding camera
  camera.position.z = CAMERA_DIST*Math.cos(25 * (Math.PI/180));
  camera.position.y = CAMERA_DIST*Math.sin(25 * (Math.PI/180));  

  cameraDebug = new THREE.PerspectiveCamera( 50, aspect, 1, 10000 );
  cameraDebug.position.z = CAMERA_DIST*2*Math.cos(45 * (Math.PI/180));
  // cameraDebug.position.y = CAMERA_DIST*2*Math.sin(45 * (Math.PI/180));

  cameraBis = new THREE.PerspectiveCamera( 50, aspect, 150, 1000 );
  cameraBis.position.z = 500;
  cameraBis.position.y = 0;

  cameraTierce = new THREE.PerspectiveCamera( 50, aspect, 150, 1000 );
  cameraTierce.position.z = 500;
  cameraTierce.position.y = 0;

  scene.add( cameraBis );

  cameraHelper = new THREE.CameraHelper( camera );
  scene.add( cameraHelper );

  // cameraBisHelper = new THREE.CameraHelper( cameraBis );
  // scene.add( cameraBisHelper );

  // cameraTierceHelper = new THREE.CameraHelper( cameraTierce );
  // scene.add( cameraTierceHelper );
}

function starInit() {
  // Adding some stars
  starTab.push(
    sun = new Star({height: 100, clr:0xff0000, rotationSpeed: -1}), 
    starSkill = new Star({dist:500, clr:0x00ff00, orbitalSpeed: 0.7}), 
    starPassion = new Star({dist:1000, orbitalSpeed:0.2, rotationSpeed: -1, axis: new THREE.Vector3(1,1,0)}), 
    starDegree = new Star({dist:1500, orbitalSpeed:0.1}),
    satelliteSkillCampus = new Star({height: 10, dist:50, orbitalSpeed:30,orbiteWith: starSkill}),
  )
  
  starCamera = new Star({orbitalSpeed: 0, rotationSpeed:0})
  // scene.add( starCamera.mesh )

  activeStar = sun;
  activeCamera = camera;

  //Adding some satellite

  satelliteTab.push(
    
  )

  console.log(starTab)

  //Adding each stars and theirs childrens to the whole scene

  starTab.forEach(star => {
      scene.add( star.mesh );
      meshTab.push(star.mesh)
      // star.orbit.geometry.vertices.shift();
      // star.orbit.rotation.x = THREE.Math.degToRad(90);
      if (star.orbiteWith) {
        star.orbiteWith.mesh.add(star.orbit)
      } else {
        scene.add( star.orbit );
      }
    }
  );
}

function backgroundInit() {
  // const geometry = new THREE.BufferGeometry();
  // const vertices = [];

  // for ( let i = 0; i < 10000; i ++ ) {

  //   vertices.push( THREE.MathUtils.randFloatSpread( 2000 ) ); // x
  //   vertices.push( THREE.MathUtils.randFloatSpread( 2000 ) ); // y
  //   vertices.push( THREE.MathUtils.randFloatSpread( 2000 ) ); // z

  // }

  // geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );

  // const particles = new THREE.Points( geometry, new THREE.PointsMaterial( { color: 0x888888 } ) );
  // scene.add( particles );
}

/* This function return a speed with the distance parameter given for the transition function*/
function speed(dist) {
  return Math.abs((dist/100))>0.01 ? (dist/100)+Math.sign(dist)*0.1 : Math.sign(dist)*0.1;
}

/*This function pick a camera and a target star, calcul the distance between them and launch the
cameraBis on a traveling to the target star position*/
function Transition(camera, toStar, r) {

  let xDist = toStar.mesh.position.x-camera.position.x, yDist = toStar.mesh.position.y-camera.position.y;

  if((toStar == extoStar || extoStar==null) //If the target the same target as the old iteration of the function -> going on the same travel
    && (Math.abs(xDist) > (toStar.dist? toStar.dist*toStar.orbitalSpeed/75 : 10) 
    || Math.abs(yDist) >  (toStar.dist? toStar.dist*toStar.orbitalSpeed/75 : 10)) //If the camera position is near to the target star
    ) {
    extoStar = toStar;

    //Approching the targeted position with a preshoot of the the path
    camera.position.x += speed(xDist)+ (toStar.dist* Math.cos( (r+0.003) * toStar.orbitalSpeed)-camera.position.x)*0.08 
    camera.position.y += speed(yDist)+ (toStar.dist* Math.sin( (r+0.003) * toStar.orbitalSpeed)-camera.position.y)*0.08
    return 1;
  }
  else { //Travel finished
    //Linking the cameraTierce to the targeted star
    scene.remove( toStar.mesh )
    toStar.mesh.add( cameraTierce )
    scene.add ( toStar.mesh )
    //reset the camera position
    camera.position.x = 0
    camera.position.y = 0
    extoStar = null;
    activeCamera = cameraTierce
    return 0;
  }
}

function rotateAroundObjectAxis(object, axis, radians) {
    rotObjectMatrix = new THREE.Matrix4();
    rotObjectMatrix.makeRotationAxis(axis.normalize(), radians);
    object.matrix.multiply(rotObjectMatrix);
    object.rotation.setFromRotationMatrix(object.matrix);
}

// Rotate an object around an arbitrary axis in world space       
function rotateAroundWorldAxis(object, axis, radians) {
    rotWorldMatrix = new THREE.Matrix4();
    rotWorldMatrix.makeRotationAxis(axis.normalize(), radians);
    rotWorldMatrix.multiply(object.matrix);
    object.matrix = rotWorldMatrix;
    object.rotation.setFromRotationMatrix(object.matrix);
}

function onWindowResize() {

  SCREEN_WIDTH = window.innerWidth;
  SCREEN_HEIGHT = window.innerHeight;
  aspect = SCREEN_WIDTH / SCREEN_HEIGHT;

  renderer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT );

  camera.aspect = aspect;
  camera.updateProjectionMatrix();

  cameraBis.aspect = aspect;
  cameraBis.updateProjectionMatrix();
}

function meshclicked( mesh ) {
  switch (mesh) {
    case sun.mesh:
      console.log('Sun mesh')
      
      break;
    case starSkill.mesh:
      console.log("Star skill")

      break;
      
    default:
      console.log("Star unaccepted")
      break;
  }
}
//

function animate() {

  requestAnimationFrame( animate );

  controls.update()
  render();
  stats.update();

}

function render() {

  const r = Date.now() * 0.0001;

  //Updating all thar star and the satellite
  starTab.forEach(star => {
    star.update(r);
  });
  satelliteTab.forEach(satellite => {
    satellite.update(r);
  })

  /* Launching Transition if a target is selected by a event listener
    If it does, when the Transition is finished, settings the old parameters to null and
    the activeCamera become the Camera linked to the targeted star */
  if (!(toStar && Transition(cameraBis, toStar, r))) {
    activeStar = toStar ? toStar : activeStar
    toStar = null;
    extoStar = null;
  }


  renderer.clear();
  renderer.setViewport(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT );
  renderer.render( scene, activeCamera );
  renderer.setViewport( 0, 0, SCREEN_WIDTH / 3.5, SCREEN_HEIGHT / 3.5);
  renderer.render( scene, cameraDebug );
}

export default {
  name: 'Stellar',
  data() {
    return {
    }
  },
  methods: {
  }
}
</script>

<style>

</style>