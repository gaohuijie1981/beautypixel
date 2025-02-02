export abstract class BaseNode {

  protected gl: WebGLRenderingContext;

  constructor(gl: WebGLRenderingContext) {
    this.gl = gl;
  }

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
    
  protected static async loadImageAsync(imageUrl: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject();
      image.src = imageUrl;
    });
  }

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

  protected program: WebGLProgram | null = null;

  public getProgram(): WebGLProgram | null {
    return this.program;
  }

  protected useProgram(): void {
    if (!this.program) {
      const vertexShader = this.createShader(this.gl.VERTEX_SHADER, this.getVertexShader());
      const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, this.getFragmentShader());

      this.program = this.gl.createProgram();
      this.gl.attachShader(this.program, vertexShader);
      this.gl.attachShader(this.program, fragmentShader);
      this.gl.linkProgram(this.program);
    }

    this.gl.useProgram(this.program);
  }

  protected destroyProgram(): void {
    if (this.program) {
      const shaders = this.gl.getAttachedShaders(this.program);
      if (shaders) {
        shaders.forEach(shader => {
          this.gl.detachShader(this.program, shader);
          this.gl.deleteShader(shader);
        });
      }

      this.gl.deleteProgram(this.program);
      this.program = null;
    }
  }

  abstract getVertexShader(): string;
  abstract getFragmentShader(): string;
  abstract apply(): WebGLTexture;
}
