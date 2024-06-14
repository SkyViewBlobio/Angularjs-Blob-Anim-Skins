document.addEventListener("DOMContentLoaded", function () {
    var canvas = document.getElementById("shaderThreeCanvas");

    var vertexShaderSource =
        "attribute vec4 my_vertex_position;" +
        "void main(void) {" +
        "  gl_Position = my_vertex_position;" +
        "}";

// Fragment shader source code
var fsSource = `
    #ifdef GL_ES
    precision mediump float;
    #endif

    uniform float time;
    uniform vec2 resolution;

    #define PI 3.14159265359

    vec3 color = vec3(2.2, 1.2, 3.8);
    float d2y(float d) { return 1.0 / (0.2 + d); }
    float radius = 3.6;  // Adjusted radius for a bigger circle

    float fct(vec2 p, float r) {
        float a = 3.0 * mod(-atan(p.y, p.x) - time, 2.0 * PI);
        float scan = 0.0 * 1.0;
        return (d2y(a) + scan) * (1.0 - step(radius, r));
    }

    float circle(vec2 p) {
    float d = length(p);
    if (d > radius) {
        discard;
    }
    return d2y(100.0 * d);
    }


    float grid(vec2 p, float y) {
        float a = 0.2;
        float res = 30.0;
        float e = 0.1;
        vec2 pi = fract(p * res);
        pi = step(e, pi);
        return a * y * pi.x * pi.y;
    }

    void main(void) {
        vec2 position = ((gl_FragCoord.xy) - 0.5 * resolution) / resolution.y;
        position /= cos(0.125 * length(position));
        float y = 0.0;
        y += fct(position, length(position));
        y += circle(position);
        y += grid(position, y);
        y = pow(y, 1.75);
        gl_FragColor = vec4(sqrt(y) * color, 1.0);
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

    // Create positions for ShaderThree to represent a circle
    var numSegments = 50;  // Increase this for a smoother circle
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

export default ShaderThree;
