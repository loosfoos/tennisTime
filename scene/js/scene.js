
function TennisGame() {
	'use strict';

	var _physicalWorld;

	var  _renderer;

	var _tennisBall;

	var _terrain;

	var _controller1;
	var _player1;

	var _controller2;
	var _player2;

	var _scene;

	var _camera;

	var _onRenderFcts = [];

	var _reboundMaterial;

	var initialize = function(width, height){
		_renderer	= new THREE.WebGLRenderer({
			antialias	: true
		});
		_renderer.setSize(width , height );
		_renderer.setClearColor( 'lightblue', 1 );

		document.body.appendChild( _renderer.domElement );

		_scene	= new THREE.Scene();
		_physicalWorld	= new THREEx.CannonWorld().start()
		_physicalWorld.world.defaultContactMaterial.friction = 0.5


		_reboundMaterial	= new CANNON.Material('ball');
		_physicalWorld.world.addContactMaterial(new CANNON.ContactMaterial(
			reboundMaterial,
			reboundMaterial,
			0.4,	// friction
			0.65	// Restitution
		));
		initializeLights();

		initializeSceneObjects();
	};

	var initializeLights = function(){
		// add a ambient light
		var light	= new THREE.AmbientLight( 0x020202 )
		_scene.add( light )
		// add a light in front
		var light	= new THREE.DirectionalLight('white', 1)
		light.position.set(0.5, 0.5, 2)
		_scene.add( light )
		// add a light behind
		var light	= new THREE.DirectionalLight('white', 0.75)
		light.position.set(-0.5, -0.5, -2)
		_scene.add( light );

		// add a light behind
		var light	= new THREE.DirectionalLight('white', 1)
		// var light	= new THREE.PointLight('white', 2)
		_scene.add( light )
		light.position.y= 1
		_onRenderFcts.push(function(delta, now){
			var angle	= now*Math.PI*2 * 0.2
			light.position.x= Math.cos(angle)*3
			light.position.y= Math.sin(angle)*3
			// light.position.z= Math.sin(angle)*3
		})

	};

	var initializeSceneObjects = function(){
		_tennisBall = new TennisBall(_scene, _physicalWorld);

		_tennisBall.initializePhysicalBody();
	};

	var initializeCamera = function(){
		_camera	= new THREE.PerspectiveCamera(45, width / height, 0.01, 1000);
		_camera.position.z = 10;
		_camera.position.x = 10;
		_camera.position.y = 10;
	};

	//////////////////////////////////////////////////////////////////////////////////
	//		loop runner							//
	//////////////////////////////////////////////////////////////////////////////////
	this.render = function (){
	var lastTimeMsec= null
	requestAnimationFrame(function animate(nowMsec){
		// keep looping
		requestAnimationFrame( animate );
		// measure time
		lastTimeMsec	= lastTimeMsec || nowMsec-1000/60;
		var deltaMsec	= Math.min(200, nowMsec - lastTimeMsec);
		lastTimeMsec	= nowMsec;
		// call each update function
		onRenderFcts.forEach(function(onRenderFct){
			_tennisBall.render(deltaMsec/1000, nowMsec/1000);
			onRenderFct(deltaMsec/1000, nowMsec/1000);
		})
	});
		
	/*
		_terrain.render();
		_player1.render();
		_player2.render();*/
	};





	//we expose publicmethods
	this.initialize = initialize;
	this.render = render;

};