document.addEventListener("DOMContentLoaded", function () {
    var canvas = document.getElementById("shaderFifteenCanvas"); // Make sure to update the canvas ID accordingly

    var vertexShaderSource =
        "attribute vec4 my_vertex_position;" +
        "void main(void) {" +
        "  gl_Position = my_vertex_position;" +
        "}";

    // Fragment shader source code for ShaderFifteen
    var fsSource = `
        #ifdef GL_ES
        precision highp float;
        #endif

        // glslsandbox uniforms
        uniform float time;
        uniform vec2 resolution;
        varying vec2 surfacePosition;

        // shadertoy emulation
        #define iTime time
        #define iResolution resolution

        mat2 r2d(float a) {
            float c = cos(a), s = sin(a);
            return mat2(
                c, s,
                -s, c
            );
        }
        float hash( vec2 p )
        {
            return fract( sin( dot(p, vec2( 15.79, 81.93  ) ) * 45678.9123 ) );
        }

        float valueNoise( vec2 p )
        {

            vec2 i = floor( p );
            vec2 f = fract( p );

            f = f*f*(3.0 - 2.0*f);

            float bottomOfGrid =    mix( hash( i + vec2( 0.0, 0.0 ) ), hash( i + vec2( 1.0, 0.0 ) ), f.x );

            float topOfGrid =       mix( hash( i + vec2( 0.0, 1.0 ) ), hash( i + vec2( 1.0, 1.0 ) ), f.x );


            float t = mix( bottomOfGrid, topOfGrid, f.y );

            return t;
        }

        float fbm( vec2 uv )
        {
            float sum = 0.00;
            float amp = 0.7;

            for( int i = 0; i < 4; ++i )
            {
                sum += valueNoise( uv ) * amp;
                uv += uv * 1.2;
                amp *= 0.4;
            }

            return sum;
        }
        void mainImage( out vec4 fragColor, in vec2 fragCoord )
        {

            float time = iTime;
            float rotTime = sin(time);

            vec3 color1 = vec3(0.8, 0.2, 0.);
            vec3 color2 = vec3(.0, 0.2, 0.8);

            vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;
            uv -= vec2(0.0, 0.0); // Center the UV coordinates
            uv.y *= iResolution.y / iResolution.x; // Adjust y for aspect ratio


            vec3 destColor = vec3(2.0 * rotTime, .0, 0.5);
            float f = 10.15;
            const float maxIt = 18.0;
            vec3 shape = vec3(0.);
            for(float i = 0.0; i < maxIt; i++){
                float s = sin((time / 111.0) + i * cos(iTime*0.02+i)*0.05+0.05);
                float c = cos((time / 411.0) + i * (sin(time*0.02+i)*0.05+0.05));
                c += sin(iTime);
                f = (.005) / abs(length(uv / vec2(c, s)) - 0.4);
                f += exp(-400.*distance(uv, vec2(c,s)*0.5))*2.;
                // Mas
                f += exp(-200.*distance(uv, vec2(c,s)*-0.5))*2.;
                // Circulito
                f += (.008) / abs(length(uv/2. / vec2(c/4. + sin(time*4.), s/4.)));
                f += fbm( uv * 20.5 )*0.05;
                float idx = float(i)/ float(maxIt);
                idx = fract(idx*2.);
                vec3 colorX = mix(color1, color2,idx);
                shape += f * colorX;

                uv += fbm( uv * 20.5 )*0.02;
                uv *= r2d(iTime*0.1 + cos(i*50.)*f);

            }

            fragColor = vec4(shape,1.0);
        }

        void main(void)
        {
            mainImage(gl_FragColor, gl_FragCoord.xy);
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

    // Create positions for ShaderFifteen to represent a circle
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

export default ShaderFifteen;
