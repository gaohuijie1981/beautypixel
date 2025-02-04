import { ShaderNode } from './ShaderNode';

export class BoxDifferenceNode extends ShaderNode {

  constructor (gl: WebGLRenderingContext, delta: number = 7.07) {
    super(gl);
    this.delta = delta;
  }

  private inputTexture1: WebGLTexture | HTMLImageElement;
  public setInputTexture1(texture: WebGLTexture | HTMLImageElement): void {
    this.inputTexture1 = texture;
  }

  private inputTexture2: WebGLTexture | HTMLImageElement;
  public setInputTexture2(texture: WebGLTexture | HTMLImageElement): void {
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

  public apply(screen: boolean = false): WebGLTexture {

    this.useProgram();
    this.useStandardFrameBuffer(screen);

    this.gl.uniform1f(this.gl.getUniformLocation(this.program, 'delta'), this.delta);

    this.loadTexture(this.inputTexture1, 'inputTexture1', 0);
    this.loadTexture(this.inputTexture2, 'inputTexture2', 1);

    this.draw();

    return this.frameBufferTexture;
  }
}
