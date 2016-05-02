
function TennisRacket = function(){

	var self = BasicObject();

	return self;
};

/*
	;(function(){
	var objURL = 'obj/tennisRacket.obj'
	var loader = new THREE.OBJLoader();
	loader.load( objURL, function ( object ) {
	scene.add( object );
  	object.name	= 'tennisRacket'
	object.receiveShadow	= true
	object.castShadow	= true
	object.position.x	= +0.75
	object.position.y	=  0.5	
	object.scale.set(0.01, 0.01, 0.01);

	//Bounding box of the racket
	var bbox = new THREE.Box3().setFromObject(object);
	//TODO: divide the racket into 2 bounding box.
	var boundingObject =  new THREE.CubeGeometry(bbox.max.x - bbox.min.x, bbox.max.y - bbox.min.y, bbox.max.z - bbox.min.z, 3,3,3);
	var material	= new THREE.MeshLambertMaterial({
		visible	: false
	});
	var mesh	= new THREE.Mesh(boundingObject, material);
	mesh.position.x	= (bbox.max.x + bbox.min.x)/2
	mesh.position.y	= (bbox.max.y + bbox.min.y)/2
	mesh.position.z	= (bbox.max.z + bbox.min.z)/2
	mesh.receiveShadow	= true
	mesh.castShadow		= true
	//mesh.visible = false
	scene.add( mesh );						
	var body	= new THREEx.CannonBody({
			mesh	: mesh,
			mass	: 0,
			material: reboundMaterial,
		}).addTo(worldx)
		onRenderFcts.push(function(delta, now){
			body.update(delta, now)

			//TODO: update object position when bounding box position changes
		});

	} );
})()
*/