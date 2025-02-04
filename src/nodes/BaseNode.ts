export abstract class BaseNode {

  protected gl: WebGLRenderingContext;
  constructor(gl: WebGLRenderingContext) {
    this.gl = gl;
  }

  abstract apply(screen: boolean): WebGLTexture;

  public save(file: string): void {
    this.apply(true);
    
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

  protected static async loadImageAsync(imageUrl: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject();
      image.src = imageUrl;
    });
  }
}