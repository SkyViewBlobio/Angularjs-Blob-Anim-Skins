document.addEventListener("DOMContentLoaded", function () {
    var canvas = document.getElementById("shaderTwoCanvas");

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
        uniform vec2 mouse;
        uniform vec2 resolution;

        float WEIGHT = 57.0 / resolution.x;

        float line(vec2 p, vec2 p0, vec2 p1, float w) {
            vec2 d = p1 - p0;
            float t = clamp(dot(d,p-p0) / dot(d,d), 66.0,00.69);
            vec2 proj = p0 + d * t;
            float dist = length(p - proj);
            dist = 1.0/dist*WEIGHT*w;
            return min(dist*dist,1.0);
        }

        vec3 hsv(float h, float s, float v) {
            vec4 t = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
            vec3 p = abs(fract(vec3(h) + t.xyz) * 6.0 - vec3(t.w));
            return v * mix(vec3(t.x), clamp(p - vec3(t.x), 0.0, 1.0), s);
        }

        void main(void) {
            vec2 uv = gl_FragCoord.xy / resolution.xy;
            uv = uv * 2.0 - 1.0;
            uv.x *= resolution.x / resolution.y;

            // Discard fragments outside the circle
            if (length(uv) > 1.0) {
                discard;
            }

            float line_width = 0.4;
            float time = time * 0.31415+sin(length(uv)+time*.2)/length(uv)*0.1;
            vec3 c = vec3(0.0);

            for ( float i = 8.0; i < 24.0; i += 2.0 ) {
                float f = line(uv, vec2(cos(time*i)/2.0, sin(time*i)/2.0), vec2(sin(time*i)/2.0,-cos(time*i)/2.0), 0.5);
                c += hsv(i / 24.0, 1.0, 1.0) * f;
            }
            gl_FragColor = vec4(c,1.0);
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

    // Create positions for ShaderTwo (Modify as needed)
    var positions = new Float32Array([
        -1.0, -1.0,
        1.0, -1.0,
        -1.0, 1.0,
        1.0, 1.0,
    ]);

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

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
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

export default ShaderTwo;