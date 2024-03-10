export function getRenderingContext(canvasElement: HTMLCanvasElement | null): WebGLRenderingContext | null {

    if(!canvasElement) {
        console.error('no canvas element provided.');

        return null
    }

    // canvasElement.width = canvasElement.clientWidth;
    // canvasElement.height = canvasElement.clientHeight;

    var gl = canvasElement.getContext("webgl") 
        || canvasElement.getContext("experimental-webgl") as WebGLRenderingContext;

    if (!gl) {
        var paragraph = document.querySelector("p"); if(!paragraph) return null
        
        paragraph.innerHTML = "Failed to get WebGL context."
        + "Your browser or device may not support WebGL.";

        return null;
    }

    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    return gl;
}