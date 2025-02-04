import { ShaderNode } from './ShaderNode';

export class WhiteBalanceNode extends ShaderNode {

  private inputTexture: WebGLTexture | HTMLImageElement;
  public setInputTexture(texture: WebGLTexture | HTMLImageElement): void {
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

  public apply(screen: boolean = false): WebGLTexture {

    this.useProgram();
    this.useStandardFrameBuffer(screen);

    this.gl.uniform1f(this.gl.getUniformLocation(this.program, 'temperature'), this.temperature);
    this.gl.uniform1f(this.gl.getUniformLocation(this.program, 'tint'), this.tint);

    this.loadTexture(this.inputTexture, 'inputImageTexture');
    this.draw();

    return this.frameBufferTexture;
  }
}
