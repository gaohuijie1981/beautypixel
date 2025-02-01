import { BaseNode } from './BaseNode';

export class WhiteBalanceNode extends BaseNode {
  private inputTexture: WebGLTexture;
  public setInputTexture(texture: WebGLTexture): void {
    this.inputTexture = texture;
  }

  private temperature: number = 0;
  public setTemperature(value: number): void {
    this.temperature = value < 5000 ? 0.0004 * (value - 5000.0) : 0.00006 * (value - 5000.0);
  }

  private tint: number = 0;
  public setTint(value: number): void {
    this.tint = value / 100.0;
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
      uniform sampler2D inputImageTexture;
      uniform lowp float temperature;
      uniform lowp float tint;
      varying highp vec2 textureCoordinate;
      
      const lowp vec3 warmFilter = vec3(0.93, 0.54, 0.0);
      
      const mediump mat3 RGBtoYIQ =
          mat3(0.299, 0.587, 0.114,
              0.596, -0.274, -0.322,
              0.212, -0.523, 0.311);
      
      const mediump mat3 YIQtoRGB =
          mat3(1.0, 0.956, 0.621,
              1.0, -0.272, -0.647,
              1.0, -1.105, 1.702);

      void main() {
        lowp vec4 color = texture2D(inputImageTexture, textureCoordinate);
        mediump vec3 yiq = RGBtoYIQ * color.rgb;  // adjusting tint
        yiq.b = clamp(yiq.b + tint * 0.5226 * 0.1, -0.5226, 0.5226);
        lowp vec3 rgb = YIQtoRGB * yiq;
        lowp vec3 processed = vec3(
            (rgb.r < 0.5
                ? (2.0 * rgb.r * warmFilter.r)
                : (1.0 - 2.0 * (1.0 - rgb.r) *
                              (1.0 - warmFilter.r))),  // adjusting temperature
            (rgb.g < 0.5 ? (2.0 * rgb.g * warmFilter.g)
                        : (1.0 - 2.0 * (1.0 - rgb.g) * (1.0 - warmFilter.g))),
            (rgb.b < 0.5 ? (2.0 * rgb.b * warmFilter.b)
                        : (1.0 - 2.0 * (1.0 - rgb.b) * (1.0 - warmFilter.b))));

        gl_FragColor = vec4(mix(rgb, processed, temperature), color.a);
      }`;
  }

  public apply(): WebGLTexture {
    this.useProgram();

    // 设置统一变量
    const tempLocation = this.gl.getUniformLocation(this.program, 'temperature');
    this.gl.uniform1f(tempLocation, this.temperature);
    const tintLocation = this.gl.getUniformLocation(this.program, 'tint');
    this.gl.uniform1f(tintLocation, this.tint);

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

    // 绑定输入纹理
    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.inputTexture);
    const textureLocation = this.gl.getUniformLocation(this.program, 'inputImageTexture');
    this.gl.uniform1i(textureLocation, 0);

    // 绘制
    this.gl.viewport(0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);

    return frameBufferTexture;
  }
}
