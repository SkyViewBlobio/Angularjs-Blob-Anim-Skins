document.addEventListener("DOMContentLoaded", function () {
    var canvas = document.getElementById("shaderSevenCanvas");

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

        // rotate position around axis
        vec2 rotate(vec2 p, float a)
        {
            return vec2(p.x * cos(a) - p.y * sin(a), p.x * sin(a) + p.y * cos(a));
        }

        // 1D random numbers
        float rand(float n)
        {
            return fract(sin(n) * 43758.5453123);
        }

        // 2D random numbers
        vec2 rand2(in vec2 p)
        {
            return fract(vec2(sin(p.x * 591.32 + p.y * 154.077 + time), cos(p.x * 391.32 + p.y * 49.077 + time)));
        }

        // 1D noise
        float noise1(float p)
        {
            float fl = floor(p);
            float fc = fract(p);
            return mix(rand(fl), rand(fl + 1.0), fc);
        }

        // voronoi distance noise, based on iq's articles
        float voronoi(in vec2 x)
        {
            vec2 p = floor(x);
            vec2 f = fract(x);

            vec2 res = vec2(8.0);
            for (int j = -1; j <= 1; j++)
            {
                for (int i = -1; i <= 1; i++)
                {
                    vec2 b = vec2(i, j);
                    vec2 r = vec2(b) - f + rand2(p + b);

                    // chebyshev distance, one of many ways to do this
                    float d = sqrt(abs(r.x * r.x) + abs(r.y * r.y));

                    if (d < res.x)
                    {
                        res.y = res.x;
                        res.x = d;
                    }
                    else if (d < res.y)
                    {
                        res.y = d;
                    }
                }
            }
            return res.y - res.x;
        }

        void main(void)
        {
            vec2 uv = gl_FragCoord.xy / resolution.xy;
            uv = (uv - 0.5) * 2.0;
            vec2 suv = uv;
            uv.x *= resolution.x / resolution.y;

            float v = 0.0;

            // that looks highly interesting:
            v = 1.0 - length(uv) * 1.3;
            float flicker = noise1(time * 2.0) * 0.8 + 0.4;

            // add some noise octaves
            float a = 0.6, f = 3.0;

            for (int i = 0; i < 4; i++)
            {
                float v1 = voronoi(uv * f + 5.0);
                float v2 = 0.0;

                // make the moving electrons-effect for higher octaves
                if (i > 0)
                {
                    // of course everything based on voronoi
                    v2 = voronoi(uv * f * 0.5 + 50.0 + time);

                    float va = 0.0, vb = 0.0;
                    va = 1.0 - smoothstep(0.0, 0.1, v1);
                    vb = 1.0 - smoothstep(0.0, 0.08, v2);
                    v += a * pow(va * (0.5 + vb), 2.0);
                }

                // make sharp edges
                v1 = 1.0 - smoothstep(0.0, 0.3, v1);

                // noise is used as intensity map
                v2 = a * (noise1(v1 * 0.5 + 0.1));

                // octave 0's intensity changes a bit
                if (i == 0)
                    v += v2 * flicker;
                else
                    v += v2;

                f *= 3.0;
                a *= 0.7;
            }

            // slight vignetting
            v *= exp(-0.6 * length(suv)) * 1.2;

            // old blueish color set
            vec3 cexp = vec3(1.0, 2.0, 4.0);
            cexp *= 1.3;

            vec3 col = vec3(pow(v, cexp.x), pow(v, cexp.y), pow(v, cexp.z)) * 2.0;
            col = 1.0 - exp(-col);
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

    // Create positions for ShaderSeven to represent a circle
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

export default ShaderSeven;
