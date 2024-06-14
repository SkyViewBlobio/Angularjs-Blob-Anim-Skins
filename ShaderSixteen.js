document.addEventListener("DOMContentLoaded", function () {
    var canvas = document.getElementById("shaderSixteenCanvas");

    var vertexShaderSource =
        "attribute vec4 my_vertex_position;" +
        "void main(void) {" +
        "  gl_Position = my_vertex_position;" +
        "}";

    // Fragment shader source code for ShaderSixteen
    var fsSource = `
        #ifdef GL_ES
        precision highp float;
        #endif

        // glslsandbox uniforms
        uniform float time;
        uniform vec2 resolution;

        // shadertoy emulation
        #define iTime time
        #define iResolution resolution

        precision highp float;

        mat2 rot(float a) {
            float c = cos(a), s = sin(a);
            return mat2(c,s,-s,c);
        }

        const float pi = acos(-1.0);
        const float pi2 = pi*2.0;

        vec2 pmod(vec2 p, float r) {
            float a = atan(p.x, p.y) + pi/r;
            float n = pi2 / r;
            a = floor(a/n)*n;
            return p*rot(-a);
        }

        float box( vec3 p, vec3 b ) {
            vec3 d = abs(p) - b;
            return min(max(d.x,max(d.y,d.z)),0.0) + length(max(d,0.0));
        }

        float ifsBox(vec3 p) {
            for (int i=0; i<5; i++) {
                p = abs(p) - 1.0;
                p.xy *= rot(iTime*0.3);
                p.xz *= rot(iTime*0.1);
            }
            p.xz *= rot(iTime);
            return box(p, vec3(0.4,0.8,0.3));
        }

        float map(vec3 p, vec3 cPos) {
            vec3 p1 = p;
            p1.x = mod(p1.x-5., 10.) - 5.;
            p1.y = mod(p1.y-5., 10.) - 5.;
            p1.z = mod(p1.z, 16.)-8.;
            p1.xy = pmod(p1.xy, 5.0);
            return ifsBox(p1);
        }

        void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
            vec2 p = (fragCoord.xy * 2.0 - iResolution.xy) / min(iResolution.x, iResolution.y);

            vec3 cPos = vec3(0.0,0.0, -3.0 * iTime);
            vec3 cDir = normalize(vec3(0.0, 0.0, -1.0));
            vec3 cUp  = vec3(sin(iTime), 1.0, 0.0);
            vec3 cSide = cross(cDir, cUp);

            vec3 ray = normalize(cSide * p.x + cUp * p.y + cDir);

            float acc = 0.0;
            float acc2 = 0.0;
            float t = 0.0;
            for (int i = 0; i < 99; i++) {
                vec3 pos = cPos + ray * t;
                float dist = map(pos, cPos);
                dist = max(abs(dist), 0.02);
                float a = exp(-dist*3.0);
                if (mod(length(pos)+24.0*iTime, 30.0) < 3.0) {
                    a *= 2.0;
                    acc2 += a;
                }
                acc += a;
                t += dist * 0.5;
            }

            vec3 col = vec3(acc * 0.99, acc * 0.011 + acc2*0.002, acc * 0.012+ acc2*0.005);
            fragColor = vec4(col, 1.0 - t * 0.03);
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

    // Create positions for ShaderSixteen (similar to previous shaders)
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

export default ShaderSixteen;
