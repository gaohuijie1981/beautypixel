import { BaseNode } from './BaseNode';

export class BeautyFaceUnitNode extends BaseNode {

  constructor (gl: WebGLRenderingContext) {
    super(gl);
  }

  private lookUpGray: HTMLImageElement;
  public setLookUpGray(image: HTMLImageElement): void {
    this.lookUpGray = image;
  }

  private lookUpOrigin: HTMLImageElement;
  public setLookUpOrigin(image: HTMLImageElement): void {
    this.lookUpOrigin = image;
  }

  private lookUpSkin: HTMLImageElement;
  public setLookUpSkin(image: HTMLImageElement): void {
    this.lookUpSkin = image;
  }

  private lookUpCustom: HTMLImageElement;
  public setLookUpCustom(image: HTMLImageElement): void {
    this.lookUpCustom = image;
  }

  private inputTexture1: WebGLTexture;
  public setInputTexture1(texture: WebGLTexture): void {
    this.inputTexture1 = texture;
  }
  
  private inputTexture2: WebGLTexture;
  public setInputTexture2(texture: WebGLTexture): void {
    this.inputTexture2 = texture;
  }

  private inputTexture3: WebGLTexture;
  public setInputTexture3(texture: WebGLTexture): void {
    this.inputTexture3 = texture;
  }

  private sharpen: number = 0.0;
  public setSharpen(value: number): void {
    this.sharpen = value;
  }

  private blurAlpha: number = 0.0;
  public setBlur(value: number): void {
    this.blurAlpha = value;
  }

  private whiten: number = 0.0;
  public setWhiten(value: number): void {
    this.whiten = value;
  }

  public getVertexShader(): string {
    let shaderStr = `
      attribute vec3 position;
      attribute vec2 inputTextureCoordinate;

      varying vec2 textureCoordinate;
      varying vec4 textureShift_1;
      varying vec4 textureShift_2;
      varying vec4 textureShift_3;
      varying vec4 textureShift_4;

      uniform float widthOffset;
      uniform float heightOffset;
      
      void main(void) {
        gl_Position = vec4(position, 1.0);
        textureCoordinate = inputTextureCoordinate;
        textureShift_1 = vec4(inputTextureCoordinate + vec2(-widthOffset, 0.0), inputTextureCoordinate + vec2(widthOffset, 0.0));
        textureShift_2 = vec4(inputTextureCoordinate + vec2(0.0, -heightOffset), inputTextureCoordinate + vec2(0.0, heightOffset));
        textureShift_3 = vec4(inputTextureCoordinate + vec2(widthOffset, heightOffset), inputTextureCoordinate + vec2(-widthOffset, -heightOffset));
        textureShift_4 = vec4(inputTextureCoordinate + vec2(-widthOffset, heightOffset), inputTextureCoordinate + vec2(widthOffset, -heightOffset));
      }`;

    return shaderStr;
  }

  public getFragmentShader(): string {
    let shaderStr = `
      precision mediump float;
      varying vec2 textureCoordinate;
      varying vec4 textureShift_1;
      varying vec4 textureShift_2;
      varying vec4 textureShift_3;
      varying vec4 textureShift_4;

      uniform sampler2D inputImageTexture;
      uniform sampler2D inputImageTexture2;
      uniform sampler2D inputImageTexture3;
      uniform sampler2D lookUpGray;
      uniform sampler2D lookUpOrigin;
      uniform sampler2D lookUpSkin;
      uniform sampler2D lookUpCustom;

      uniform float sharpen;
      uniform float blurAlpha;
      uniform float whiten;

      const float levelRangeInv = 1.02657;
      const float levelBlack = 0.0258820;
      const float alpha = 0.7;

      void main() {
        vec4 iColor = texture2D(inputImageTexture, textureCoordinate);
        vec4 meanColor = texture2D(inputImageTexture2, textureCoordinate);
        vec4 varColor = texture2D(inputImageTexture3, textureCoordinate);

    
        vec3 color = iColor.rgb;
        if (blurAlpha > 0.0) {
          float theta = 0.1;
          float p =
              clamp((min(iColor.r, meanColor.r - 0.1) - 0.2) * 4.0, 0.0, 1.0);
          float meanVar = (varColor.r + varColor.g + varColor.b) / 3.0;
          float kMin;
          vec3 resultColor;
          kMin = (1.0 - meanVar / (meanVar + theta)) * p * blurAlpha;
          kMin = clamp(kMin, 0.0, 1.0);
          resultColor = mix(iColor.rgb, meanColor.rgb, kMin);

          vec3 sum = 0.25 * iColor.rgb;
          sum += 0.125 * texture2D(inputImageTexture, textureShift_1.xy).rgb;
          sum += 0.125 * texture2D(inputImageTexture, textureShift_1.zw).rgb;
          sum += 0.125 * texture2D(inputImageTexture, textureShift_2.xy).rgb;
          sum += 0.125 * texture2D(inputImageTexture, textureShift_2.zw).rgb;
          sum += 0.0625 * texture2D(inputImageTexture, textureShift_3.xy).rgb;
          sum += 0.0625 * texture2D(inputImageTexture, textureShift_3.zw).rgb;
          sum += 0.0625 * texture2D(inputImageTexture, textureShift_4.xy).rgb;
          sum += 0.0625 * texture2D(inputImageTexture, textureShift_4.zw).rgb;

          vec3 hPass = iColor.rgb - sum;
          color = resultColor + sharpen * hPass * 2.0;
        }

        if (whiten > 0.0) {
          vec3 colorEPM = color;
          color =
              clamp((colorEPM - vec3(levelBlack)) * levelRangeInv, 0.0, 1.0);
          vec3 texel = vec3(texture2D(lookUpGray, vec2(color.r, 0.5)).r,
                            texture2D(lookUpGray, vec2(color.g, 0.5)).g,
                            texture2D(lookUpGray, vec2(color.b, 0.5)).b);
          texel = mix(color, texel, 0.5);
          texel = mix(colorEPM, texel, alpha);

          texel = clamp(texel, 0., 1.);
          float blueColor = texel.b * 15.0;
          vec2 quad1;
          quad1.y = floor(floor(blueColor) * 0.25);
          quad1.x = floor(blueColor) - (quad1.y * 4.0);
          vec2 quad2;
          quad2.y = floor(ceil(blueColor) * 0.25);
          quad2.x = ceil(blueColor) - (quad2.y * 4.0);
          vec2 texPos2 = texel.rg * 0.234375 + 0.0078125;
          vec2 texPos1 = quad1 * 0.25 + texPos2;
          texPos2 = quad2 * 0.25 + texPos2;
          vec3 newColor1Origin = texture2D(lookUpOrigin, texPos1).rgb;
          vec3 newColor2Origin = texture2D(lookUpOrigin, texPos2).rgb;
          vec3 colorOrigin =
              mix(newColor1Origin, newColor2Origin, fract(blueColor));
          texel = mix(colorOrigin, color, alpha);

          texel = clamp(texel, 0., 1.);
          blueColor = texel.b * 15.0;
          quad1.y = floor(floor(blueColor) * 0.25);
          quad1.x = floor(blueColor) - (quad1.y * 4.0);
          quad2.y = floor(ceil(blueColor) * 0.25);
          quad2.x = ceil(blueColor) - (quad2.y * 4.0);
          texPos2 = texel.rg * 0.234375 + 0.0078125;
          texPos1 = quad1 * 0.25 + texPos2;
          texPos2 = quad2 * 0.25 + texPos2;
          vec3 newColor1 = texture2D(lookUpSkin, texPos1).rgb;
          vec3 newColor2 = texture2D(lookUpSkin, texPos2).rgb;
          color = mix(newColor1.rgb, newColor2.rgb, fract(blueColor));
          color = clamp(color, 0., 1.);

          float blueColor_custom = color.b * 63.0;
          vec2 quad1_custom;
          quad1_custom.y = floor(floor(blueColor_custom) / 8.0);
          quad1_custom.x = floor(blueColor_custom) - (quad1_custom.y * 8.0);
          vec2 quad2_custom;
          quad2_custom.y = floor(ceil(blueColor_custom) / 8.0);
          quad2_custom.x = ceil(blueColor_custom) - (quad2_custom.y * 8.0);
          vec2 texPos1_custom;
          texPos1_custom.x = (quad1_custom.x * 1.0 / 8.0) + 0.5 / 512.0 +
                            ((1.0 / 8.0 - 1.0 / 512.0) * color.r);
          texPos1_custom.y = (quad1_custom.y * 1.0 / 8.0) + 0.5 / 512.0 +
                            ((1.0 / 8.0 - 1.0 / 512.0) * color.g);
          vec2 texPos2_custom;
          texPos2_custom.x = (quad2_custom.x * 1.0 / 8.0) + 0.5 / 512.0 +
                            ((1.0 / 8.0 - 1.0 / 512.0) * color.r);
          texPos2_custom.y = (quad2_custom.y * 1.0 / 8.0) + 0.5 / 512.0 +
                            ((1.0 / 8.0 - 1.0 / 512.0) * color.g);
          newColor1 = texture2D(lookUpCustom, texPos1_custom).rgb;
          newColor2 = texture2D(lookUpCustom, texPos2_custom).rgb;
          vec3 color_custom =
              mix(newColor1, newColor2, fract(blueColor_custom));
          color = mix(color, color_custom, whiten);
        }
        
        gl_FragColor = vec4(color, 1.0);
        
      }`;

    return shaderStr;
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

    // 绑定输入纹理及参数
    const sharpenLocation = this.gl.getUniformLocation(this.program, 'sharpen');
    this.gl.uniform1f(sharpenLocation, this.sharpen);

    const blurAlphaLocation = this.gl.getUniformLocation(this.program, 'blurAlpha');
    this.gl.uniform1f(blurAlphaLocation, this.blurAlpha);

    const whitenLocation = this.gl.getUniformLocation(this.program, 'whiten');
    this.gl.uniform1f(whitenLocation, this.whiten);

    this.gl.activeTexture(this.gl.TEXTURE2);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.inputTexture1);
    const textureLocation2 = this.gl.getUniformLocation(this.program, 'inputImageTexture');
    this.gl.uniform1i(textureLocation2, 2);

    this.gl.activeTexture(this.gl.TEXTURE3);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.inputTexture2);
    const textureLocation3 = this.gl.getUniformLocation(this.program, 'inputImageTexture2');
    this.gl.uniform1i(textureLocation3, 3);

    this.gl.activeTexture(this.gl.TEXTURE4);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.inputTexture3);
    const textureLocation4 = this.gl.getUniformLocation(this.program, 'inputImageTexture3');
    this.gl.uniform1i(textureLocation4, 4);

    const lookUpGrayTexture = this.gl.createTexture();
    this.gl.activeTexture(this.gl.TEXTURE5);
    this.gl.bindTexture(this.gl.TEXTURE_2D, lookUpGrayTexture);
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.lookUpGray);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
    const textureLocation5 = this.gl.getUniformLocation(this.program, 'lookUpGray');
    this.gl.uniform1i(textureLocation5, 5);

    const lookUpOriginTexture = this.gl.createTexture();
    this.gl.activeTexture(this.gl.TEXTURE6);
    this.gl.bindTexture(this.gl.TEXTURE_2D, lookUpOriginTexture);
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.lookUpOrigin);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
    const textureLocation6 = this.gl.getUniformLocation(this.program, 'lookUpOrigin');
    this.gl.uniform1i(textureLocation6, 6);

    const lookUpSkinTexture = this.gl.createTexture();
    this.gl.activeTexture(this.gl.TEXTURE7);
    this.gl.bindTexture(this.gl.TEXTURE_2D, lookUpSkinTexture);
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.lookUpSkin);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
    const textureLocation7 = this.gl.getUniformLocation(this.program, 'lookUpSkin');
    this.gl.uniform1i(textureLocation7, 7);

    const lookUpCustomTexture = this.gl.createTexture();
    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, lookUpCustomTexture);
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.lookUpCustom);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
    const textureLocation0 = this.gl.getUniformLocation(this.program, 'lookUpCustom');
    this.gl.uniform1i(textureLocation0, 0);
    
    // 绘制
    this.gl.viewport(0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);

    return frameBufferTexture;
  }
}
