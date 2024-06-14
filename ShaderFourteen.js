document.addEventListener("DOMContentLoaded", function () {
    var canvas = document.getElementById("shaderFourteenCanvas"); // Make sure to update the canvas ID accordingly

    var vertexShaderSource =
        "attribute vec4 my_vertex_position;" +
        "void main(void) {" +
        "  gl_Position = my_vertex_position;" +
        "}";

    // Fragment shader source code for ShaderFourteen
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
            float t = time;

            uv *= 0.5;
            uv.x /= dot(uv, uv) * 20.0;
            float d = 0.2 - length(uv);
            vec2 n = vec2(0);
            vec2 q = vec2(0);
            vec2 p = uv * 2.65;
            float S = 16.0;
            float a = 0.0;

            float vv = fract(time * 0.01);
            vv = mix(0.0, 25.0, vv);
            mat2 m = rotate2D(vv);

            for (float j = 0.0; j < 6.0; j++) {
                m *= 1.03;
                p *= m * 1.05;
                n *= m * 0.95;
                q = p * S + t * 2.5 + sin((t + j)) * 0.0018 + 3.0 * j - 1.25 * n;
                a += dot(cos(q) / S, vec2(0.15));
                n -= sin(q);
                S *= 1.445;
            }

            col = vec3(1.425, 1.4, 2.65) * (a + 0.182) + 9.0 * a + a + d;

            gl_FragColor = vec4(col, 1.0);
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

    // Create positions for ShaderFourteen to represent a circle
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
