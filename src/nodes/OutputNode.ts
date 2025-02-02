import { BaseNode } from './BaseNode';

export class OutputNode extends BaseNode {
  private inputTexture: WebGLTexture;
  public setInputTexture(texture: WebGLTexture): void {
    this.inputTexture = texture;
  }

  public getVertexShader(): string {
    return `
          precision mediump float;
          attribute vec2 position;
          attribute vec2 inputTextureCoordinate;
          varying vec2 textureCoordinate;

          void main()
          {
              gl_Position = vec4(position.x * 1.0, position.y * - 1.0, 0.0, 1.0);
              textureCoordinate = inputTextureCoordinate;
          }`;
  }

  public getFragmentShader(): string {
    return `
          precision mediump float;
          varying vec2 textureCoordinate;
          uniform sampler2D inputImageTexture;

          void main() {
              gl_FragColor = texture2D(inputImageTexture, textureCoordinate);
          }`;
  }

  public apply(): WebGLTexture {
    this.useProgram();

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

    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.inputTexture);
    const textureLocation = this.gl.getUniformLocation(this.program, 'inputImageTexture');
    this.gl.uniform1i(textureLocation, 0);
    this.gl.viewport(0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);

    return this.inputTexture;
  }

  public applySave(file: string): void {
    this.apply();
    
    const canvas = document.createElement('canvas');
    canvas.width = this.gl.drawingBufferWidth;
    canvas.height = this.gl.drawingBufferHeight;
    
    const pixels = new Uint8Array(canvas.width * canvas.height * 4);
    this.gl.readPixels(0, 0, canvas.width, canvas.height, this.gl.RGBA, this.gl.UNSIGNED_BYTE, pixels);
    
    const ctx = canvas.getContext('2d')!;
    const imageData = ctx.createImageData(canvas.width, canvas.height);
    
    for (let i = 0; i < canvas.height; i++) {
      for (let j = 0; j < canvas.width; j++) {
        const sourceIndex = (i * canvas.width + j) * 4;
        const targetIndex = ((canvas.height - i - 1) * canvas.width + j) * 4;
        imageData.data[targetIndex] = pixels[sourceIndex];         // R
        imageData.data[targetIndex + 1] = pixels[sourceIndex + 1]; // G
        imageData.data[targetIndex + 2] = pixels[sourceIndex + 2]; // B
        imageData.data[targetIndex + 3] = pixels[sourceIndex + 3]; // A
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    const link = document.createElement('a');
    link.download = file;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }
}
