
function TennisBall(scene, physicalWorld){
	'use strict';
	var self = new BasicObject(scene, physicalWorld);

	var initialize = function(){
		self.initialize();
	};

	var initializeObject = function (){
		_mesh.name	= 'ball';
		_mesh.receiveShadow	= true;
		_mesh.castShadow	= true;
		_mesh.position.x	= +10;
		_mesh.position.y	=  10;	
		_mesh.position.z	=  10;			
		_mesh.scale.set(4,4,4);
	};

	self.initializePhysicalBody = function(){
		_body = new THREEx.CannonBody({
			mesh	: _mesh,
			mass	: 0,
			material: reboundMaterial
		}).addTo(physicalWorld);
	};

	return self;
}