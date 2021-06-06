<template>
  <div id="container">
  </div>
</template>

<script>
import * as THREE from 'three';


import Stats from 'stats-js';

let SCREEN_WIDTH = window.innerWidth;
let SCREEN_HEIGHT = window.innerHeight;
let aspect = SCREEN_WIDTH / SCREEN_HEIGHT;

let container, stats;
let camera, scene, renderer, activeCamera;
let activeStar, toStar = null, count=0;
let extoStar;

let starTab = [];
let sun, starPassion, starSkill, starDegree, starCamera;
let satelliteTab = [];
let satelliteSkillCampus;

let cameraBis, cameraTierce;
let cameraBisHelper, cameraTierceHelper;
const frustumSize = 600;

class Star {
  constructor( parameters) {
    this.dist=0;
    this.height=20;
    this.clr=0xffffff;
    this.rotationSpeed=0;
    this.orbitalSpeed=1;
    this.axe=0;
    this.orbiteWith=null,

    this.setValues( parameters );

    this.mesh=new THREE.Mesh(
      new THREE.SphereGeometry( this.height, 8, 8 ),
      new THREE.MeshBasicMaterial( { color: this.clr, wireframe: true } )
    );

    if (this.orbiteWith) {
      this.orbiteWith.mesh.add( this.mesh )
    }

  }

  orbite(r) {
    this.mesh.position.x = this.dist* Math.cos( r * this.orbitalSpeed);
    this.mesh.position.y = this.dist* Math.sin( r * this.orbitalSpeed);  
  }

  rotate(r) {
    this.mesh.rotation.z = Math.PI / 2 * r * this.rotationSpeed;
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


init();
animate();

function init() {

  container = document.createElement( 'div' );
  document.body.appendChild( container );

  scene = new THREE.Scene();

  // Adding camera

  camera = new THREE.PerspectiveCamera( 50, aspect, 1, 10000 );
  camera.position.z = 1000;
  camera.position.y = -1500;

  cameraBis = new THREE.PerspectiveCamera( 50, aspect, 150, 1000 );
  cameraBis.position.z = 500;
  cameraBis.position.y = 0;

  cameraTierce = new THREE.PerspectiveCamera( 50, aspect, 150, 1000 );
  cameraTierce.position.z = 500;
  cameraTierce.position.y = 0;

  scene.add( cameraBis );

  cameraBisHelper = new THREE.CameraHelper( cameraBis );
  scene.add( cameraBisHelper );

  cameraTierceHelper = new THREE.CameraHelper( cameraTierce );
  scene.add( cameraTierceHelper );

  // Adding some stars

  starTab.push(
    sun = new Star({height: 100, clr:0xff0000, rotationSpeed: -1}), 
    starSkill = new Star({dist:500, clr:0x00ff00, orbitalSpeed: 0.7}), 
    starPassion = new Star({dist:1000, orbitalSpeed:0.2}), 
    starDegree = new Star({dist:1500, orbitalSpeed:0.1}),
    
  )
  starCamera = new Star({orbitalSpeed: 0, rotationSpeed:0})
  // scene.add( starCamera.mesh )

  activeStar = sun;
  activeCamera = camera;

  //Adding some satellite

  satelliteTab.push(
    satelliteSkillCampus = new Star({height: 10, dist:50, orbitalSpeed:30, orbiteWith: starSkill}),
  )

  console.log(starTab)

  //Adding each stars and theirs childrens to the whole scene

  starTab.forEach(star => {
      scene.add( star.mesh );
    }
  );
  

  //

  const geometry = new THREE.BufferGeometry();
  const vertices = [];

  for ( let i = 0; i < 10000; i ++ ) {

    vertices.push( THREE.MathUtils.randFloatSpread( 2000 ) ); // x
    vertices.push( THREE.MathUtils.randFloatSpread( 2000 ) ); // y
    vertices.push( THREE.MathUtils.randFloatSpread( 2000 ) ); // z

  }

  geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );

  const particles = new THREE.Points( geometry, new THREE.PointsMaterial( { color: 0x888888 } ) );
  scene.add( particles );

  //

  renderer = new THREE.WebGLRenderer( { antialias: true } );
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT );
  container.appendChild( renderer.domElement );

  renderer.autoClear = false;

  //

  stats = new Stats();
  container.appendChild( stats.dom );

  //

  window.addEventListener( 'resize', onWindowResize );
  document.addEventListener( 'keydown', onKeyDown );

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
    return 0;
  }
}


function onKeyDown( event ) {

  switch ( event.keyCode ) {

    case 79: /*O*/
      if (!toStar) {
        count = (count+ 1)%starTab.length
        activeStar = starTab[count]
      } else {
        console.log('Cant beacause traveling')
      }
      break;

    case 80: /*P*/
      count = (count+ 1)%starTab.length
      toStar = starTab[count] == activeStar ? null : starTab[count];
      if (activeCamera == cameraTierce) {
        cameraBis.position.x = activeStar.mesh.position.x;
        cameraBis.position.y = activeStar.mesh.position.y;
      }
      activeCamera = cameraBis;
      //(null if toStar[count] = actualStar else starTab[count]);
      // cameraTransition(camera, activeStar, starTab[(count+ 1)%starTab.length])
      // activeHelper = cameraBisHelper;
      break;
    
    case 81: /*Q*/
      starCamera.mesh.position.z = 250;
      break;
  }

}

//

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

//

function animate() {

  requestAnimationFrame( animate );

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
    activeCamera = cameraTierce;
  }

  // cameraBis.lookAt( sun.mesh.position );
  renderer.clear();

  renderer.setViewport(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT );
  renderer.render( scene, activeCamera );

  camera.lookAt( sun.mesh.position );
  renderer.setViewport( 0, 0, SCREEN_WIDTH / 4, SCREEN_HEIGHT / 4);
  renderer.render( scene, camera );
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