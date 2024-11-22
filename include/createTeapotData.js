bezier = function(u) {
    var b =new Array(4);
    var a = 1-u;
    b[3] = a*a*a;
    b[2] = 3*a*a*u;
    b[1] = 3*a*u*u;
    b[0] = u*u*u;
    return b;
}

nbezier = function(u) {
    var b = [];
    b.push(3*u*u);
    b.push(3*u*(2-3*u));
    b.push(3*(1-4*u+3*u*u));
    b.push(-3*(1-u)*(1-u));
    return b;
}

    
function createTeapotGeometry (numDivisions) {
// returns vertices and normals for a particular resolution

	var points = [], normals = [];
    var sum = [0, 0, 0];
	var index = 0;

    for(var i = 0; i<306; i++) for(j=0; j<3; j++)
      sum[j] += vertices[i][j];
      for(j=0; j<3; j++) sum[j]/=306;
        for(var i = 0; i<306; i++) for(j=0; j<2; j++)
       vertices[i][j] -= sum[j]/2
           for(var i = 0; i<306; i++) for(j=0; j<3; j++)
       vertices[i][j] *= 2;

    
    var h = 1.0/numDivisions;

    patch = new Array(numTeapotPatches);
    for(var i=0; i<numTeapotPatches; i++) patch[i] = new Array(16);
    for(var i=0; i<numTeapotPatches; i++) 
        for(j=0; j<16; j++) {
            patch[i][j] = vec4([vertices[indices[i][j]][0],
             vertices[indices[i][j]][2], 
                vertices[indices[i][j]][1], 1.0]);
    }
    
    
    for ( var n = 0; n < numTeapotPatches; n++ ) {
    

    var data = new Array(numDivisions+1);
    for(var j = 0; j<= numDivisions; j++) data[j] = new Array(numDivisions+1);
    for(var i=0; i<=numDivisions; i++) for(var j=0; j<= numDivisions; j++) { 
        data[i][j] = vec4(0,0,0,1);
        var u = i*h;
        var v = j*h;
        var t = new Array(4);
        for(var ii=0; ii<4; ii++) t[ii]=new Array(4);
        for(var ii=0; ii<4; ii++) for(var jj=0; jj<4; jj++) 
            t[ii][jj] = bezier(u)[ii]*bezier(v)[jj];
        
        
        for(var ii=0; ii<4; ii++) for(var jj=0; jj<4; jj++) {
            temp = vec4(patch[n][4*ii+jj]);             
            temp = scale( t[ii][jj], temp);
            data[i][j] = add(data[i][j], temp);
        }
    }

    var ndata = new Array(numDivisions+1);
    for(var j = 0; j<= numDivisions; j++) ndata[j] = new Array(numDivisions+1);
    var tdata = new Array(numDivisions+1);
    for(var j = 0; j<= numDivisions; j++) tdata[j] = new Array(numDivisions+1);
    var sdata = new Array(numDivisions+1);
    for(var j = 0; j<= numDivisions; j++) sdata[j] = new Array(numDivisions+1);
    for(var i=0; i<=numDivisions; i++) for(var j=0; j<= numDivisions; j++) { 
        ndata[i][j] = vec4(0,0,0,0);
        sdata[i][j] = vec4(0,0,0,0);
        tdata[i][j] = vec4(0,0,0,0);
        var u = i*h;
        var v = j*h;
        var tt = new Array(4);
        for(var ii=0; ii<4; ii++) tt[ii]=new Array(4);
        var ss = new Array(4);
        for(var ii=0; ii<4; ii++) ss[ii]=new Array(4);

        for(var ii=0; ii<4; ii++) for(var jj=0; jj<4; jj++) { 
            tt[ii][jj] = nbezier(u)[ii]*bezier(v)[jj];
            ss[ii][jj] = bezier(u)[ii]*nbezier(v)[jj];
        }

        for(var ii=0; ii<4; ii++) for(var jj=0; jj<4; jj++) {
            var temp = vec4(patch[n][4*ii+jj]); ;            
            temp = scale( tt[ii][jj], temp);
            tdata[i][j] = add(tdata[i][j], temp);
            
            var stemp = vec4(patch[n][4*ii+jj]); ;            
            stemp = scale( ss[ii][jj], stemp);
            sdata[i][j] = add(sdata[i][j], stemp);

        }
        temp = cross(tdata[i][j], sdata[i][j])
        
        ndata[i][j] =  normalize(vec4(temp[0], temp[1], temp[2], 0));
    }

        
    for(var i=0; i<numDivisions; i++) for(var j =0; j<numDivisions; j++) {
        points.push(data[i][j]);
        normals.push(ndata[i][j]);

        points.push(data[i+1][j]);
        normals.push(ndata[i+1][j]);

        points.push(data[i+1][j+1]);
        normals.push(ndata[i+1][j+1]);

        points.push(data[i][j]);
        normals.push(ndata[i][j]);

        points.push(data[i+1][j+1]);
        normals.push(ndata[i+1][j+1]);

        points.push(data[i][j+1]);
        normals.push(ndata[i][j+1]);
        index+= 6;
        }
    }

	return [points, normals];
           
}

function scale( x, y, z )
{
    if ( Array.isArray(x) && x.length == 3 ) {
        z = x[2];
        y = x[1];
        x = x[0];
    }

    var result = mat4();
    result[0][0] = x;
    result[1][1] = y;
    result[2][2] = z;

    return result;
}

function scale( s, u )
{
    if ( !Array.isArray(u) ) {
        throw "scale: second parameter " + u + " is not a vector";
    }

    result = [];
    for ( var i = 0; i < u.length; ++i ) {
        result.push( s * u[i] );
    }
    
    return result;
}

