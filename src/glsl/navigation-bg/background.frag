// Original Author: Patricio Gonzalez Vivo (@patriciogv)
// Mofiied by: @avik-banik
// Description: A simple distance field shader with 4 cells
// Date: 2021-07-02


#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

void main() {
    vec2 st = gl_FragCoord.xy/u_resolution.xy;
    st.x *= u_resolution.x/u_resolution.y;

    st.x *= 0.6;
    st.y *= 0.9;

    vec3 color = vec3(.0);

    const int CELLS = 5;

    // Cell positions
    vec2 point[CELLS];

    point[0] = vec2(0.83,0.75);
    point[1] = vec2(0.60,0.07);
    point[2] = vec2(0.28,0.64);
    point[3] =  vec2(0.31,sin(u_time)*0.5+0.5);
    point[4] = u_mouse/u_resolution;

    // new cells
    // point[5] = vec2(0.10, 0.80); // New cell
    // point[6] = vec2(0.90, 0.20); // New cell


    float m_dist = 1.;  // minimum distance

    // Iterate through the points positions
    for (int i = 0; i < CELLS; i++) {
        float dist = distance(st, point[i]);

        // Keep the closer distance
        m_dist = min(m_dist, dist);
    }

    // Draw the min distance (distance field)
    color += m_dist
        // Adjust color to be a even a more lighter blue
        * vec3(0.5, 0.5, 3.0);
        
    // Adjust color to be purplish
    // float baseColorIntensity = m_dist + sin(u_time) * 0.5;
    // produce a blue purple color
    // color = vec3(0.5, 0.0, 0.5) * baseColorIntensity;

    // Show isolines
    // color -= step(.7,abs(sin(50.0*m_dist)))*.3;


    gl_FragColor = vec4(color,1.0);
}