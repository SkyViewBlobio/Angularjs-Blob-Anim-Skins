document.addEventListener("DOMContentLoaded", function () {
    var canvas = document.getElementById("shaderSeventeenCanvas"); // Make sure to update the canvas ID accordingly

    var vertexShaderSource =
        "attribute vec4 my_vertex_position;" +
        "void main(void) {" +
        "  gl_Position = my_vertex_position;" +
        "}";

    // Fragment shader source code for ShaderSeventeen
    var fsSource = `
        #ifdef GL_ES
        precision highp float;
        #endif

        // glslsandbox uniforms
        uniform float time;
        uniform vec2 resolution;

        // shadertoy emulation
        #define iTime time
        #define iResolution vec3(resolution,1.)

        // Emulate some GLSL ES 3.x
        int int_mod(int a, int b)
        {
            int c = (a - (b * (a/b)));
            return (c < 0) ? c + b : c;
        }

        mat3 rotate3D(float theta, vec3 axis){
            axis=normalize(axis);
            float c=cos(theta);
            vec3 s=axis*sin(theta),r=axis*(1.-c);
            return
                mat3(axis.x*r,axis.y*r,axis.z*r)+
                mat3(c,s.z,-s.y,-s.z,c,s.x,s.y,-s.x,c);
        }

        #define hsv(h,s,v) mix(vec3(1),clamp((abs(fract((h)+vec3(3,2,1)/3.)*6.-3.)-1.),0.,1.),(s))*(v)
        #define r iResolution.xy
        #define t iTime

        void mainImage( out vec4 O, in vec2 C )
        {
            O=vec4(0);
            vec4 p=vec4(0);
            float e,s=1.,g,j=0.;
            for(int i=0;i<450;i++)
                p=int_mod(i,5)<1?
                    g+=e=length(p.wy)/s,
                    O.rgb+=hsv(log(s)*.4,.4,.02/exp(.3*j*j*e)),
                    j++,
                    s=2.,
                    vec4(vec3((C-r*.5)/r.y*g,g-.2)*rotate3D(t*.5,r.xxy),.1)
                :
                    (
                    p=.1-abs(p-.1),
                    s*=e=max(1./dot(p,p),1.1),
                    abs(p.x<p.y?p.wzxy:p.wzyx)*e-.7)
                ;
                O*=O*O;
        }

        void main(void)
        {
            mainImage(gl_FragColor, gl_FragCoord.xy);
            gl_FragColor.a = 1.0;
        }
    `;

    var gl = canvas.getContext("webgl");

    if (!gl) {
        console.error("Unable to initialize WebGL. Your browser may not support it.");
        return;
    }

    var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fsSource);

    var program = createProgram(gl, vertexShader, fragmentShader);
    gl.useProgram(program);

    var positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // Create positions for ShaderSeventeen (similar to previous shaders)
    var numSegments = 50; // Increase this for a smoother shape
    var positions = new Float32Array(numSegments * 2);

    for (let i = 0; i < numSegments; i++) {
        let angle = (i / numSegments) * 2.0 * Math.PI;
        let x = Math.cos(angle);
        let y = Math.sin(angle);

        positions[i * 2] = x;
        positions[i * 2 + 1] = y;
    }

    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    var positionAttributeLocation = gl.getAttribLocation(program, "my_vertex_position");
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    var timeLocation = gl.getUniformLocation(program, "time");
    var resolutionLocation = gl.getUniformLocation(program, "resolution");

    gl.uniform2f(resolutionLocation, canvas.width, canvas.height);

    function draw() {
        gl.uniform1f(timeLocation, performance.now() / 1000.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.drawArrays(gl.TRIANGLE_FAN, 0, numSegments);
        requestAnimationFrame(draw);

        checkWebGLErrors(gl);
    }

    draw();

    function createShader(gl, type, source) {
        var shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error("Shader compilation failed:", gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }

        return shader;
    }

    function checkWebGLErrors(gl) {
        var error = gl.getError();
        if (error !== gl.NO_ERROR) {
            console.error("WebGL error:", error);
        }
    }

    function createProgram(gl, vertexShader, fragmentShader) {
        var program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error("Program linking failed:", gl.getProgramInfoLog(program));
            gl.deleteProgram(program);
            return null;
        }

        return program;
    }
});

export default ShaderSeventeen;
