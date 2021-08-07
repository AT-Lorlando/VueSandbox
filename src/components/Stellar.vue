<template>
  <div id="container">
    <!-- <div v-if="page" id="info">Description</div> -->
  </div>
</template>

<script>
import * as THREE from 'three';
import Stats from 'stats-js';
import { OrbitControls } from './OrbitControl.js';
import { rotateAroundObjectAxis } from './RotateAround.js';
import { changeX } from '../App.vue'

const CAMERA_DIST = 3000

let SCREEN_WIDTH = window.innerWidth;
let SCREEN_HEIGHT = window.innerHeight;
let aspect = SCREEN_WIDTH / SCREEN_HEIGHT;
let clicked = false, page = false;

let cameraUpdater = []

let container, stats;
let scene, renderer;
let activeStar, toStar = null, extoStar, count=0;

let starTab = [], meshTab = [], cameraTab = [], satelliteTab = [];
let sun, starPassion, starSkill, starDegree, starCamera;
let satelliteSkillCampus;

let camera, cameraTraveler, cameraLock, activeCamera, cameraDebug;
let cameraHelper, cameraTravelerHelper, cameraLockHelper;
const frustumSize = 600;

var controls;

let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();

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
      new THREE.MeshBasicMaterial( { color: this.clr, wireframe: true } )
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

/* Initial settings for a threeD world*/
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


// Add event listeners
window.addEventListener("keydown", onKeyDown, false);
document.addEventListener("pointerdown", onPointerDown, false);
// document.addEventListener("pointermove", onPointerHover, false);
document.addEventListener("pointermove", onPointerMove, false);
// document.addEventListener("pointerup", onPointerUp, false);
window.addEventListener( 'resize', onWindowResize );

starInit();
backgroundInit();
cameraInit();
animate();

function reset() {
  cameraTab.forEach(cam => {
    scene.remove(cam)        
    });
  cameraInit();
  cameraUpdater = []
  controls = new OrbitControls( camera, renderer.domElement );
}

function onKeyDown( event ) {
  switch (event.keyCode) {
    case 27:
      reset();
      break;
    case 65:
      changeX()
      // console.log(page)
      break;
    case 79:
      toStar = starSkill;
      break;
    case 80:
      activeCamera = cameraTab[(cameraTab.indexOf(activeCamera)+1)%cameraTab.length]
      console.log(activeCamera.name)
      break;
  
    default:
      console.log(event.keyCode)
      break;
  }
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
  cameraTab = [
    camera = new THREE.PerspectiveCamera( 50, aspect, 45, 50000 ),
    cameraTraveler = new THREE.PerspectiveCamera( 50, aspect, 150, 5000 ),
    cameraLock = new THREE.PerspectiveCamera( 50, aspect, 150, 5000 ),
    cameraDebug = new THREE.PerspectiveCamera( 50, aspect, 1, 10000 )
  ]

  camera.name = "Principal camera"
  cameraTraveler.name = "Traveling camera"
  cameraLock.name = "Locked view camera"
  cameraDebug.name = "Debuging camera"
  
  camera.position.z = CAMERA_DIST*Math.cos(25 * (Math.PI/180));
  camera.position.y = CAMERA_DIST*Math.sin(25 * (Math.PI/180));
  controls = new OrbitControls( cameraDebug, renderer.domElement );
  // controls.autoRotate = true; 
  cameraDebug.position.z = CAMERA_DIST*2*Math.cos(45 * (Math.PI/180));
  cameraDebug.position.y = CAMERA_DIST*2*Math.sin(45 * (Math.PI/180));
  cameraTraveler.position.z = 500;
  cameraTraveler.position.y = 500;
  cameraLock.position.z = 500;
  cameraLock.position.y = 500;

  scene.add( cameraTraveler );
  scene.add( cameraLock );


  activeCamera = camera;
  cameraDebug.lookAt( sun.mesh.position )
  camera.lookAt( sun.mesh.position )

  // cameraHelper = new THREE.CameraHelper( camera );
  // scene.add( cameraHelper );
  // cameraTravelerHelper = new THREE.CameraHelper( cameraTraveler );
  // scene.add( cameraTravelerHelper );
  // cameraLockHelper = new THREE.CameraHelper( cameraLock );
  // scene.add( cameraLockHelper );
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
cameraTraveler on a traveling to the target star position*/
function Transition(camera, toStar, r) {
  console.log('Transition')
  if(!extoStar) { //First dt where the transition is hapening
    console.log("Yes")
    setPos(cameraTraveler, activeCamera)
    activeCamera = cameraTraveler
    
    extoStar = toStar
    
    return 1
  } 
  else {
    let xDist = toStar.mesh.position.x-cameraTraveler.position.x, zDist = toStar.mesh.position.z-cameraTraveler.position.z;
    
    if((toStar == extoStar) //If the target the same target as the old iteration of the function -> going on the same travel
    && (Math.abs(xDist) > (toStar.dist? toStar.dist*toStar.orbitalSpeed/75 : 10) 
    || Math.abs(zDist) >  (toStar.dist? toStar.dist*toStar.orbitalSpeed/75 : 10)) //If the camera position is near to the target star
    ) {
    activeCamera.lookAt ( toStar.mesh.position )
    extoStar = toStar;
    //Approching the targeted position with a preshoot of the the path
    cameraTraveler.position.x += speed(xDist)+ (toStar.dist* Math.sin( (r+0.003) * toStar.orbitalSpeed)-cameraTraveler.position.x)*0.08 
    cameraTraveler.position.z += speed(zDist)+ (toStar.dist* Math.cos( (r+0.003) * toStar.orbitalSpeed)-cameraTraveler.position.z)*0.08
    return 1;
  }
  else { //Travel finished
    cameraUpdater.push({camera: cameraLock, star: toStar})
    controls = new OrbitControls( cameraLock, renderer.domElement );

    // setPos(cameraLock, cameraTraveler)
    // cameraLock.lookAt(toStar.mesh.position)
    //Linking the cameraLock to the targeted star
    // scene.remove( toStar.mesh )
    // toStar.mesh.add( cameraLock )
    // scene.add( toStar.mesh )
    //reset the camera position
    // cameraTraveler.position.x = 0
    // cameraTraveler.position.y = 0
    // cameraTraveler.position.z = 0
    extoStar = null;
    activeCamera = cameraLock
    return 0;
  }}
}

function setPos(from, to, all = true) {
  if(all) {
    from.position.x = to.position.x
    from.position.y = to.position.y
    from.position.z = to.position.z
  } else {
    from.position.x = to.position.x
    from.position.y = CAMERA_DIST
    from.position.z = to.position.z
  }
}

function onWindowResize() {

  SCREEN_WIDTH = window.innerWidth;
  SCREEN_HEIGHT = window.innerHeight;
  aspect = SCREEN_WIDTH / SCREEN_HEIGHT;

  renderer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT );

  camera.aspect = aspect;
  camera.updateProjectionMatrix();

  cameraTraveler.aspect = aspect;
  cameraTraveler.updateProjectionMatrix();
}

function meshclicked( mesh ) {
  switch (mesh) {
    case sun.mesh:
      console.log('Sun mesh')
      toStar = sun
      
      break;
    case starSkill.mesh:
      console.log("Star skill")
      toStar = starSkill

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
  if (!(toStar && Transition(camera, toStar, r))) {
    activeStar = toStar ? toStar : activeStar
    toStar = null;
    extoStar = null;
    
  }

  if (cameraUpdater.length > 0) {
    console.log('Locked')
    setPos(cameraUpdater[0].camera, cameraUpdater[0].star.mesh, false)
    cameraUpdater[0].camera.lookAt(cameraUpdater[0].star.mesh.position)  
  }

  renderer.clear();
  renderer.setViewport(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT );
  renderer.render( scene, activeCamera );
  renderer.setViewport( 0, 0, SCREEN_WIDTH / 3.5, SCREEN_HEIGHT / 3.5);
  renderer.render( scene, cameraDebug );
}

export default {
  name: 'Stellar',
  props: ['pageShow'],
  data() {
    return {
    }
  },
  methods: {
  }
}
</script>

<style>
#info {
	position: absolute;
	top: 10px;
	width: 100%;
	text-align: center;
	z-index: 100;
	display:block;
}
</style>