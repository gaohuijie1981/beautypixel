import { WhiteBalanceNode } from './nodes/WhiteBalanceNode';
import { BoxBlurNode } from './nodes/BoxBlurNode';
import { BoxHighPassNode } from './nodes/BoxHighPassNode';
import { FaceBeautyNode } from './nodes/FaceBeautyNode';
import { FaceReshapeNode } from './nodes/FaceReshapeNode';
import { Resources } from './Resources';

export class BeautyPixel {
  private canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext;
  private image: HTMLImageElement;
  private white: WhiteBalanceNode;
  private blur: BoxBlurNode;
  private highpass: BoxHighPassNode;
  private beauty: FaceBeautyNode;
  private reshape: FaceReshapeNode;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    if (!this.canvas) throw new Error('Canvas not found');

    this.gl = canvas.getContext('webgl');
    if (!this.gl) throw new Error('WebGL not available');

    this.white = new WhiteBalanceNode(this.gl);
    this.white.setTemperature(5000);
    this.white.setTint(0);
    this.blur = new BoxBlurNode(this.gl);
    this.blur.setTexelSpacingMultiplier(4);
    this.highpass = new BoxHighPassNode(this.gl);
    this.setRadius(4);
    this.beauty = new FaceBeautyNode(this.gl);
    this.reshape = new FaceReshapeNode(this.gl);
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

  public setFace(value: number): void {
    this.reshape.setFace(value);
  }

  public setEye(value: number): void {
    this.reshape.setEye(value);
  }

  public setValid(value: boolean): void {
    this.reshape.setValid(value);
  }

  public setFacePoints(value: Float32List): void {
    this.reshape.setPoints(value);
  }
  
  private isProcessing: boolean = false;

  public async setImageUrlAsync(imageUrl: string): Promise<HTMLImageElement> {
    this.image = await this.loadImageAsync(imageUrl);
    this.beauty.setLookUpGray(await this.loadImageAsync(Resources.Image_Lookup_Gray));
    this.beauty.setLookUpOrigin(await this.loadImageAsync(Resources.Image_Lookup_Origin));
    this.beauty.setLookUpSkin(await this.loadImageAsync(Resources.Image_Lookup_Skin));
    this.beauty.setLookUpCustom(await this.loadImageAsync(Resources.Image_Lookup_Light));
    return this.image;
  }

  public async processImageAsync(file: string = null): Promise<boolean> {

    if(this.isProcessing) return false;
    
    this.isProcessing = true;

    this.white.setInputTexture(this.image);
    const balacneTexture = this.white.apply();

    this.blur.setInputTexture(balacneTexture);
    const blurTexture = this.blur.apply();

    this.highpass.setInputTexture(balacneTexture);
    const highpassTexture = this.highpass.apply();

    this.beauty.setInputTexture1(balacneTexture);
    this.beauty.setInputTexture2(blurTexture);
    this.beauty.setInputTexture3(highpassTexture);
    const beautyTexture = this.beauty.apply();

    this.reshape.setInputTexture(beautyTexture);

    if (file) {
      this.reshape.save(file);
    } else {
      this.reshape.apply(true);
    }

    this.isProcessing = false;

    return true;
  }
}
