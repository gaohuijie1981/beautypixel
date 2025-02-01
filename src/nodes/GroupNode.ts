import { BaseNode } from './BaseNode';

export abstract class GroupNode extends BaseNode {

  public getVertexShader(): string { return null; }

  public getFragmentShader(): string { return null; }

  abstract apply(): WebGLTexture;
}
