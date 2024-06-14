document.addEventListener("DOMContentLoaded", function () {
    var canvas = document.getElementById("shaderSixCanvas");

    var vertexShaderSource =
        "attribute vec4 my_vertex_position;" +
        "void main(void) {" +
        "  gl_Position = my_vertex_position;" +
        "}";

    // Fragment shader source code
    var fsSource = `
        #extension GL_OES_standard_derivatives : enable
        precision highp float;

        uniform float time;
        uniform vec2 mouse;
        uniform vec2 resolution;

        mat2 rotate2D(float r) {
            return mat2(cos(r), sin(r), -sin(r), cos(r));
        }

        void main()
        {
            vec2 uv = (gl_FragCoord.xy - 0.5 * resolution.xy) / resolution.y;
            vec3 col = vec3(0);
            float t = time * 0.8;

            float dd = length(uv) + 0.5;

            vec2 n = vec2(0);
            vec2 q = vec2(0);
            vec2 p = uv;
            float d = dot(p, p);
            float S = (dd - 0.3) * 5.0;
            float a = 0.0;
            mat2 m = rotate2D(dd * 1.5);

            for (float j = 0.; j < 8.; j++) {
                p *= m;
                n *= m;
                q = p * S + t * 4. + sin(t * 1. - d * 8.) * .0018 + 3. * j - .95 * n; // wtf???
                a += dot(cos(q) / S, vec2(.2));
                n -= sin(q + (dd * 20.0));
                S *= 1.4;
            }

            col = vec3(3.2, 2.2, 4.2) * (a + .2) + a + a - d;

            gl_FragColor = vec4(col * dd, 1.0);
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

    // Create positions for ShaderSix to represent a circle
    var numSegments = 50; // Increase this for a smoother circle
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

export default ShaderSix;
