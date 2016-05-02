
function BasicObject(scene, physicalWorld){
	
	var _onRenderFcts = [];
	var _mesh;
	var _body;

	var initialize(){

	};

	this.TexturePath;
	
	this.appendToScene = function(){
		scene.add(_mesh);
	}

	this.render = function(delta, now){
		_body.update(delta, now)
	};


}