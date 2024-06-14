document.addEventListener("DOMContentLoaded", function () {
    var canvas = document.getElementById("shaderEighteenCanvas"); // Make sure to update the canvas ID accordingly

    var vertexShaderSource =
        "attribute vec4 my_vertex_position;" +
        "void main(void) {" +
        "  gl_Position = my_vertex_position;" +
        "}";

    // Fragment shader source code for ShaderEighteen
    var fsSource = `
        #ifdef GL_ES
        precision mediump float;
        #endif

        uniform float time;
        uniform vec2 mouse;
        uniform vec2 resolution;

        float rand(vec2 co){
            return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
        }

        float noise2f( in vec2 p )
        {
            vec2 ip = vec2(floor(p));
            vec2 u = fract(p);
            u = u*u*(3.0-2.0*u);

            float res = mix(
                mix(rand(ip),  rand(ip+vec2(1.0,0.0)),u.x),
                mix(rand(ip+vec2(0.0,1.0)),   rand(ip+vec2(1.0,1.0)),u.x),
                u.y)
            ;
            return res*res;
        }

        float fbm(vec2 c) {
            float f = 0.0;
            float w = 1.0;
            for (int i = 0; i < 8; i++) {
                f+= w*noise2f(c);
                c*=2.0;
                w*=0.5;
            }
            return f;
        }

        vec2 cMul(vec2 a, vec2 b) {
            return vec2( a.x*b.x -  a.y*b.y,a.x*b.y + a.y * b.x);
        }

        float pattern(  vec2 p, out vec2 q, out vec2 r )
        {
            q.x = fbm( p  +0.00*time);
            q.y = fbm( p + vec2(1.0));

            r.x = fbm( p +1.0*q + vec2(1.7,9.2)+0.15*time );
            r.y = fbm( p+ 1.0*q + vec2(8.3,2.8)+0.126*time);
            return fbm(p +1.0*r + 0.0* time);
        }

        const vec3 color1 = vec3(0.101961,0.619608,0.666667);
        const vec3 color2 = vec3(0.666667,0.666667,0.498039);
        const vec3 color3 = vec3(0,0,0.164706);
        const vec3 color4 = vec3(0.666667,1,1);

        void main() {
            vec2 q;
            vec2 r;
            vec2 c = 1000.0*gl_FragCoord.xy/ resolution.xy;
            float f = pattern(c*0.01,q,r);
            vec3 col = mix(color1,color2,clamp((f*f)*4.0,0.0,1.0));
            col = color2;
            col = mix(col,color3,clamp(length(q),1.0,1.0));
            col = mix(col,color4,clamp(length(r.x),0.0,1.0));
            gl_FragColor =  vec4((0.2*f*f*f+0.6*f*f+0.5*f)*col,1.0);
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

    // Create positions for ShaderEighteen (similar to previous shaders)
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

export default ShaderEighteen;
