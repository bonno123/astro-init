import { getRenderingContext } from "~/glsl/utils/getWebGLRenderingContext";

export default function createGLSL() {
	let gl: RenderingContext | null, 
		program: WebGLProgram | null,
		buffer: WebGLBuffer | null;

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
		if (!gl) return;

		(gl as WebGLRenderingContext).useProgram(null);

		if (buffer){
			(gl as WebGLRenderingContext).deleteBuffer(buffer);
			buffer = null;
		}
		if (program) {
			(gl as WebGLRenderingContext).deleteProgram(program);
			program = null;
		}
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

	function setupWebGL () {
		cleanup();

		const canvasId = "mdn-hello-glsl";
		const canvasElem: HTMLCanvasElement | null = document.querySelector("#" + canvasId) ;

		if(!canvasElem) return;


		gl = getRenderingContext(canvasElem);

		if ( !(gl = getRenderingContext(canvasElem )) ) {
			console.error("WebGL context could not be created");

			return;
		};

		// initialize attributes
		initializeAttributes();

		// creating vertex shader
		var vertexElem = document.querySelector("#vertex-shader");
		if(!vertexElem) {
			console.log('no script found with id=vertex-shader');

			return;
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

		gl.useProgram(program);
		gl.drawArrays(gl.POINTS, 0, 1);

		// Attach the event listener directly to the canvas
		canvasElem.removeEventListener('click', moveBox, false);
		canvasElem.addEventListener('click', moveBox, false);
	}

	function reinitializeGLSL() {
		setupWebGL()
	}

	return { reinitializeGLSL }

}

