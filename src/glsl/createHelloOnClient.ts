export default function createGLSL() {
	window.addEventListener("load", setupWebGL, false);

	var gl: RenderingContext | null, program: WebGLProgram | null;

	var buffer: WebGLBuffer | null;

	function initializeAttributes() {
		(gl as WebGLRenderingContext).enableVertexAttribArray(0);

		buffer = (gl as WebGLRenderingContext).createBuffer();

		(gl as WebGLRenderingContext).bindBuffer((gl as WebGLRenderingContext).ARRAY_BUFFER, buffer);

		// for initial render
		(gl as WebGLRenderingContext).bufferData(
			(gl as WebGLRenderingContext).ARRAY_BUFFER, 
			new Float32Array([0.0]), 
			(gl as WebGLRenderingContext).STATIC_DRAW
		);


		(gl as WebGLRenderingContext).vertexAttribPointer(0, 1, (gl as WebGLRenderingContext).FLOAT, false, 0, 0);
	}

	function cleanup() {
		(gl as WebGLRenderingContext).useProgram(null);
		if (buffer)
		(gl as WebGLRenderingContext).deleteBuffer(buffer);
		if (program) 
		(gl as WebGLRenderingContext).deleteProgram(program);
	}

	function getRenderingContext(): WebGLRenderingContext | null {
		var canvas = document.querySelector("canvas");

		if(!canvas) {
			console.log('no script found with id=vertex-shader');

			return null
		}

		canvas.width = canvas.clientWidth;
		canvas.height = canvas.clientHeight;

		var gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl") as WebGLRenderingContext;

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

	function moveBox(evt: MouseEvent) {
		const clickXRelativeToCanvas = evt.pageX - (evt.target as HTMLElement)?.offsetLeft;
		const clickXinWebGLCoords = (
			2.0 
			* (clickXRelativeToCanvas - (gl as WebGLRenderingContext).drawingBufferWidth / 2)) 
			/ (gl as WebGLRenderingContext).drawingBufferWidth;

		(gl as WebGLRenderingContext).bufferData(
			(gl as WebGLRenderingContext).ARRAY_BUFFER,
			new Float32Array([clickXinWebGLCoords]),
			(gl as WebGLRenderingContext).STATIC_DRAW,
		);
		(gl as WebGLRenderingContext).drawArrays((gl as WebGLRenderingContext).POINTS, 0, 1);
	}

	function setupWebGL (this: Window, evt: Event) {
		window.removeEventListener(evt.type, setupWebGL, false);

		if (!(gl = getRenderingContext())) return;

		// creating vertex shader
		var vertexElem = document.querySelector("#vertex-shader");
		if(!vertexElem) {
			console.log('no script found with id=vertex-shader');

			return
		}


		var source = vertexElem.innerHTML;
		var vertexShader = gl.createShader(gl.VERTEX_SHADER)!;

		gl.shaderSource(vertexShader, source);
		gl.compileShader(vertexShader);
	
		// creating fragment shader
		var fragMentElem  = document.querySelector("#fragment-shader");
		if(!fragMentElem) {
			console.log('no script found with id=fragment-shader');

			return
		}

		source = fragMentElem.innerHTML
		
		var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)!;

		gl.shaderSource(fragmentShader, source);
		gl.compileShader(fragmentShader);

		program = gl.createProgram()!;

		gl.attachShader(program, vertexShader);
		gl.attachShader(program, fragmentShader);

		gl.linkProgram(program);

		gl.detachShader(program, vertexShader!);
		gl.detachShader(program, fragmentShader!);

		gl.deleteShader(vertexShader);
		gl.deleteShader(fragmentShader);

		
		// display error 
		if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
			var linkErrLog = gl.getProgramInfoLog(program);
			cleanup();
			var errorParagraph = document.querySelector("p")
			if(!errorParagraph) return

			errorParagraph.innerHTML = "Shader program did not link successfully. "
				+ "Error log: " + linkErrLog;

			return;
		} 

		initializeAttributes();

		gl.useProgram(program);
		gl.drawArrays(gl.POINTS, 0, 1);

		var canvasElem = document.querySelector("canvas")!
		
		canvasElem.addEventListener( "click", moveBox, false );
	}

	window.addEventListener("beforeunload", cleanup, true);

}