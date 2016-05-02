	var renderer	= new THREE.WebGLRenderer({
		antialias	: true
	});
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.setClearColor( 'lightblue', 1 );
	document.body.appendChild( renderer.domElement );

	var onRenderFcts= [];
	var scene	= new THREE.Scene();
	var camera	= new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 10000);
	camera.position.z = 266;
	camera.position.x = 266;
	camera.position.y = 266;


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
	
	// add a light behind
	var light	= new THREE.DirectionalLight('white', 1);
	// var light	= new THREE.PointLight('white', 2)
	scene.add( light );
	light.position.y= 1;
	onRenderFcts.push(function(delta, now){
		var angle	= now*Math.PI*2 * 0.2;
		light.position.x= Math.cos(angle)*3;
		light.position.y= Math.sin(angle)*3;
	})


	var reboundMaterial	= new CANNON.Material('ball');
	worldx.world.addContactMaterial(new CANNON.ContactMaterial(
		reboundMaterial,
		reboundMaterial,
		0.4,	// friction
		0.65	// Restitution
	));
//////////////////////////////////////////////////////////////////////////////////
//		Tennis ball								//
//////////////////////////////////////////////////////////////////////////////////

	;(function(){
		var mesh	= THREEx.SportBalls.createTennis();
		scene.add(mesh);
		mesh.name	= 'ball';
		mesh.receiveShadow	= true;
		mesh.castShadow	= true;
		mesh.position.x	= +10;
		mesh.position.y	=  200;	
		mesh.position.z	=  10;			
		mesh.scale.set(4,4,4);
		var body	= new THREEx.CannonBody({
				mesh	: mesh,
				mass	: 0.5,
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
	object.position.x	= +0.75;
	object.position.y	=  0.5;
	object.scale.set(0.01, 0.01, 0.01);

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
	//mesh.visible = false
	scene.add( mesh );						
	var body	= new THREEx.CannonBody({
			mesh	: mesh,
			mass	: 100,
			material: reboundMaterial,
		}).addTo(worldx);

		body.body.angularVelocity.set(0,0,0);
		body.body.motionstate = CANNON.Body.KINEMATIC
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
var last_position = {};
      document.body.addEventListener('mousemove', function(event) {
    //check to make sure there is data to compare against
    if (typeof(last_position.x) != 'undefined') {

        //get the change from last position to this position
        var deltaX = last_position.x - event.clientX,
            deltaY = last_position.y - event.clientY;

		body.body.velocity.z += deltaY / 10;
		body.body.velocity.x += deltaX / 10;
    }

    //set the new last position to the current for next time
    last_position = {
        x : event.clientX,
        y : event.clientY
    };

      });

      document.body.addEventListener('click', function() {
      	body.body.mass+= 0.01;
      });

	} );
})()
 /*var loader = new THREE.OBJMTLLoader();
 loader.load ('obj/Tennis-Court/Tennis-Court.obj', 'obj/Tennis-Court/Tennis-Court.mtl', 
    function (object) {
  		scene.add( object );
    } );*/

var onProgress = function (e){
	//TODO: loading window in the beginning
	console.log(e)
};
var onError = function(e){
	//TODO: Toast message for errors
	console.log(e)
};
;(function(){

	THREE.Loader.Handlers.add( /\.dds$/i, new THREE.DDSLoader() );
	var mtlLoader = new THREE.MTLLoader();
	mtlLoader.setBaseUrl( 'obj/Tennis-Court/' );
	mtlLoader.setPath( 'obj/Tennis-Court/' );
		var material	= new THREE.MeshLambertMaterial({
		visible	: false
	});
	mtlLoader.load( 'Tennis-Court.mtl', function( materials ) {

		materials.preload();

		var objLoader = new THREE.OBJLoader();
		//objLoader.setMaterials( materials );
		objLoader.setPath( 'obj/Tennis-Court/' );
		objLoader.load( 'Tennis-Court.obj', function ( object ) {
			scene.add( object );
			object.scale.set(5, 5, 5);

			object.traverse(function(child){

				var geometry = null;
				var mesh = null;

			var bbox = new THREE.Box3().setFromObject(child);
		if(child.name == "Tennis_court")
		{
			//plane 1 : the ground
			geometry	= new THREE.PlaneGeometry(bbox.max.z - bbox.min.z, bbox.max.x - bbox.min.x, 4, 4);
			mesh	= new THREE.Mesh(geometry, material);
			mesh.lookAt(mesh.position.clone().add(new THREE.Vector3(0,1,0)))
			mesh.position.x	= (bbox.max.x + bbox.min.x)/2
			mesh.position.z	= (bbox.max.z + bbox.min.z)/2
		}
		else if(child.name == "net")
		{
			//plane 2 : the net
			geometry	= new THREE.PlaneGeometry(bbox.max.z - bbox.min.z, bbox.max.y - bbox.min.y, 4, 4);
			mesh	= new THREE.Mesh(geometry, material);
			mesh.position.y	= (bbox.max.y + bbox.min.y)/2
			mesh.lookAt(mesh.position.clone().add(new THREE.Vector3(1,0,0)))
		}
	if(mesh != null)
	{
		//scene.add( mesh );
		// init physics
		var body	= new THREEx.CannonBody({
			mesh	: mesh,
			mass	: 0,
			material: reboundMaterial
		}).addTo(worldx)
		onRenderFcts.push(function(delta, now){
			body.update(delta, now)
		});
	}
			});
		}, onProgress, onError );
		});

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