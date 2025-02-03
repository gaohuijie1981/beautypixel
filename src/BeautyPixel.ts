import { InputNode } from './nodes/InputNode';
import { OutputNode } from './nodes/OutputNode';
import { WhiteBalanceNode } from './nodes/WhiteBalanceNode';
import { BoxBlurNode } from './nodes/BoxBlurNode';
import { BoxHighPassNode } from './nodes/BoxHighPassNode';
import { BeautyFaceUnitNode } from './nodes/BeautyFaceUnitNode';
import { FaceReshapeNode } from './nodes/FaceReshapeNode';
import { Resources } from './Resources';

export class BeautyPixel {
  private canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext;
  private image: HTMLImageElement;
  private input: InputNode;
  private white: WhiteBalanceNode;
  private blur: BoxBlurNode;
  private highpass: BoxHighPassNode;
  private beauty: BeautyFaceUnitNode;
  private face: FaceReshapeNode;
  private output: OutputNode;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    if (!this.canvas) throw new Error('Canvas not found');

    this.gl = canvas.getContext('webgl');
    if (!this.gl) throw new Error('WebGL not available');

    this.input = new InputNode(this.gl);
    this.white = new WhiteBalanceNode(this.gl);
    this.white.setTemperature(5000);
    this.white.setTint(0);
    this.blur = new BoxBlurNode(this.gl);
    this.blur.setTexelSpacingMultiplier(4);
    this.highpass = new BoxHighPassNode(this.gl);
    this.setRadius(4);
    this.beauty = new BeautyFaceUnitNode(this.gl);
    this.face = new FaceReshapeNode(this.gl);
    this.output = new OutputNode(this.gl);
  }

  private async loadImageAsync(imageUrl: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject();
      image.src = imageUrl;
    });
  }

  public getGLContext(): WebGLRenderingContext {
    return this.gl;
  }

  public setTemperature(value: number): void {
    this.white.setTemperature(value);
  }

  public setTint(value: number): void {
    this.white.setTint(value);
  }

  public setSharpen(value: number): void {
    this.beauty.setSharpen(value);
  }

  public setBlur(value: number): void {
    this.beauty.setBlur(value);
  }

  public setWhiten(value: number): void {
    this.beauty.setWhiten(value);
  }

  public setDelta(value: number): void {
    this.highpass.setDelta(value);
  }

  public setRadius(value: number): void {
    this.blur.setRadius(value);
    this.highpass.setRaidus(value);
  }

  public setThin(value: number): void {
    this.face.setThin(value);
  }

  public setEye(value: number): void {
    this.face.setEye(value);
  }

  public setFace(value: boolean): void {
    this.face.setFace(value);
  }

  public setFacePoints(value: Float32List): void {
    this.face.setPoints(value);
  }
  
  private isProcessing: boolean = false;

  public async setImageUrlAsync(imageUrl: string): Promise<HTMLImageElement> {
    this.image = await this.loadImageAsync(imageUrl);
    this.input.setInputImage(this.image);
    this.beauty.setLookUpGray(await this.loadImageAsync(Resources.Image_Lookup_Gray));
    this.beauty.setLookUpOrigin(await this.loadImageAsync(Resources.Image_Lookup_Origin));
    this.beauty.setLookUpSkin(await this.loadImageAsync(Resources.Image_Lookup_Skin));
    this.beauty.setLookUpCustom(await this.loadImageAsync(Resources.Image_Lookup_Light));
    return this.image;
  }

  public async processImageAsync(file: string = null): Promise<boolean> {

    if(this.isProcessing) return false;
    
    this.isProcessing = true;
    
    const inputTexture = this.input.apply();
    
    this.white.setInputTexture(inputTexture);
    const balacneTexture = this.white.apply();

    this.beauty.setInputTexture1(balacneTexture);

    this.blur.setInputTexture(balacneTexture);
    const blurTexture = this.blur.apply();

    this.highpass.setInputTexture(balacneTexture);
    const highpassTexture = this.highpass.apply();

    this.beauty.setInputTexture1(balacneTexture);
    this.beauty.setInputTexture2(blurTexture);
    this.beauty.setInputTexture3(highpassTexture);
    const beautyTexture = this.beauty.apply();

    this.face.setInputTexture(beautyTexture);
    const outputTexture = this.face.apply();
    
    this.output.setInputTexture(outputTexture);
    if (file) {
      this.output.applySave(file);
    } else {
      this.output.apply();
    }

    this.isProcessing = false;

    return true;
  }
}
