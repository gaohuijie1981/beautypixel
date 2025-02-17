import { BaseNode } from './BaseNode';
import { BoxMonoBlurNode } from './BoxMonoBlurNode';

export class BoxBlurNode extends BaseNode {
  private horizontalBlurFilter: BoxMonoBlurNode;
  private verticalBlurFilter: BoxMonoBlurNode;

  constructor (gl: WebGLRenderingContext) {
    super(gl);
    
    this.horizontalBlurFilter = new BoxMonoBlurNode(gl, 0, 4);
    this.verticalBlurFilter = new BoxMonoBlurNode(gl, 1, 4);
  }

  private inputTexture: WebGLTexture;
  public setInputTexture(texture: WebGLTexture): void {
    this.inputTexture = texture;
  }

  public setTexelSpacingMultiplier(value: number): void {
    this.horizontalBlurFilter.setTexelSpacingMultiplier(value);
    this.verticalBlurFilter.setTexelSpacingMultiplier(value);
  }

  public setRadius(value: number): void {
    this.horizontalBlurFilter.setRadius(value);
    this.verticalBlurFilter.setRadius(value);
  }

  public apply(screen: boolean = false): WebGLTexture {
    let outputTexture = this.inputTexture;

    this.horizontalBlurFilter.setInputTexture(outputTexture);
    outputTexture = this.horizontalBlurFilter.apply(screen);

    this.verticalBlurFilter.setInputTexture(outputTexture);
    outputTexture = this.verticalBlurFilter.apply(screen);

    return outputTexture;
  }
}
