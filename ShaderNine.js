document.addEventListener("DOMContentLoaded", function () {
    var canvas = document.getElementById("shaderNineCanvas"); // replace with your canvas id

    var vertexShaderSource =
        "attribute vec4 my_vertex_position;" +
        "void main(void) {" +
        "  gl_Position = my_vertex_position;" +
        "}";

    // Fragment shader source code for ShaderNine
    var fsSource = `
        // global remix - Del 30/10/2019
        #ifdef GL_ES
        precision highp float;
        #endif

        #extension GL_OES_standard_derivatives : enable

        uniform float time;
        uniform vec2 mouse;
        uniform vec2 resolution;

        float snow(vec2 uv, float scale) {
            float _t = time * 0.35;
            uv.x += _t / scale;
            uv *= scale;
            vec2 s = floor(uv), f = fract(uv), p;
            float k = 0.5, d;
            p = .5 + .35 * sin(11. * fract(sin((s + p + scale) * mat2(7, 3, 6, 5)) * 5.)) - f;
            d = length(p);
            k = min(d, k);
            k = smoothstep(0.0008, k, sin(f.x + f.y) * 0.003);
            return k;
        }

        void main(void) {
            vec2 uv = (gl_FragCoord.xy * 2. - resolution.xy) / min(resolution.x, resolution.y);
            float dd = 1.0 - length(uv);
            uv.x += sin(time * 0.48);
            uv.y += sin(uv.x * -1.4) * 0.2;
            uv.x *= 0.09;
            float c = snow(uv, 30.) * .3;
            c += snow(uv, 25.) * .5;
            c += snow(uv, 35.) * .8;
            c += snow(uv, 10.);
            c += snow(uv, 20.);
            c += snow(uv, 8.);
            c += snow(uv, 10.);
            c *= 0.2 / dd;
            vec3 finalColor = (vec3(1, 0.5, 3.2)) * c * 100.0;
            gl_FragColor = vec4(finalColor, 1.);
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

    // Create positions for ShaderNine to represent a circle
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
