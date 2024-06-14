document.addEventListener("DOMContentLoaded", function () {
    var canvas = document.getElementById("shaderFiveCanvas");

    var vertexShaderSource =
        "attribute vec4 my_vertex_position;" +
        "void main(void) {" +
        "  gl_Position = my_vertex_position;" +
        "}";

    // Fragment shader source code
    var fsSource = `
        #ifdef GL_ES
        precision highp float;
        #endif

        uniform float time;
        uniform vec2 mouse;
        uniform vec2 resolution;

        #define iterations 0
        #define formuparam2 0.79

        #define volsteps 9
        #define stepsize 0.190

        #define zoom 1.900
        #define tile  .50

        #define speed2  0.0
        #define cloudSpeed 0.0
        #define twinkle 0.00

        #define brightness 0.008
        #define darkmatter 8.700
        #define distfading 0.760
        #define saturation 0.850

        #define transverseSpeed 0.0 //zoom*2.0
        #define cloud 0.09

        float triangle(float x, float a) {
            float output2 = 2.0 * abs(2.0 * ((x / a) - floor((x / a) + 0.5))) - 1.0;
            return output2;
        }

        float field(in vec3 p) {
            float cloudTime = time * cloudSpeed;
            float strength = 7. + .03 * log(1.e-6 + fract(sin(cloudTime) * 4373.11));
            float accum = 0.;
            float prev = 0.;
            float tw = 0.;

            for (int i = 0; i < 9; ++i) {
                float mag = dot(p, p);
                p = abs(p) / mag + vec3(-.5, -.8 + 0.1 * sin(cloudTime * 0.7 + 2.0), -1.1 + 0.3 * cos(cloudTime * 0.3));
                float w = exp(-float(i) / 7.);
                accum += w * exp(-strength * pow(abs(mag - prev), 2.3));
                tw += w;
                prev = mag;
            }
            return max(0., 5. * accum / tw - .7);
        }

        void main() {
            vec2 uv2 = gl_FragCoord.xy / resolution.xy - 0.5;
            uv2.y *= resolution.y / resolution.x;
            vec2 uvs = uv2;

            float time2 = time;

            float speed = -speed2 * cos(time2 * 0.02 + 3.1415926 / 4.0);
            float formuparam = formuparam2;

            // get coords and direction
            vec2 uv = uvs;

            // mouse rotation
            float a_xz = 0.9;
            float a_yz = -2.6;
            float a_xy = 0.9 + time * 0.04;

            mat2 rot_xz = mat2(cos(a_xz), sin(a_xz), -sin(a_xz), cos(a_xz));
            mat2 rot_yz = mat2(cos(a_yz), sin(a_yz), -sin(a_yz), cos(a_yz));
            mat2 rot_xy = mat2(cos(a_xy), sin(a_xy), -sin(a_xy), cos(a_xy));

            float v2 = 1.0;
            vec3 dir = vec3(uv * zoom, 1.);
            vec3 from = vec3(0.0, 0.0, 0.0);

            from.x += 10.0 * cos(0.004 * time);
            from.y += 10.0 * sin(0.00777777 * time);
            from.z += 0.003 * time;

            vec3 forward = vec3(0., 0., 1.0 - twinkle);

            dir.xy *= rot_xy;
            dir.xz *= rot_xz;
            dir.yz *= rot_yz;

            forward.xy *= rot_xy;
            forward.xz *= rot_xz;
            forward.yz *= rot_yz;

            from.xy *= rot_xy;
            from.xz *= rot_xz;
            from.yz *= rot_yz;

            // zoom
            float zooom = (time2) * speed;

            from += forward * zooom * 1.0;

            float sampleShift = mod(zooom, stepsize);

            float zoffset = -sampleShift;
            sampleShift /= stepsize; // make from 0 to 1

            // volumetric rendering
            float s = 0.74;
            float s3 = s + stepsize / 2.0;
            vec3 v = vec3(0.);
            float t3 = 0.0;

            vec3 backCol2 = vec3(0.);
            for (int r = 0; r < volsteps; r++) {
                vec3 p2 = from + (s + zoffset) * dir;
                vec3 p3 = from + (s3 + zoffset) * dir;

                p2 = abs(vec3(tile) - mod(p2, vec3(tile * 2.))); // tiling fold
                p3 = abs(vec3(tile) - mod(p3, vec3(tile * 2.))); // tiling fold
                #ifdef cloud
                t3 = field(p3);
                #endif

                float pa, a = pa = 0.;
                for (int i = 0; i < iterations; i++) {
                    p2 = abs(p2) / dot(p2, p2) - formuparam; // the magic formula
                    float D = abs(length(p2) - pa); // absolute sum of average change
                    a += i > 7 ? min(12., D) : D;
                    pa = length(p2);
                }

                float aSquare = a * a;
                a *= aSquare; // add contrast

                float s1 = s + zoffset;
                float fade = pow(distfading, max(0., float(r) - sampleShift));
                v += fade;

                v += vec3(s1, s1 * s1, s1 * s1 * s1 * s1) * a * brightness * fade; // coloring based on distance

                backCol2 += mix(.4, 1., v2) * vec3(1.8 * t3 * t3 * t3, 1.4 * t3 * t3, t3) * fade;

                s += stepsize;
                s3 += stepsize;
            }

            v = mix(vec3(length(v)), v, saturation); // color adjust

            vec4 forCol2 = vec4(v * .01, 1.);
            #ifdef cloud
            backCol2 *= cloud;
            #endif
            backCol2.b *= 1.8;
            backCol2.r *= 0.05;

            backCol2.b = 0.5 * mix(backCol2.g, backCol2.b, 0.8);
            backCol2.g = 0.0;

            gl_FragColor = forCol2 + vec4(backCol2, 1.0);
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

    // Create positions for ShaderFive to represent a circle
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

export default ShaderFive;
