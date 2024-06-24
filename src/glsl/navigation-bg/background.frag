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

    st.x *= 0.7;

    vec3 color = vec3(.0);

    const int CELLS = 5;

    // Cell positions
    vec2 point[CELLS];
    

    point[0] = vec2(0.83,0.75);
    point[1] = vec2(0.60,0.07);
    point[2] = vec2(0.28, 0.64);
    point[3] =  vec2(0.31,0.31);
    point[4] = u_mouse/u_resolution.xy;

    // new cells
    // point[5] = vec2(0.10, 0.80); // New cell
    // point[6] = vec2(0.90, 0.20); // New cell



    // // make the area reshape
    // for (int i = 0; i < CELLS; i++) {
    //     point[i] = vec2(
    //         c * point[i].x - s * point[i].y,
    //         s * point[i].x + c * point[i].y
    //     );
    // }

    float m_dist = 1.;  // minimum distance

    // Iterate through the points positions
    for (int i = 0; i < CELLS; i++) {
        float dist = distance(st, point[i]);

        // Keep the closer distance
        m_dist = min(m_dist, dist);
    }

    // Draw the min distance (distance field)
    color += m_dist;
        // * vec3(0.9);    // Adjust color to be a very lighter gray

    // Interpolation towards white
    // This will lighten the color towards white while maintaining the original pattern

    vec3 baseColor = color; // Original color from the pattern
    vec3 targetColor = vec3(0.9); // White

    // Define a fixed factor for interpolation towards white
    // This factor determines how much the original color is blended towards white
    // 0.0 means no change (fully the original color), 1.0 means fully white
    float blendTowardsWhiteFactor = 0.35; // Adjust this value to control the effect

    // Interpolate between the original color and white
    color = mix(baseColor, targetColor, blendTowardsWhiteFactor);


    // Show isolines
    // color -= step(.7,abs(sin(50.0*m_dist)))*.3;

    // ensure color is within 0.0 and 1.0
    color = clamp(color, 0.0, 1.0);


    gl_FragColor = vec4(color,1.0);
}