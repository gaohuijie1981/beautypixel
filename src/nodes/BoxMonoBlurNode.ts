import { BaseNode } from './BaseNode';

export class BoxMonoBlurNode extends BaseNode {
  private type: number = 0;
  constructor (gl: WebGLRenderingContext, type: number, radius: number = 2) {
    super(gl);
    this.type = type;
    this.radius = radius;
  }

  private inputTexture: WebGLTexture;
  public setInputTexture(texture: WebGLTexture): void {
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
  
    // 计算优化后的偏移量数量
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
  
    // 内部偏移循环
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
  
    // 内部纹理循环
    shaderStr += `
        sum += texture2D(inputImageTexture, blurCoordinates[0]) * ${boxWeight.toFixed(7)};\n`;
  
    for (let currentBlurCoordinateIndex = 0; currentBlurCoordinateIndex < numberOfOptimizedOffsets; currentBlurCoordinateIndex++) {
      shaderStr += `
        sum += texture2D(inputImageTexture, blurCoordinates[${(currentBlurCoordinateIndex * 2) + 1}]) * ${(boxWeight * 2.0).toFixed(7)};
        sum += texture2D(inputImageTexture, blurCoordinates[${(currentBlurCoordinateIndex * 2) + 2}]) * ${(boxWeight * 2.0).toFixed(7)};
      `;
    }
  
    // 如果所需的采样数超过我们可以通过varyings传递的数量，我们必须在片段着色器中进行依赖纹理读取
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

  public apply(): WebGLTexture {
    this.useProgram();

    const frameBuffer = this.gl.createFramebuffer();
    const frameBufferTexture = this.gl.createTexture();

    this.gl.bindTexture(this.gl.TEXTURE_2D, frameBufferTexture);
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, null);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);

    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, frameBuffer);
    this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, frameBufferTexture, 0);


    const texelWidthOffset = this.gl.getUniformLocation(this.program, 'texelWidthOffset');
    const texelHeightOffset = this.gl.getUniformLocation(this.program, 'texelHeightOffset');

    if (this.type === 0) {
      this.gl.uniform1f(texelWidthOffset, this.verticalTexelSpacing / this.gl.drawingBufferWidth);
      this.gl.uniform1f(texelHeightOffset, 0);
    } else {
      this.gl.uniform1f(texelWidthOffset, 0);
      this.gl.uniform1f(texelHeightOffset, this.horizontalTexelSpacing / this.gl.drawingBufferHeight);
    }

    // 设置顶点数据
    const positionLocation = this.gl.getAttribLocation(this.program, 'position');
    const positionBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
    const positions = new Float32Array([-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0]);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.STATIC_DRAW);
    this.gl.enableVertexAttribArray(positionLocation);
    this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);

    // 设置纹理坐标
    const inputTextureCoordinateLocation = this.gl.getAttribLocation(this.program, 'inputTextureCoordinate');
    const inputTextureCoordinateBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, inputTextureCoordinateBuffer);
    const inputTextureCoordinates = new Float32Array([0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0]);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, inputTextureCoordinates, this.gl.STATIC_DRAW);
    this.gl.enableVertexAttribArray(inputTextureCoordinateLocation);
    this.gl.vertexAttribPointer(inputTextureCoordinateLocation, 2, this.gl.FLOAT, false, 0, 0);

    // 绑定输入纹理
    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.inputTexture);
    const textureLocation = this.gl.getUniformLocation(this.program, 'inputTexture');
    this.gl.uniform1i(textureLocation, 0);

    // 绘制
    this.gl.viewport(0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);

    return frameBufferTexture;
  }
}
