var renderer	= new THREE.WebGLRenderer({
		antialiasing	: true
	});
	renderer.shadowMapEnabled	= true
	renderer.setClearColor( 'lightblue', 1 );
	renderer.setSize( window.innerWidth, window.innerHeight );
	document.body.appendChild( renderer.domElement );

	var debugMaterial = new THREE.MeshBasicMaterial( {visible:false} );
	var debugMaterial2 = new THREE.MeshBasicMaterial( {visible:false} );

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
		light.shadowCameraVisible	= true

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
//		Tennis racket								//
//////////////////////////////////////////////////////////////////////////////////

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
	object.position.y	= 150;
	object.position.z	= -200;
	object.scale.set(0.02, 0.02, 0.02);

	//Bounding box of the racket
	var bbox = new THREE.Box3().setFromObject(object);
	//TODO: divide the racket into 2 bounding box.
	var boundingObject =  new THREE.BoxGeometry((bbox.max.x - bbox.min.x)*1.2, (bbox.max.y - bbox.min.y)*2, (bbox.max.z - bbox.min.z)*1.2);

	var mesh	= new THREE.Mesh(boundingObject, debugMaterial2);
	//mesh.geometry.applyMatrix( new THREE.Matrix4().makeTranslation( 0, (bbox.max.y - bbox.min.y)*3/4, 0 ) );
	racket = mesh;
	mesh.name = "racket";
	mesh.receiveShadow	= true;
	mesh.castShadow		= true;
	mesh.position.x	= object.position.x;
	mesh.position.y	= object.position.y;
	mesh.position.z	= object.position.z;

	scene.add(mesh);			
	var stepBody	= THREEx.Oimo.createBodyFromMesh(world, mesh);

	var curVelocities = [];
	var updater	= new THREEx.Oimo.Body2MeshUpdater(stepBody, mesh);
	var rendering = false;

	//stepBody.body.type = stepBody.body.BODY_DYNAMIC;
	stepBody.body.setupMass();
	var displacementVector = new THREE.Vector3(0, 9.8, 0);
	var newQuaternion = new THREE.Quaternion();
	var lastQuaternion = new THREE.Quaternion();
	onRenderFcts.push(function(delta, now){
		if(rendering) {
		/*
		stepBody.body.linearVelocity.addTime(displacementVector, world.timeStep);*/

		//stepBody.body.linearVelocity.addScale(displacementVector, delta);    
        /*var resultQuaternion = new THREE.Quaternion();
		var r = resultQuaternion.multiplyQuaternions(initialQuaternion, newQuaternion);
        //stepBody.body.setQuaternion(r);                    
        var q = new OIMO.Quat((r.w - stepBody.body.orientation.s)/delta,
        	(r.x - stepBody.body.orientation.x)/delta,
        	(r.y - stepBody.body.orientation.y)/delta,
        	(r.z - stepBody.body.orientation.z)/delta);
		stepBody.body.angularVelocity.x = q.x;
		stepBody.body.angularVelocity.y = q.y;
		stepBody.body.angularVelocity.z = q.z;*/
		stepBody.body.setQuaternion(lastQuaternion);
		stepBody.body.linearVelocity.set(0, 0, 0);
		stepBody.body.updatePosition(delta);
		updater.update();

		// copy body.quaternion to object.quaternion
		object.quaternion.set(stepBody.body.orientation.x,stepBody.body.orientation.y,stepBody.body.orientation.z,stepBody.body.orientation.s);
        object.position.x = mesh.position.x;
		object.position.y = mesh.position.y;
		object.position.z = mesh.position.z;
		object.updateMatrix();
        //we compute the data again
	}
	});
	var initialQuaternion = new THREE.Quaternion(); 
	initialQuaternion.setFromAxisAngle( new THREE.Vector3( 1, 0, 0 ), Math.PI / 2 );
	stepBody.body.orientation = new OIMO.Quat(initialQuaternion.w, initialQuaternion.x, initialQuaternion.y, initialQuaternion.z);
	//////////////////////////////////////////////////////////////////////////////////
	//		handle the connection													//
	//////////////////////////////////////////////////////////////////////////////////
	
	deltaRotation = 1;
	document.addEventListener("keyup",function(e){
   var key = e.keyCode ? e.keyCode : e.which;
   		
	   if(key == 37){
	   	var rotation = new THREE.Quaternion();
	   	rotation.setFromAxisAngle(new THREE.Vector3( 0, 0, 1 ), Math.PI /  (deltaRotation++) );
	   	initialQuaternion = initialQuaternion.multiplyQuaternions(initialQuaternion, rotation);
	   }
	   else if(key == 32){
	   	window.resetPosition = true;
	   }
	   else if(key == 68){
	   		debugMaterial.visible = !debugMaterial.visible;
	   }
	   else if(key == 82){
	   		debugMaterial2.visible = !debugMaterial2.visible;
	   }
	});
	var oldValues = null;
	var exampleSocket = new WebSocket("ws://127.0.0.1:1880/ws/socketRcp", "protocolOne");
        exampleSocket.onmessage = function(event) {
        	
            var values = event.data.split(",");
            for(var i = 0; i<values.length;i++){
            	values[i] = parseFloat(values[i]);
            }   
			newQuaternion.x = -values[1];
			newQuaternion.y = values[2];//OK
			newQuaternion.z = -values[3];
			newQuaternion.w = values[0];
            var resultQuaternion = new THREE.Quaternion();
			
			lastQuaternion = resultQuaternion.multiplyQuaternions(initialQuaternion, newQuaternion);
            

			//displacementVector = new THREE.Vector3( 0/*values[10]*0.001+1000*/, -values[12]*0.001+20, 0/*values[11]*0.001-200*/);
			//stepBody.body.setPosition(displacementVector);
            var deltaT = 1;
            oldValues = values;
            rendering = true;
        }
	} );
})()
//////////////////////////////////////////////////////////////////////////////////
//		Tennis ball								//
//////////////////////////////////////////////////////////////////////////////////

	;(function(){
		var mesh	= THREEx.SportBalls.createTennis();
		mesh.receiveShadow	= true
		mesh.castShadow		= true
		mesh.scale.multiplyScalar(10)
		mesh.position.x	= 1000;
		mesh.position.y	= 300;
		mesh.position.z	= -300;

			scene.add( mesh )

	// create IOMO.Body from mesh
	var body	= THREEx.Oimo.createBodyFromMesh(world, mesh)

	body.body.setupMass();
	// add an updater for them
	var updater	= new THREEx.Oimo.Body2MeshUpdater(body, mesh)
	onRenderFcts.push(function(delta){
		if(window.resetPosition){
			window.resetPosition = false;
			mesh.position.x	= 1000;
			mesh.position.y	= 300;
			mesh.position.z	= -300;
			body.resetPosition(mesh.position.x, mesh.position.y, mesh.position.z);	
		}
		updater.update()
	})
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
      	/*if(racket){
      		camera.lookAt( racket.position )
      	}*/
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
