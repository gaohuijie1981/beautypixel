import { ShaderNode } from './ShaderNode';

export class BoxMonoBlurNode extends ShaderNode {
  private type: number = 0;
  constructor (gl: WebGLRenderingContext, type: number, radius: number = 2) {
    super(gl);
    this.type = type;
    this.radius = radius;
  }

  private inputTexture: WebGLTexture | HTMLImageElement;
  public setInputTexture(texture: WebGLTexture | HTMLImageElement): void {
    this.inputTexture = texture;
  }

  private verticalTexelSpacing: number = 1.0;
  private horizontalTexelSpacing: number = 1.0;
  public setTexelSpacingMultiplier(value: number): void {
    this.verticalTexelSpacing = value;
    this.horizontalTexelSpacing = value;
  }

  private radius: number;
  public setRadius(value: number): void {
    this.radius = Math.round(Math.round(value / 2.0) * 2.0);
    this.destroyProgram();
  }

  protected generateVertexShaderString(radius: number): string {
    if (radius < 1) {
      return BoxMonoBlurNode.DefaultVertexShader;
    }
  
    const numberOfOptimizedOffsets = Math.min(Math.floor(radius / 2) + (radius % 2), 7);
  
    let shaderStr = `
      attribute vec4 position;
      attribute vec4 inputTextureCoordinate;
      
      uniform float texelWidthOffset;
      uniform float texelHeightOffset;
      
      varying vec2 blurCoordinates[${1 + (numberOfOptimizedOffsets * 2)}];
      
      void main()
      {
        gl_Position = position;
        
        vec2 singleStepOffset = vec2(texelWidthOffset, texelHeightOffset);
    `;
  
    shaderStr += `
        blurCoordinates[0] = inputTextureCoordinate.xy;\n`;
  
    for (let currentOptimizedOffset = 0; currentOptimizedOffset < numberOfOptimizedOffsets; currentOptimizedOffset++) {
      const optimizedOffset = (currentOptimizedOffset * 2) + 1.5;
  
      shaderStr += `
        blurCoordinates[${(currentOptimizedOffset * 2) + 1}] = inputTextureCoordinate.xy + singleStepOffset * ${optimizedOffset.toFixed(1)};
        blurCoordinates[${(currentOptimizedOffset * 2) + 2}] = inputTextureCoordinate.xy - singleStepOffset * ${optimizedOffset.toFixed(1)};
      `;
    }
  
    shaderStr += '}\n';
  
    return shaderStr;
  }
  
  protected generateFragmentShaderString(radius: number): string {
    if (radius < 1) {
      return BoxMonoBlurNode.DefaultFragmentShader;
    }
  
    const numberOfOptimizedOffsets = Math.min(Math.floor(radius / 2) + (radius % 2), 7);
    const trueNumberOfOptimizedOffsets = Math.floor(radius / 2) + (radius % 2);
  
    let shaderStr = `
      precision mediump float;
      uniform sampler2D inputImageTexture;
      uniform float texelWidthOffset;
      uniform float texelHeightOffset;
      
      varying vec2 blurCoordinates[${1 + (numberOfOptimizedOffsets * 2)}];
      
      void main()
      {
        vec4 sum = vec4(0.0);
    `;
  
    const boxWeight = 1.0 / ((radius * 2) + 1);
  
    shaderStr += `
        sum += texture2D(inputImageTexture, blurCoordinates[0]) * ${boxWeight.toFixed(7)};\n`;
  
    for (let currentBlurCoordinateIndex = 0; currentBlurCoordinateIndex < numberOfOptimizedOffsets; currentBlurCoordinateIndex++) {
      shaderStr += `
        sum += texture2D(inputImageTexture, blurCoordinates[${(currentBlurCoordinateIndex * 2) + 1}]) * ${(boxWeight * 2.0).toFixed(7)};
        sum += texture2D(inputImageTexture, blurCoordinates[${(currentBlurCoordinateIndex * 2) + 2}]) * ${(boxWeight * 2.0).toFixed(7)};
      `;
    }
  
    if (trueNumberOfOptimizedOffsets > numberOfOptimizedOffsets) {
      shaderStr += `
        vec2 singleStepOffset = vec2(texelWidthOffset, texelHeightOffset);\n`;
      
      for (let currentOverlowTextureRead = numberOfOptimizedOffsets; currentOverlowTextureRead < trueNumberOfOptimizedOffsets; currentOverlowTextureRead++) {
        const optimizedOffset = (currentOverlowTextureRead * 2) + 1.5;
  
        shaderStr += `
        sum += texture2D(inputImageTexture, blurCoordinates[0] + singleStepOffset * ${optimizedOffset.toFixed(1)}) * ${(boxWeight * 2.0).toFixed(7)};
        sum += texture2D(inputImageTexture, blurCoordinates[0] - singleStepOffset * ${optimizedOffset.toFixed(1)}) * ${(boxWeight * 2.0).toFixed(7)};
      `;
      }
    }
  
    shaderStr += `
        gl_FragColor = sum;
      }`;

    return shaderStr;
  }

  public getVertexShader(): string {
    return this.generateVertexShaderString(this.radius);
  }

  public getFragmentShader(): string {
    return this.generateFragmentShaderString(this.radius);
  }

  public apply(screen: boolean = false): WebGLTexture {

    this.useProgram();
    this.useStandardFrameBuffer(screen);

    if (this.type === 0) {
      this.gl.uniform1f(this.gl.getUniformLocation(this.program, 'texelWidthOffset'), this.verticalTexelSpacing / this.gl.drawingBufferWidth);
      this.gl.uniform1f(this.gl.getUniformLocation(this.program, 'texelHeightOffset'), 0);
    } else {
      this.gl.uniform1f(this.gl.getUniformLocation(this.program, 'texelWidthOffset'), 0);
      this.gl.uniform1f(this.gl.getUniformLocation(this.program, 'texelHeightOffset'), this.horizontalTexelSpacing / this.gl.drawingBufferHeight);
    }

    this.loadTexture(this.inputTexture, 'inputTexture');

    this.draw();

    return this.frameBufferTexture;
  }
}
