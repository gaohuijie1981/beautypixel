import { BaseNode } from './BaseNode';

export abstract class ShaderNode extends BaseNode {

  protected static DefaultVertexShader: string = `
    attribute vec4 position;
    attribute vec4 inputTextureCoordinate;
    varying vec2 textureCoordinate;
    
    void main() {
      gl_Position = position;
      textureCoordinate = inputTextureCoordinate.xy;
    }`;

  protected static DefaultFragmentShader: string = `
    precision mediump float;
    varying vec2 textureCoordinate;
    uniform sampler2D inputImageTexture;
    
    void main() {
      gl_FragColor = texture2D(inputImageTexture, textureCoordinate);
    }`;
    

  abstract getVertexShader(): string;
  abstract getFragmentShader(): string;
  protected createShader(type: number, source: string): WebGLShader | null {
    const shader = this.gl.createShader(type);
    if (!shader) return null;

    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.error('Shader:', this.gl.getShaderInfoLog(shader));
      this.gl.deleteShader(shader);
      return null;
    }

    return shader;
  }

  protected vertexShader: WebGLShader = null;
  protected fragmentShader: WebGLShader = null;

  protected program: WebGLProgram = null;
  protected useProgram(): void {
    if (!this.program) {
      this.program = this.gl.createProgram();

      if (!this.vertexShader) {
        this.vertexShader = this.createShader(this.gl.VERTEX_SHADER, this.getVertexShader());
        this.gl.attachShader(this.program, this.vertexShader);
      }
  
      if (!this.fragmentShader) {
        this.fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, this.getFragmentShader());
        this.gl.attachShader(this.program, this.fragmentShader);
      }

      this.gl.linkProgram(this.program);
    }

    this.gl.useProgram(this.program);
  }

  protected destroyProgram(): void {
    if (this.program) {
      this.gl.deleteProgram(this.program);
      this.program = null;
    }
  }

  protected frameBuffer: WebGLFramebuffer = null;
  protected frameBufferTexture: WebGLTexture = null;
  protected useStandardFrameBuffer(screen: boolean = false): void {

    if (screen) {
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    } else {
      this.frameBuffer = this.gl.createFramebuffer();
      this.frameBufferTexture = this.gl.createTexture();
      this.gl.bindTexture(this.gl.TEXTURE_2D, this.frameBufferTexture);
      this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, null);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
    
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.frameBuffer);
      this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, this.frameBufferTexture, 0);
    }

    const positionLocation = this.gl.getAttribLocation(this.program, 'position');
    const positionBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
    const positions = screen ? new Float32Array([-1.0, 1.0, 1.0, 1.0, -1.0, -1.0, 1.0, -1.0]) : new Float32Array([-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0]);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.STATIC_DRAW);
    this.gl.enableVertexAttribArray(positionLocation);
    this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);

    const inputTextureCoordinateLocation = this.gl.getAttribLocation(this.program, 'inputTextureCoordinate');
    const inputTextureCoordinateBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, inputTextureCoordinateBuffer);
    const inputTextureCoordinates = new Float32Array([0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0]);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, inputTextureCoordinates, this.gl.STATIC_DRAW);
    this.gl.enableVertexAttribArray(inputTextureCoordinateLocation);
    this.gl.vertexAttribPointer(inputTextureCoordinateLocation, 2, this.gl.FLOAT, false, 0, 0);
  }

  protected loadTexture(texture: WebGLTexture | HTMLImageElement, name: string, index: number = 0) {
    if (texture instanceof WebGLTexture) {
      this.gl.activeTexture(this.gl.TEXTURE0 + index);
      this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
      const textureLocation = this.gl.getUniformLocation(this.program, name);
      this.gl.uniform1i(textureLocation, 0 + index);
    } else if (texture instanceof HTMLImageElement) {
      this.gl.activeTexture(this.gl.TEXTURE0 + index);
      this.gl.bindTexture(this.gl.TEXTURE_2D, this.gl.createTexture());
      this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, texture);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
      const textureLocation = this.gl.getUniformLocation(this.program, name);
      this.gl.uniform1i(textureLocation, 0 + index);      
    }
  }

  protected draw(): void {
    this.gl.viewport(0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
  }
}
