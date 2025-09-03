//Sci-fi radar based on the work of gmunk for Oblivion
//http://work.gmunk.com/OBLIVION-GFX

#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_intensity; // 0.0 to 1.0, default 0.7

#define SMOOTH(r,R) (1.0-smoothstep(R-1.0,R+1.0, r))
#define RANGE(a,b,x) ( step(a,x)*(1.0-step(b,x)) )
#define RS(a,b,x) ( smoothstep(a-1.0,a+1.0,x)*(1.0-smoothstep(b-1.0,b+1.0,x)) )
#define M_PI 3.1415926535897932384626433832795

// Color definitions for white background (darker, more visible colors)
// Original colors were designed for black background, these are inverted for white

// Main radar element colors (darker, vibrant colors for white background)
#define radarBlue1 vec3(0.051, 0.251, 0.451)    // Dark blue for primary circles
#define radarBlue2 vec3(0.1, 0.3, 0.6)       // Medium blue for triangles
#define radarBlue3 vec3(0.0392, 0.4314, 0.5294)       // Teal for moving elements
#define radarBlue4 vec3(0.1961, 0.0588, 0.4706)       // Purple for outer patterns
#define radarRed   vec3(0.8588, 0.3686, 0.4431)       // Darker red for better visibility on white

// Animation parameters
#define MOV(a,b,c,d,t) (vec2(a*cos(t)+b*cos(0.1*(t)), c*sin(t)+d*cos(0.1*(t))))

float movingLine(vec2 uv, vec2 center, float radius)
{
    //angle of the line
    float theta0 = 90.0 * u_time;
    vec2 d = uv - center;
    float r = sqrt( dot( d, d ) );
    if(r<radius)
    {
        //compute the distance to the line theta=theta0
        vec2 p = radius*vec2(cos(theta0*M_PI/180.0),
                            -sin(theta0*M_PI/180.0));
        float l = length( d - p*clamp( dot(d,p)/dot(p,p), 0.0, 1.0) );
        d = normalize(d);
        //compute gradient based on angle difference to theta0
        	float theta = mod(180.0*atan(d.y,d.x)/M_PI+theta0,360.0);
        float gradient = clamp(1.0-theta/90.0,0.0,1.0);
        return SMOOTH(l,1.0)+0.5*gradient;
    }
    else return 0.0;
}

float circle(vec2 uv, vec2 center, float radius, float width)
{
    float r = length(uv - center);
    return SMOOTH(r-width/2.0,radius)-SMOOTH(r+width/2.0,radius);
}

float circle2(vec2 uv, vec2 center, float radius, float width, float opening)
{
    vec2 d = uv - center;
    float r = sqrt( dot( d, d ) );
    d = normalize(d);
    if( abs(d.y) > opening )
        return SMOOTH(r-width/2.0,radius)-SMOOTH(r+width/2.0,radius);
    else
        return 0.0;
}

float circle3(vec2 uv, vec2 center, float radius, float width)
{
    vec2 d = uv - center;
    float r = sqrt( dot( d, d ) );
    d = normalize(d);
    float theta = 180.0*(atan(d.y,d.x)/M_PI);
    return smoothstep(2.0, 2.1, abs(mod(theta+2.0,45.0)-2.0)) *
        mix( 0.5, 1.0, step(45.0, abs(mod(theta, 180.0)-90.0)) ) *
        (SMOOTH(r-width/2.0,radius)-SMOOTH(r+width/2.0,radius));
}

float triangles(vec2 uv, vec2 center, float radius)
{
    vec2 d = uv - center;
    return RS(-8.0, 0.0, d.x-radius) * (1.0-smoothstep( 7.0+d.x-radius,9.0+d.x-radius, abs(d.y)))
         + RS( 0.0, 8.0, d.x+radius) * (1.0-smoothstep( 7.0-d.x-radius,9.0-d.x-radius, abs(d.y)))
         + RS(-8.0, 0.0, d.y-radius) * (1.0-smoothstep( 7.0+d.y-radius,9.0+d.y-radius, abs(d.x)))
         + RS( 0.0, 8.0, d.y+radius) * (1.0-smoothstep( 7.0-d.y-radius,9.0-d.y-radius, abs(d.x)));
}

float _cross(vec2 uv, vec2 center, float radius)
{
    vec2 d = uv - center;
    int x = int(d.x);
    int y = int(d.y);
    float r = sqrt( dot( d, d ) );
    if( (r<radius) && ( (x==y) || (x==-y) ) )
        return 1.0;
    else return 0.0;
}

float dots(vec2 uv, vec2 center, float radius)
{
    vec2 d = uv - center;
    float r = sqrt( dot( d, d ) );
    if( r <= 2.5 )
        return 1.0;
    if( ( r<= radius) && ( (abs(d.y+0.5)<=1.0) && ( mod(d.x+1.0, 50.0) < 2.0 ) ) )
        return 1.0;
    else if ( (abs(d.y+0.5)<=1.0) && ( r >= 50.0 ) && ( r < 115.0 ) )
        return 0.5;
    else
        return 0.0;
}

float bip1(vec2 uv, vec2 center)
{
    return SMOOTH(length(uv - center),3.0);
}

float bip2(vec2 uv, vec2 center)
{
    float r = length(uv - center);
    float R = 8.0+mod(87.0*u_time, 80.0);
    // Amplify the effect for better visibility on white background
    return 1.25 * ((0.5-0.5*cos(30.0*u_time)) * SMOOTH(r,5.0)
        + SMOOTH(6.0,r)-SMOOTH(8.0,r)
        + smoothstep(max(8.0,R-20.0),R,r)-SMOOTH(R,r));
}

void main()
{
    // Get the current fragment coordinates
    vec2 uv = gl_FragCoord.xy;
    // Center of the image
    vec2 c = u_resolution.xy/2.0;

    // Start with white background
    vec3 finalColor = vec3(1.0, 1.0, 1.0);

    // Main radar elements - using multiplicative blending for all elements
    // This darkens the white background where elements appear
    
    // Inner circles
    finalColor = mix(finalColor, radarBlue1, 0.8 * circle(uv, c, 100.0, 1.0));
    finalColor = mix(finalColor, radarBlue1, 0.8 * circle(uv, c, 165.0, 1.0));
    
    // Mid-range circle
    finalColor = mix(finalColor, radarBlue3, 0.8 * circle(uv, c, 240.0, 2.0));
    
    // Outer segmented circle
    finalColor = mix(finalColor, radarBlue4, 0.8 * circle3(uv, c, 313.0, 4.0));
    
    // Triangular markers at the perimeter
    finalColor = mix(finalColor, radarBlue2, 0.8 * triangles(uv, c, 315.0 + 30.0*sin(u_time)));
    
    // Radar sweep line
    finalColor = mix(finalColor, radarBlue3, 0.8 * movingLine(uv, c, 240.0));
    
    // Center dot
    finalColor = mix(finalColor, radarBlue1, 0.9 * circle(uv, c, 10.0, 1.0));
    
    // Broken circle with opening
    finalColor = mix(finalColor, radarBlue3, 0.7 * circle2(uv, c, 262.0, 1.0, 0.5+0.2*cos(u_time)));
    
    // Cross pattern
    finalColor = mix(finalColor, vec3(0.2), 0.5 * _cross(uv, c, 240.0));
    
    // Add dot grid pattern (previously unused)
    finalColor = mix(finalColor, radarBlue1, 0.7 * dots(uv, c, 200.0));

    // Handle the blips - using proper blending for visibility on white
    if(length(uv-c) < 240.0)
    {
        // Animate first blip with random movement
        vec2 p = 130.0*MOV(1.3,1.0,1.0,1.4,3.0+0.1*u_time);
        finalColor = mix(finalColor, vec3(0.1, 0.1, 0.3), 0.9 * bip1(uv, c+p));
        
        // Animate second blip with different random movement
        p = 130.0*MOV(0.9,-1.1,1.7,0.8,-2.0+sin(0.1*u_time)+0.15*u_time);
        finalColor = mix(finalColor, vec3(0.1, 0.1, 0.3), 0.9 * bip1(uv, c+p));
        
        // Animate red alert blip - increased visibility
        p = 50.0*MOV(1.54,1.7,1.37,1.8,sin(0.1*u_time+7.0)+0.2*u_time);
        // Increased multiplier from u_intensity to max(u_intensity, 0.8) to ensure visibility
        finalColor = mix(finalColor, radarRed, max(u_intensity, 0.8) * bip2(uv,c+p));
    }

    gl_FragColor = vec4(finalColor, 1.0);
}
