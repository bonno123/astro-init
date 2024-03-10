precision mediump float;

uniform float u_time;
uniform vec2 u_resolution;

// Plot a line on Y using a value between 0.0 - 1.0
float plot(vec2 st) {    
    return smoothstep(0.02, 0.0, abs(st.y - st.x));
}

void main() {
    vec2 st = gl_FragCoord.xy/u_resolution.xy;

    float y = st.x;

    vec3 color = vec3(y);
    // vec3 color = vec3(st.x, st.y, abs(sin(u_time*0.1)));

    // Plot the line
    float pct = plot(st);
    color = (1.0-pct)*color+pct*vec3(0.0,1.0,0.0);

    
    gl_FragColor = vec4(color,1.0);
}
