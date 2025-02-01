import { GroupNode } from './GroupNode';
import { BoxBlurNode } from './BoxBlurNode';
import { BoxDifferenceNode } from './BoxDifferenceNode';


export class BoxHighPassNode extends GroupNode {

  private boxBlurNode: BoxBlurNode;
  private boxDifferenceNode: BoxDifferenceNode;

  constructor(gl: WebGLRenderingContext) {
    super(gl);
    this.boxBlurNode = new BoxBlurNode(gl);
    this.boxDifferenceNode = new BoxDifferenceNode(gl);
  }

  private inputTexture: WebGLTexture;
  public setInputTexture(texture: WebGLTexture): void {
    this.inputTexture = texture;
  }

  public setRaidus(value: number): void {
    this.boxBlurNode.setRadius(value);
  }

  public setDelta(value: number): void {
    this.boxDifferenceNode.setDelta(value);
  }

  public apply(): WebGLTexture {

    this.boxBlurNode.setInputTexture(this.inputTexture);
    let outputTexture = this.boxBlurNode.apply();

    this.boxDifferenceNode.setInputTexture1(this.inputTexture);
    this.boxDifferenceNode.setInputTexture2(outputTexture);
    outputTexture = this.boxDifferenceNode.apply();

    return outputTexture;
  }
}
