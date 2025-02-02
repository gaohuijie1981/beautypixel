import { BaseNode } from './BaseNode';

export class RGBSplitNode extends BaseNode {

  private channelType: number; // 1: R, 2: G, 3: B
  constructor(gl: WebGLRenderingContext, type: number) {
    super(gl);
    this.channelType = Math.min(Math.max(type, 1), 3);
  }

  private inputTexture: WebGLTexture;
  public setInputTexture(texture: WebGLTexture): void {
    this.inputTexture = texture;
  }

  public getVertexShader(): string {
    return `
          precision mediump float;
          attribute vec4 position;
          attribute vec2 inputTextureCoordinate;
          varying vec2 textureCoordinate;
          
          void main() {
              gl_Position = vec4(position.x, position.y, 0.0, 1.0);
              textureCoordinate = inputTextureCoordinate;
          }`;
  }

  public getFragmentShader(): string {
    const channelSelection = this.channelType === 1 ? 'color.r' : 
                           this.channelType === 2 ? 'color.g' : 
                           'color.b';

    return `
          precision mediump float;
          varying vec2 textureCoordinate;
          uniform sampler2D inputTexture;

          void main() {
              vec4 color = texture2D(inputTexture, textureCoordinate);
              float selectedChannel = ${channelSelection};
              gl_FragColor = vec4(selectedChannel, selectedChannel, selectedChannel, color.a);
          }`;
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

    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.inputTexture);
    const textureLocation = this.gl.getUniformLocation(this.program, 'inputTexture');
    this.gl.uniform1i(textureLocation, 0);

    this.gl.viewport(0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);

    return frameBufferTexture;
  }
}