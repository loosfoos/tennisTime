var renderer	= new THREE.WebGLRenderer({
		antialiasing	: true
	});
	renderer.shadowMapEnabled	= true
	renderer.setSize( window.innerWidth, window.innerHeight );
	document.body.appendChild( renderer.domElement );

	var debugMaterial = new THREE.MeshBasicMaterial( {visible:true} );

	var onRenderFcts= [];
	var scene	= new THREE.Scene();
	var camera	= new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 10000);
	camera.position.x = 2600;
	camera.position.y = 450;
	camera.position.z = -175;

	//////////////////////////////////////////////////////////////////////////////////
	//		set 3 point lighting						//
	//////////////////////////////////////////////////////////////////////////////////

	;(function(){
		// add a ambient light
		var light	= new THREE.AmbientLight( 0x020202 )
		scene.add( light )
		// add a light front right
		var light	= new THREE.DirectionalLight('white', 1)
		light.position.set(0.5, 0.5, 2).multiplyScalar(10)
		scene.add( light )
		light.castShadow	= true
		light.shadowCameraNear	= 0.01
		light.shadowCameraFar	= 250
		light.shadowCameraFov	= 45

		light.shadowCameraLeft	= -20
		light.shadowCameraRight	=  20
		light.shadowCameraTop	=  30
		light.shadowCameraBottom= -30
		// light.shadowCameraVisible	= true

		light.shadowBias	= 0.001
		light.shadowDarkness	= 0.6

		light.shadowMapWidth	= 2048
		light.shadowMapHeight	= 2048

		// // add a light behind
		// var light	= new THREE.DirectionalLight('white', 0.75)
		// light.position.set(-0.5, -0.5, -2)
	})()

	//////////////////////////////////////////////////////////////////////////////////
	//		oimo world							//
	//////////////////////////////////////////////////////////////////////////////////

	var world	= new OIMO.World(1/360, 2, 8)
	setInterval(function(){
		world.step()
	}, 1000/180);

	//////////////////////////////////////////////////////////////////////////////////
//		Tennis ball								//
//////////////////////////////////////////////////////////////////////////////////

	;(function(){
		var mesh	= THREEx.SportBalls.createTennis();
		mesh.receiveShadow	= true
		mesh.castShadow		= true
		mesh.scale.multiplyScalar(40)
		mesh.position.x	= 1000;
		mesh.position.y	= 200;
		mesh.position.z	= -200;

			scene.add( mesh )

	// create IOMO.Body from mesh
	var body	= THREEx.Oimo.createBodyFromMesh(world, mesh)

	// add an updater for them
	var updater	= new THREEx.Oimo.Body2MeshUpdater(body, mesh)
	onRenderFcts.push(function(delta){
		updater.update()
	})
	// 
	/*body.body.linearVelocity.x	= 0
	body.body.linearVelocity.y	= 1
	body.body.linearVelocity.z	= -5
	
	body.body.angularVelocity.x	= -Math.PI*2*/
	// body.body.angularVelocity.y	= 0
	// body.body.angularVelocity.z	= 0
})()

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

		var floor = new THREE.BoxGeometry( bbox.max.x - bbox.min.x, 0.1, bbox.max.z - bbox.min.z);
		var net = new THREE.BoxGeometry( (bbox.max.z - bbox.min.z)*6.5/9, bbox.max.y - bbox.min.y, 0.1);
		
		var floorMesh = new THREE.Mesh( floor, debugMaterial );
		var netMesh = new THREE.Mesh( net, debugMaterial );

		netMesh.position.y = (bbox.max.y + bbox.min.y)/2;
		netMesh.rotation.y = Math.PI / 2;

		floorMesh.receiveShadow	= true;
		netMesh.receiveShadow = true;

		var stepBody	= THREEx.Oimo.createBodyFromMesh(world, floorMesh, false)
		scene.add(floorMesh)

		var stepBody2	= THREEx.Oimo.createBodyFromMesh(world, netMesh, false)
		scene.add(netMesh)

		var updater	= new THREEx.Oimo.Body2MeshUpdater(stepBody, floorMesh)
		var updater2	= new THREEx.Oimo.Body2MeshUpdater(stepBody2, netMesh)
		onRenderFcts.push(function(delta){
			updater.update()
			updater2.update()
		})
		scene.add( object );
	}
);
})();

var racket = null;
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
	var boundingObject =  new THREE.BoxGeometry((bbox.max.x - bbox.min.x), (bbox.max.y - bbox.min.y)/2, bbox.max.z - bbox.min.z);

	var mesh	= new THREE.Mesh(boundingObject, debugMaterial);
	racket = mesh;
	mesh.name = "racket";
	mesh.position.x	= object.position.x;
	mesh.position.y	= object.position.y + (bbox.max.y - bbox.min.y)*3/4;
	mesh.position.z	= object.position.z;
	mesh.receiveShadow	= true;
	mesh.castShadow		= true;
	var prevPos = {
		x: mesh.position.x,
		y: mesh.position.y,
		z: mesh.position.z
	};

	scene.add(mesh);			
	var stepBody	= THREEx.Oimo.createBodyFromMesh(world, mesh, false)
	//scene.add(mesh)	
	var curVelocities = [];
	var updater	= new THREEx.Oimo.Body2MeshUpdater(stepBody, mesh);
	var rendering = false;
	//stepBody.body.type = stepBody.body.BODY_DYNAMIC;
	onRenderFcts.push(function(delta, now){
		rendering = true;
		if(curVelocities.length > 0) {

			var totalVelocities = {
				x:0,
				y:0,
				z:0
			};
			/*for(var i = 0; i < curVelocities.length; i++){
				totalVelocities.x += curVelocities[i].x;
				totalVelocities.y += curVelocities[i].y;
				totalVelocities.z += curVelocities[i].z;
			}
			totalVelocities.x = totalVelocities.x/curVelocities.length;
			totalVelocities.y = totalVelocities.y/curVelocities.length;
			totalVelocities.z = totalVelocities.z/curVelocities.length;

			stepBody.body.linearVelocity.x = totalVelocities.x;
			stepBody.body.linearVelocity.y = totalVelocities.y;
			stepBody.body.linearVelocity.z = totalVelocities.z;

			stepBody.body.position.x += totalVelocities.x*delta;
			stepBody.body.position.y += totalVelocities.y*delta;
			stepBody.body.position.z += totalVelocities.z*delta;
			curVelocities = [];*/
		}
		updater.update();
	//var bbox = new THREE.Box3().setFromObject(object);
		// copy body.position to object.position (with)
		//object.position.x = stepBody.body.position.x;
		//object.position.y = stepBody.body.position.y;
		//object.position.z = stepBody.body.position.z;

		// copy body.quaternion to object.quaternion
		object.quaternion.set(stepBody.body.orientation.x,stepBody.body.orientation.y,stepBody.body.orientation.z,stepBody.body.orientation.s);
        object.updateMatrix();
        //we compute the data again
        rendering = false;
	});
	var initialQuaternion = new THREE.Quaternion(); 
	initialQuaternion.setFromAxisAngle( new THREE.Vector3( 1, 0, 0 ), Math.PI / 2 );
	stepBody.body.orientation = new OIMO.Quat(initialQuaternion.w, initialQuaternion.x, initialQuaternion.y, initialQuaternion.z);
	//////////////////////////////////////////////////////////////////////////////////
	//		handle the connection													//
	//////////////////////////////////////////////////////////////////////////////////

	var oldValues = null;
	var exampleSocket = new WebSocket("ws://127.0.0.1:1880/ws/socketRcp", "protocolOne");
        exampleSocket.onmessage = function(event) {
            var values = event.data.split(",");
            for(var i = 0; i<values.length;i++){
            	values[i] = parseFloat(values[i]);
            }
            var newQuaternion = new THREE.Quaternion();    
            var resultQuaternion = new THREE.Quaternion();   
			newQuaternion.x = -values[1];
			newQuaternion.y = values[2];//OK
			newQuaternion.z = -values[3];
			newQuaternion.w = values[0];
			var r = resultQuaternion.multiplyQuaternions(initialQuaternion, newQuaternion);
            stepBody.body.setQuaternion(r);
            
			/*var curVelocity = {}
			curVelocity.x = parseFloat(values[4])*500; 
			curVelocity.y = parseFloat(values[6])*500; 
			curVelocity.z = parseFloat(values[6])*500;
			if(!rendering){
				curVelocities.push(curVelocity);
			}*/
			var deltaT = 1;/*
			stepBody.body.position.x += values[4]*deltaT;
			stepBody.body.position.y += values[6]*deltaT;
			stepBody.body.position.z += values[5]*deltaT;*/
            stepBody.body.updatePosition();
            oldValues = values;
        }
	} );
})()

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
      	if(racket){
      		camera.lookAt( racket.position )
      	}
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
