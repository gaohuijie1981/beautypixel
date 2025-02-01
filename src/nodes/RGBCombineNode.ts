import { BaseNode } from './BaseNode';

export class RGBCombineNode extends BaseNode {
  private redTexture: WebGLTexture;
  public setRed(texture: WebGLTexture): void {
    this.redTexture = texture;
  }

  private greenTexture: WebGLTexture;
  public setGreen(texture: WebGLTexture): void {
    this.greenTexture = texture;
  }

  private blueTexture: WebGLTexture;
  public setBlue(texture: WebGLTexture): void {
    this.blueTexture = texture;
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
    return `
          precision mediump float;
          varying vec2 textureCoordinate;
          uniform sampler2D redTexture;
          uniform sampler2D greenTexture;
          uniform sampler2D blueTexture;

          void main() {
              float r = texture2D(redTexture, textureCoordinate).r;
              float g = texture2D(greenTexture, textureCoordinate).r;
              float b = texture2D(blueTexture, textureCoordinate).r;
              gl_FragColor = vec4(r, g, b, 1.0);
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

    // 设置顶点数据
    const positionLocation = this.gl.getAttribLocation(this.program, 'position');
    const positionBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
    const positions = new Float32Array([-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0]);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.STATIC_DRAW);
    this.gl.enableVertexAttribArray(positionLocation);
    this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);

    // 设置纹理坐标
    const inputTextureCoordinateLocation = this.gl.getAttribLocation(this.program, 'inputTextureCoordinate');
    const inputTextureCoordinateBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, inputTextureCoordinateBuffer);
    const inputTextureCoordinates = new Float32Array([0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0]);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, inputTextureCoordinates, this.gl.STATIC_DRAW);
    this.gl.enableVertexAttribArray(inputTextureCoordinateLocation);
    this.gl.vertexAttribPointer(inputTextureCoordinateLocation, 2, this.gl.FLOAT, false, 0, 0);

    // 绑定红色通道纹理
    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.redTexture);
    const redLocation = this.gl.getUniformLocation(this.program, 'redTexture');
    this.gl.uniform1i(redLocation, 0);

    // 绑定绿色通道纹理
    this.gl.activeTexture(this.gl.TEXTURE1);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.greenTexture);
    const greenLocation = this.gl.getUniformLocation(this.program, 'greenTexture');
    this.gl.uniform1i(greenLocation, 1);

    // 绑定蓝色通道纹理
    this.gl.activeTexture(this.gl.TEXTURE2);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.blueTexture);
    const blueLocation = this.gl.getUniformLocation(this.program, 'blueTexture');
    this.gl.uniform1i(blueLocation, 2);

    // 绘制
    this.gl.viewport(0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);

    return frameBufferTexture;
  }
}