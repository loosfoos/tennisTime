	var renderer	= new THREE.WebGLRenderer({
		antialias	: true
	});
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.setClearColor( 'lightblue', 1 );
	document.body.appendChild( renderer.domElement );

	var onRenderFcts= [];
	var scene	= new THREE.Scene();
	var camera	= new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 10000);
	camera.position.z = 500;
	camera.position.x = 500;
	camera.position.y = 500;


	var worldx	= new THREEx.CannonWorld().start();
	worldx.world.defaultContactMaterial.friction = 0.5;

	//////////////////////////////////////////////////////////////////////////////////
	//		set 3 point lighting						//
	//////////////////////////////////////////////////////////////////////////////////

	;(function(){
		// add a ambient light
		var light	= new THREE.AmbientLight( 0x020202 );
		scene.add( light );
		// add a light in front
		var light	= new THREE.DirectionalLight('white', 1);
		light.position.set(0.5, 0.5, 2);
		scene.add( light );
		// add a light behind
		var light	= new THREE.DirectionalLight('white', 0.75);
		light.position.set(-0.5, -0.5, -2);
		scene.add( light );
	})()


	var reboundMaterial	= new CANNON.Material('ball');
	worldx.world.addContactMaterial(new CANNON.ContactMaterial(
		reboundMaterial,
		reboundMaterial,
		0.4,	// friction
		0.65	// Restitution
	));

	var debugMaterial = new THREE.MeshBasicMaterial( {visible:false} );

//////////////////////////////////////////////////////////////////////////////////
//		Tennis ball								//
//////////////////////////////////////////////////////////////////////////////////

	;(function(){
		var mesh	= THREEx.SportBalls.createTennis();
		scene.add(mesh);
		mesh.name	= 'ball';
		mesh.receiveShadow	= true;
		mesh.castShadow	= true;
		mesh.position.x	= +60;
		mesh.position.y	=  50;	
		mesh.position.z	=  10;			
		mesh.scale.set(10,10,10);
		var body	= new THREEx.CannonBody({
				mesh	: mesh,
				mass	: 1,
				material: reboundMaterial,
			}).addTo(worldx);
			onRenderFcts.push(function(delta, now){
				body.update(delta, now);
			});
	})()
	
	;(function(){
	var objURL = 'obj/tennisRacket.obj';
	var loader = new THREE.OBJLoader();
	loader.load( objURL, function ( object ) {
	scene.add( object );
  	object.name	= 'tennisRacket';
	object.receiveShadow	= true;
	object.castShadow	= true;
	object.position.x	= 1000;
	object.position.y	= 5;
	object.position.z	= -200;
	object.scale.set(0.02, 0.02, 0.02);

	//Bounding box of the racket
	var bbox = new THREE.Box3().setFromObject(object);
	//TODO: divide the racket into 2 bounding box.
	var boundingObject =  new THREE.CubeGeometry(bbox.max.x - bbox.min.x, bbox.max.y - bbox.min.y, bbox.max.z - bbox.min.z, 3,3,3);
	var material	= new THREE.MeshLambertMaterial({
		visible: false
	});
	var mesh	= new THREE.Mesh(boundingObject, material);
	mesh.name = "racket";
	mesh.position.x	= (bbox.max.x + bbox.min.x)/2;
	mesh.position.y	= (bbox.max.y + bbox.min.y)/2;
	mesh.position.z	= (bbox.max.z + bbox.min.z)/2;
	mesh.receiveShadow	= true;
	mesh.castShadow		= true;
	var prevPos = {
		x: mesh.position.x,
		y: mesh.position.y,
		z: mesh.position.z
	};

	scene.add( mesh );						
	var body	= new THREEx.CannonBody({
			mesh	: mesh,
			mass	: 0,
			material: reboundMaterial,
		}).addTo(worldx);

		body.body.angularVelocity.set(0,0,0);
		body.body.motionstate = CANNON.Body.STATIC
		onRenderFcts.push(function(delta, now){
			body.update(delta, now);
		var bbox = new THREE.Box3().setFromObject(object);
			// copy body.position to object.position
			object.position.x += body.body.position.x - prevPos.x;
			object.position.y += body.body.position.y - prevPos.y;
			object.position.z += body.body.position.z - prevPos.z;

			prevPos.x = body.body.position.x;
			prevPos.y = body.body.position.y;
			prevPos.z = body.body.position.z;
			// copy body.quaternion to object.quaternion
			object.quaternion.x	= body.body.quaternion.x;
			object.quaternion.y	= body.body.quaternion.y;
			object.quaternion.z	= body.body.quaternion.z;
			object.quaternion.w	= body.body.quaternion.w;
		});


	//////////////////////////////////////////////////////////////////////////////////
	//		handle the connection													//
	//////////////////////////////////////////////////////////////////////////////////
	var exampleSocket = new WebSocket("ws://127.0.0.1:1880/ws/socketRcp", "protocolOne");
        exampleSocket.onmessage = function(event) {
            var values = event.data.split(",");
            body.body.quaternion.w = parseFloat(values[0]);
            body.body.quaternion.x = parseFloat(values[1]);
            body.body.quaternion.y = parseFloat(values[2]);
            body.body.quaternion.z = parseFloat(values[3]);
            var worldPoint	= new CANNON.Vec3(body.body.position.x, body.body.position.y, body.body.position.z);
            var force = new CANNON.Vec3(values[4]*100,values[5]*100,values[6]*100);
			body.body.applyForce(force,worldPoint);
        }
	} );
})()

var onProgress = function (e){
	//TODO: loading window in the beginning
	console.log(e)
};
var onError = function(e){
	//TODO: Toast message for errors
	console.log(e)
};

;(function(){				// model
var loader = new THREE.JSONLoader();

// load a resource
loader.load(
	// resource URL
	'obj/textures/terrain.js',
	// Function when resource is loaded
	function ( geometry, materials ) {
		var material = new THREE.MultiMaterial( materials );
		var object = new THREE.Mesh( geometry, material );
		var bbox = new THREE.Box3().setFromObject(object);
		console.log(bbox);
		var floor = new THREE.PlaneGeometry( bbox.max.z - bbox.min.z, bbox.max.x - bbox.min.x);
		var net = new THREE.PlaneGeometry( (bbox.max.z - bbox.min.z)*6.5/9, bbox.max.y - bbox.min.y);
		
		var floorMesh = new THREE.Mesh( floor, debugMaterial );
		var netMesh = new THREE.Mesh( net, debugMaterial );
		floorMesh.lookAt(floorMesh.position.clone().add(new THREE.Vector3(0,1,0)))
		netMesh.lookAt(floorMesh.position.clone().add(new THREE.Vector3(1,0,0)))
		netMesh.position.y = (bbox.max.y + bbox.min.y)/2;
		//scene.add( floorMesh );
		//scene.add( netMesh );

		var body	= new THREEx.CannonBody({
				mesh	: floorMesh,
				mass	: 0,
				material: reboundMaterial,
			}).addTo(worldx);
			onRenderFcts.push(function(delta, now){
				body.update(delta, now);
			});
		var body2	= new THREEx.CannonBody({
				mesh	: netMesh,
				mass	: 0,
				material: reboundMaterial,
			}).addTo(worldx);
			onRenderFcts.push(function(delta, now){
				body2.update(delta, now);
			});
		scene.add( object );
	}
);
})();
      // Create an event listener that resizes the renderer with the browser window.
      window.addEventListener('resize', function() {
        var WIDTH = window.innerWidth,
            HEIGHT = window.innerHeight;
        renderer.setSize(WIDTH, HEIGHT);
        camera.aspect = WIDTH / HEIGHT;
        camera.updateProjectionMatrix();
      });

      // Add OrbitControls so that we can pan around with the mouse.
      controls = new THREE.OrbitControls(camera, renderer.domElement);


	//////////////////////////////////////////////////////////////////////////////////
	//		render the scene						//
	//////////////////////////////////////////////////////////////////////////////////
	onRenderFcts.push(function(){
		renderer.render( scene, camera );		
      	controls.update();
      	camera.lookAt( scene.position )
	})
	
	//////////////////////////////////////////////////////////////////////////////////
	//		loop runner							//
	//////////////////////////////////////////////////////////////////////////////////
	var lastTimeMsec= null
	requestAnimationFrame(function animate(nowMsec){
		// keep looping
		requestAnimationFrame( animate );
		// measure time
		lastTimeMsec	= lastTimeMsec || nowMsec-1000/60
		var deltaMsec	= Math.min(200, nowMsec - lastTimeMsec)
		lastTimeMsec	= nowMsec
		// call each update function
		onRenderFcts.forEach(function(onRenderFct){
			onRenderFct(deltaMsec/1000, nowMsec/1000)
		})
	})

