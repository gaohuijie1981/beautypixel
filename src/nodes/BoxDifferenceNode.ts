import { BaseNode } from './BaseNode';

export class BoxDifferenceNode extends BaseNode {

  constructor (gl: WebGLRenderingContext, delta: number = 7.07) {
    super(gl);
    this.delta = delta;
  }

  private inputTexture1: WebGLTexture;
  public setInputTexture1(texture: WebGLTexture): void {
    this.inputTexture1 = texture;
  }

  private inputTexture2: WebGLTexture;
  public setInputTexture2(texture: WebGLTexture): void {
    this.inputTexture2 = texture;
  }

  private delta: number;
  public setDelta(value: number): void {
    this.delta = value;
  }

  public getVertexShader(): string {
    let shaderStr = `
      attribute vec4 position;
      attribute vec4 inputTextureCoordinate;
      varying vec2 textureCoordinate;

      void main() {
        gl_Position = position;
        textureCoordinate = inputTextureCoordinate.xy;
      }`;

    return shaderStr;
  }

  public getFragmentShader(): string {
    let shaderStr = `
      precision mediump float;
      varying vec2 textureCoordinate;
      uniform sampler2D inputTexture1;
      uniform sampler2D inputTexture2;
      uniform float delta;

    void main() {
      vec3 color1 = texture2D(inputTexture1, textureCoordinate).rgb;
      vec3 color2 = texture2D(inputTexture2, textureCoordinate).rgb;
      vec3 diffColor = (color1 - color2) * delta;
      diffColor = min(diffColor * diffColor, 1.0);
      gl_FragColor = vec4(diffColor, 1.0);
    }`;

    return shaderStr;
  }

  public apply(): WebGLTexture {
    this.useProgram();

    const frameBuffer = this.gl.createFramebuffer();
    const frameBufferTexture = this.gl.createTexture();

    this.gl.bindTexture(this.gl.TEXTURE_2D, frameBufferTexture);
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, null);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);

    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, frameBuffer);
    this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, frameBufferTexture, 0);

    const positionLocation = this.gl.getAttribLocation(this.program, 'position');
    const positionBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
    const positions = new Float32Array([-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0]);
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

    const deltaLocation = this.gl.getUniformLocation(this.program, 'delta');
    this.gl.uniform1f(deltaLocation, this.delta);

    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.inputTexture1);
    const textureLocation1 = this.gl.getUniformLocation(this.program, 'inputTexture1');
    this.gl.uniform1i(textureLocation1, 0);

    this.gl.activeTexture(this.gl.TEXTURE1);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.inputTexture2);
    const textureLocation2 = this.gl.getUniformLocation(this.program, 'inputTexture2');
    this.gl.uniform1i(textureLocation2, 1);

    this.gl.viewport(0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);

    return frameBufferTexture;
  }
}
