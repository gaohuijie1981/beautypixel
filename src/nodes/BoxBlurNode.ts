import { GroupNode } from './GroupNode';
import { BoxMonoBlurNode } from './BoxMonoBlurNode';

export class BoxBlurNode extends GroupNode {
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

  protected generateVertexShaderString(radius: number): string {
    if (radius < 1) {
      return BoxMonoBlurNode.DefaultVertexShader;
    }
  }

  public apply(): WebGLTexture {
    let outputTexture = this.inputTexture;

    this.horizontalBlurFilter.setInputTexture(outputTexture);
    outputTexture = this.horizontalBlurFilter.apply();

    this.verticalBlurFilter.setInputTexture(outputTexture);
    outputTexture = this.verticalBlurFilter.apply();

    return outputTexture;
  }
}
