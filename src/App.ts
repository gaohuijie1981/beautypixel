import { BeautyPixel } from './BeautyPixel';

export class App {
  private beautyPixel: BeautyPixel;
  private imageUrl: string;

  private updateValueDisplay(slider: HTMLInputElement): void {
    const valueDisplay = slider.parentElement?.querySelector('.value');
    if (valueDisplay) {
      valueDisplay.textContent = slider.value;
    }
  }

  private handleImageUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        this.imageUrl = e.target?.result as string;
        await this.beautyPixel.setImageUrlAsync(this.imageUrl);
        await this.beautyPixel.processImageAsync();
      };
      reader.readAsDataURL(file);
    }
  }
  
  constructor() {
    const canvas = document.querySelector<HTMLCanvasElement>('#canvas');
    if (!canvas) throw new Error('找不到画布元素');

    // 设置画布大小
    const displayWidth = 720;
    const displayHeight = 1280;
    const scale = 1.0;
    canvas.style.width = displayWidth + 'px';
    canvas.style.height = displayHeight + 'px';
    canvas.width = displayWidth * scale;
    canvas.height = displayHeight * scale;

    this.beautyPixel = new BeautyPixel(canvas);

    // 文件上传处理
    const imageInput = document.querySelector<HTMLInputElement>('#imageInput');
    imageInput?.addEventListener('change', this.handleImageUpload.bind(this));

    // 滑块控制
    const tempSlider = document.querySelector<HTMLInputElement>('#temp');
    tempSlider?.addEventListener('input', async (e) => {
      const value = (e.target as HTMLInputElement).value;
      this.beautyPixel.setTemperature(parseInt(value));
      this.updateValueDisplay(e.target as HTMLInputElement);
      await this.beautyPixel.processImageAsync();
    });

    const tintSlider = document.querySelector<HTMLInputElement>('#tint');
    tintSlider?.addEventListener('input', async (e) => {
      const value = (e.target as HTMLInputElement).value;
      this.beautyPixel.setTint(parseInt(value));
      this.updateValueDisplay(e.target as HTMLInputElement);
      await this.beautyPixel.processImageAsync();
    });

    const blurSlider = document.querySelector<HTMLInputElement>('#blur');
    blurSlider?.addEventListener('input', async (e) => {
      const value = (e.target as HTMLInputElement).value;
      this.beautyPixel.setBlur(parseInt(value) / 100);
      this.updateValueDisplay(e.target as HTMLInputElement);
      await this.beautyPixel.processImageAsync();
    });

    const whitenSlider = document.querySelector<HTMLInputElement>('#whiten');
    whitenSlider?.addEventListener('input', async (e) => {
      const value = (e.target as HTMLInputElement).value;
      this.beautyPixel.setWhiten(parseInt(value) / 100);
      this.updateValueDisplay(e.target as HTMLInputElement);
      await this.beautyPixel.processImageAsync();
    });

    const saveButton = document.querySelector<HTMLButtonElement>('#save');
    saveButton?.addEventListener('click', async (e) => {
      await this.beautyPixel.processImageAsync('output.png');
    });
  }
}
