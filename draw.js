var canvas;

/** @type {WebGLRenderingContext} */
var gl;

var program;
var vertexShader, fragmentShader;

var delay = 10;

var teapot_geom = createTeapotGeometry(6);
var num_verts = teapot_geom[0].length;

// CPU Data
var modelView;
var projection;

// Model GPu Stuff
var vBuffer; // buffer of positions
var vPosition; // Attribute for positions

// Normal Vector
var normalBuffer;
var vNormal;

// Vert Shader Uniforms
var M_proj_loc;
var M_modelview_loc;
var lightPos_loc;

// Frag Shader Uniforms
var ambientProduct_loc;
var diffuseProduct_loc;
var specularProduct_loc;
var shininess_loc;

var ambientProduct;
var diffuseProduct;
var specularProduct;
var shininess;
var light_pos;

// Slider Handles
var light_pos_x_slider;
var light_pos_y_slider;
var light_pos_z_slider;

var light_int_diff_slider;
var light_int_spec_slider;

var mat_diff_r_slider;
var mat_diff_g_slider;
var mat_diff_b_slider;

var mat_spec_r_slider;
var mat_spec_g_slider;
var mat_spec_b_slider;

var mat_shiny_slider;

function lookAt(eye, at, up) {
	function CalcVPN(eye, at) {
		return [at[0]-eye[0], at[1]-eye[1], at[2]-eye[2]];
	}

	let n = CalcVPN(eye, at);
	let u = cross(n, up);
	let v = cross(u,n);

	n = normalize(n,false);
	u = normalize(u,false);
	v = normalize(v,false);

	n = negate(n);

	const r = [
		[...u, -dot(u, eye)],
		[...v, -dot(v, eye)],
		[...n, dot(negate(n), eye)],
		[0, 0, 0, 1]
	];

	r.matrix = true;

	return r;
}

function GetViewPlanes(width, height, near, far) {
	let left = -(width/2);
	let right = width/2;
	
	let bottom = -(height/2);
	let top = height/2;

	return [left, right, bottom, top, near, far];
}

function PerspectiveMatrix(left, right, bottom, top, near, far) {
	let mat = mat4();

	mat[0][0] = near/right;
	mat[1][1] = near/top;
	mat[2][2] = -(far+near)/(far-near);
	mat[2][3] = -(2*far*near)/(far-near);
	mat[3][2] = -1.0;
	mat[3][3] = 0.0;

	return mat;
}

function CalcMatrix(eye, at, up) {
	let look_at = lookAt(eye, at, up);
	let b_box = GetViewPlanes(1.0, 1.0, 1.0, 50.0);
	let projection = PerspectiveMatrix(...b_box);

	let modelView = mat4();
	modelView = mult(look_at, modelView);

	return [projection, modelView];
}

function updateLight() {
	light_pos = [
		light_pos_x_slider.valueAsNumber, 
		light_pos_y_slider.valueAsNumber,
		light_pos_z_slider.valueAsNumber,
		1.0
	];
	// light_pos.matrix = true;

	let light_int_diff = [
		light_int_diff_slider.valueAsNumber, 
		light_int_diff_slider.valueAsNumber, 
		light_int_diff_slider.valueAsNumber,
		1.0
	];

	let light_int_spec = [
		light_int_spec_slider.valueAsNumber,
		light_int_spec_slider.valueAsNumber,
		light_int_spec_slider.valueAsNumber,
		1.0
	];

	let light_int_ambient = [0.2, 0.2, 0.2, 1.0];
	
	let mat_diff = [
		mat_diff_r_slider.valueAsNumber,
		mat_diff_g_slider.valueAsNumber,
		mat_diff_b_slider.valueAsNumber,
		1.0
	];
	
	let mat_spec = [
		mat_spec_r_slider.valueAsNumber,
		mat_spec_g_slider.valueAsNumber,
		mat_spec_b_slider.valueAsNumber,
		1.0
	];
	
	let mat_ambient = [1.0, 1.0, 1.0, 1.0];

	diffuseProduct = mult(light_int_diff, mat_diff);
	specularProduct = mult(light_int_spec, mat_spec);
	ambientProduct = mult(light_int_ambient, mat_ambient);

	shininess = mat_shiny_slider.valueAsNumber;

	console.log(light_pos);
	console.log(diffuseProduct);
	console.log(specularProduct);
	console.log(ambientProduct);
	console.log(shininess);
}

// all initializations
window.onload = function init() {
	// get canvas handle
	canvas = document.getElementById( "gl-canvas" );

	light_pos_x_slider = document.getElementById("light_x");
	light_pos_y_slider = document.getElementById("light_y");
	light_pos_z_slider = document.getElementById("light_z");

	light_int_diff_slider = document.getElementById("int_diff");
	light_int_spec_slider = document.getElementById("int_spec");

	mat_diff_r_slider = document.getElementById("r_diff");
	mat_diff_g_slider = document.getElementById("g_diff");
	mat_diff_b_slider = document.getElementById("b_diff");

	mat_spec_r_slider = document.getElementById("r_spec");
	mat_spec_g_slider = document.getElementById("g_spec");
	mat_spec_b_slider = document.getElementById("b_spec");

	mat_shiny_slider = document.getElementById("shiny");

	updateLight();

	// WebGL Initialization
	gl = initWebGL(canvas);
	if (!gl ) {
		alert( "WebGL isn't available" );
	}

	// set up viewport
	gl.viewport( 0, 0, canvas.width, canvas.height );
	gl.clearColor( 0.8, 0.8, 0.0, 1.0 );
	gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

	// create shaders, compile and link program
	program = initShaders(gl, "vertex-shader", "fragment-shader");
	gl.useProgram(program);


	vBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(teapot_geom[0]), gl.STATIC_DRAW);

	vPosition = gl.getAttribLocation(program, "vPosition");
	gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0 );
	gl.enableVertexAttribArray( vPosition );


	normalBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(teapot_geom[1]), gl.STATIC_DRAW);

	vNormal = gl.getAttribLocation(program, "vNormal");
	gl.vertexAttribPointer(vNormal, 4, gl.FLOAT, false, 0, 0 );
	gl.enableVertexAttribArray( vNormal );

	M_proj_loc = gl.getUniformLocation(program, "M_projection");
	M_modelview_loc = gl.getUniformLocation(program, "M_modelView");
	lightPos_loc = gl.getUniformLocation(program, "lightPos");

	ambientProduct_loc = gl.getUniformLocation(program, "ambientProduct");
	diffuseProduct_loc = gl.getUniformLocation(program, "diffuseProduct");
	specularProduct_loc = gl.getUniformLocation(program, "specularProduct");
	shininess_loc = gl.getUniformLocation(program, "shininess");

	let eye= [-1.0, 6.0, -5.0];
	let at = [0. , 1.5 , 0.];
	let up = [-1.0, 9.0, -5.0];

	[projection, modelView] = CalcMatrix(eye, at, up);

	light_pos_x_slider.oninput = () => updateLight();
	light_pos_y_slider.oninput = () => updateLight();
	light_pos_z_slider.oninput = () => updateLight();

	light_int_diff_slider.oninput = () => updateLight();
	light_int_spec_slider.oninput = () => updateLight();

	mat_diff_r_slider.oninput = () => updateLight();
	mat_diff_g_slider.oninput = () => updateLight();
	mat_diff_b_slider.oninput = () => updateLight();

	mat_spec_r_slider.oninput = () => updateLight();
	mat_spec_g_slider.oninput = () => updateLight();
	mat_spec_b_slider.oninput = () => updateLight();

	mat_shiny_slider.oninput = () => updateLight();

	// must enable Depth test for 3D viewing in GL
	gl.enable(gl.DEPTH_TEST);
  render();
}

// all drawing is performed here
function render(){
	gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	gl.uniformMatrix4fv(M_proj_loc, false, flatten(projection));
	gl.uniformMatrix4fv(M_modelview_loc, false, flatten(modelView));

	gl.uniform4fv(lightPos_loc, flatten(light_pos));

	gl.uniform4fv(ambientProduct_loc, flatten(ambientProduct));
	gl.uniform4fv(diffuseProduct_loc, flatten(diffuseProduct));
	gl.uniform4fv(specularProduct_loc, flatten(specularProduct));
	gl.uniform1f(shininess_loc, shininess);

	gl.drawArrays(gl.TRIANGLES, 0, num_verts);
	

	setTimeout(
      function (){requestAnimFrame(render);}, delay
 	);
}