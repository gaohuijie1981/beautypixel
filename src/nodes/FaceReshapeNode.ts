import { BaseNode } from './BaseNode';

export class FaceReshapeNode extends BaseNode {
  private inputTexture: WebGLTexture;
  public setInputTexture(texture: WebGLTexture): void {
    this.inputTexture = texture;
  }

  private face: boolean = false;
  public setFace(value: boolean): void {
    this.face = value;
  }

  private thin: number = 0;
  public setThin(value: number): void {
    this.thin = value / 10;
  }

  private eye: number = 0;
  public setEye(value: number): void {
    this.eye = value / 4;
  }

  private points: Float32List;
  public setPoints(value: Float32List): void {
    this.points = value;
  }

  public getVertexShader(): string {
    return `
      precision mediump float;
      attribute vec4 position;
      attribute vec2 inputTextureCoordinate;
      varying vec2 textureCoordinate;
      
      void main() {
          gl_Position = vec4(position.x, position.y, 0.0, 1.0);
          textureCoordinate = inputTextureCoordinate;
      }`;
  }

  public getFragmentShader(): string {
    return `
      precision mediump float;
      varying vec2 textureCoordinate;
      uniform sampler2D inputImageTexture;

      uniform int hasFace;
      uniform float facePoints[72 * 2];

      uniform highp float aspectRatio;
      uniform highp float thinFaceDelta;
      uniform highp float bigEyeDelta;

      vec2 curveWarp(vec2 textureCoord, vec2 originPosition, vec2 targetPosition) {

          float delta = thinFaceDelta;
          float aspect = 1.0;
          vec2 offset = vec2(0.0);
          vec2 result = vec2(0.0);
          vec2 direction = (targetPosition - originPosition) * delta;

          float radius = distance(vec2(targetPosition.x, targetPosition.y / aspect), vec2(originPosition.x, originPosition.y / aspect));
          float ratio = distance(vec2(textureCoord.x, textureCoord.y / aspect), vec2(originPosition.x, originPosition.y / aspect)) / radius;

          ratio = 1.0 - ratio;
          ratio = clamp(ratio, 0.0, 1.0);
          offset = direction * ratio;
          result = textureCoord - offset;

          return result;
      }
      
      vec2 enlargeEye(vec2 textureCoord, vec2 originPosition, float radius, float delta) {

        float aspect = 1.0;
        float weight = distance(vec2(textureCoord.x, textureCoord.y / aspect), vec2(originPosition.x, originPosition.y / aspect)) / radius;
        
        weight = 1.0 - (1.0 - (weight * weight)) * delta;
        weight = clamp(weight,0.0,1.0);
        
        textureCoord = originPosition + (textureCoord - originPosition) * weight;
        
        return textureCoord;
      }

      vec2 thinFace(vec2 currentCoordinate) {
          currentCoordinate = curveWarp(currentCoordinate, vec2(facePoints[4], facePoints[5]), vec2(facePoints[56], facePoints[57]));
          currentCoordinate = curveWarp(currentCoordinate, vec2(facePoints[28], facePoints[29]), vec2(facePoints[56], facePoints[57]));
          currentCoordinate = curveWarp(currentCoordinate, vec2(facePoints[6], facePoints[7]), vec2(facePoints[58], facePoints[59]));
          currentCoordinate = curveWarp(currentCoordinate, vec2(facePoints[26], facePoints[27]), vec2(facePoints[58], facePoints[59]));
          currentCoordinate = curveWarp(currentCoordinate, vec2(facePoints[10], facePoints[11]), vec2(facePoints[60], facePoints[61]));
          currentCoordinate = curveWarp(currentCoordinate, vec2(facePoints[22], facePoints[23]), vec2(facePoints[60], facePoints[61]));
          currentCoordinate = curveWarp(currentCoordinate, vec2(facePoints[14], facePoints[15]), vec2(facePoints[66], facePoints[67]));
          currentCoordinate = curveWarp(currentCoordinate, vec2(facePoints[18], facePoints[19]), vec2(facePoints[66], facePoints[67]));
          currentCoordinate = curveWarp(currentCoordinate, vec2(facePoints[16], facePoints[17]), vec2(facePoints[66], facePoints[67]));

          return currentCoordinate;
      }

      vec2 bigEye(vec2 currentCoordinate) {
          float aspect = 1.0;

          vec2 originPoint1 = vec2(facePoints[69 * 2], facePoints[69 * 2 + 1]);
          vec2 targetPoint1 = vec2(facePoints[68 * 2], facePoints[68 * 2 + 1]);
          float radius1 = distance(vec2(targetPoint1.x, targetPoint1.y / aspect), vec2(originPoint1.x, originPoint1.y / aspect));
          radius1 = radius1 * 5.;
          currentCoordinate = enlargeEye(currentCoordinate, originPoint1, radius1, bigEyeDelta);

          vec2 originPoint2 = vec2(facePoints[71 * 2], facePoints[71 * 2 + 1]);
          vec2 targetPoint2 = vec2(facePoints[70 * 2], facePoints[70 * 2 + 1]);
          float radius2 = distance(vec2(targetPoint2.x, targetPoint2.y / aspect), vec2(originPoint2.x, originPoint2.y / aspect));
          radius2 = radius2 * 5.;
          currentCoordinate = enlargeEye(currentCoordinate, originPoint2, radius2, bigEyeDelta);
          
          return currentCoordinate;
      }


      void main()
      {
          vec2 positionToUse = textureCoordinate;

          if (hasFace == 1) {
              positionToUse = thinFace(positionToUse);
              positionToUse = bigEye(positionToUse);
          }
          
          vec4 color = texture2D(inputImageTexture, positionToUse).rgba;

          gl_FragColor = color.rgba;
      }`;
  }

  public apply(): WebGLTexture {
    this.useProgram();

    const faceLocation = this.gl.getUniformLocation(this.program, 'hasFace');
    this.gl.uniform1i(faceLocation, this.face ? 1 : 0);

    const deltaLocation = this.gl.getUniformLocation(this.program, 'thinFaceDelta');
    this.gl.uniform1f(deltaLocation, this.thin);

    const eyeLocation = this.gl.getUniformLocation(this.program, 'bigEyeDelta');
    this.gl.uniform1f(eyeLocation, this.eye);

    const pointsLocation = this.gl.getUniformLocation(this.program, 'facePoints');
    this.gl.uniform1fv(pointsLocation, this.points);

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

    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.inputTexture);
    const textureLocation = this.gl.getUniformLocation(this.program, 'inputImageTexture');
    this.gl.uniform1i(textureLocation, 0);

    this.gl.viewport(0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);

    return frameBufferTexture;
  }
}
