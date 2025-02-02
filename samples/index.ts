import { BeautyPixel } from '../src';
import { SampleFaceData } from './face';

class App {
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

    // Canvas set up
    const canvas = document.querySelector<HTMLCanvasElement>('#canvas');
    if (!canvas) throw new Error('Canvas not found');

    const imageWidth = 720;
    const imageHeight = 1280;
    const canvasHeight = document.documentElement.clientHeight;
    const canvasWidth = document.documentElement.clientHeight / imageHeight * imageWidth;
    canvas.style.width = canvasWidth + 'px';
    canvas.style.height = canvasHeight + 'px';
    canvas.width = imageWidth;
    canvas.height = imageHeight;

    this.beautyPixel = new BeautyPixel(canvas);

    // UI set up
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

    const thinSlider = document.querySelector<HTMLInputElement>('#thin');
    thinSlider?.addEventListener('input', async (e) => {
      const value = (e.target as HTMLInputElement).value;
      this.beautyPixel.setThin(parseInt(value) / 100);
      this.updateValueDisplay(e.target as HTMLInputElement);
      await this.beautyPixel.processImageAsync();
    });

    const eyeSlider = document.querySelector<HTMLInputElement>('#eye');
    eyeSlider?.addEventListener('input', async (e) => {
      const value = (e.target as HTMLInputElement).value;
      this.beautyPixel.setEye(parseInt(value) / 100);
      this.updateValueDisplay(e.target as HTMLInputElement);
      await this.beautyPixel.processImageAsync();
    });

    const saveButton = document.querySelector<HTMLButtonElement>('#save');
    saveButton?.addEventListener('click', async (e) => {
      await this.beautyPixel.processImageAsync('output.png');
    });

    setTimeout(async() => {

      // Load test image
      await this.beautyPixel.setImageUrlAsync(SampleFaceData.Image);
      
      // Load face-api 68 point landmarks
      const points = SampleFaceData.Points;
      if (points.length !== 68) throw Error('Face landmark number mismtach');

      // Normalize face-api 68 point landmarks
      const normalizedFacePoints = new Float32Array(72 * 2);
      for (let i = 0; i < 68; i++) {
        normalizedFacePoints[i * 2] = points[i].x / 720.0;
        normalizedFacePoints[i * 2 + 1] = points[i].y / 1280.0;
      }

      // Calculate right eye coordinates
      normalizedFacePoints[68 * 2] = (normalizedFacePoints[37 * 2] + normalizedFacePoints[38 * 2]) / 2;
      normalizedFacePoints[68 * 2 + 1] = (normalizedFacePoints[37 * 2 + 1] + normalizedFacePoints[38 * 2 + 1]) / 2;
      normalizedFacePoints[69 * 2] = (normalizedFacePoints[37 * 2] + normalizedFacePoints[38 * 2] + normalizedFacePoints[40 * 2] + normalizedFacePoints[41 * 2]) / 4;
      normalizedFacePoints[69 * 2 + 1] = (normalizedFacePoints[37 * 2 + 1] + normalizedFacePoints[38 * 2 + 1] + normalizedFacePoints[40 * 2 + 1] + normalizedFacePoints[41 * 2 + 1]) / 4;

      // Calculate left eye coordinates
      normalizedFacePoints[70 * 2] = (normalizedFacePoints[43 * 2] + normalizedFacePoints[44 * 2]) / 2;
      normalizedFacePoints[70 * 2 + 1] = (normalizedFacePoints[43 * 2 + 1] + normalizedFacePoints[44 * 2 + 1]) / 2;
      normalizedFacePoints[71 * 2] = (normalizedFacePoints[43 * 2] + normalizedFacePoints[44 * 2] + normalizedFacePoints[46 * 2] + normalizedFacePoints[47 * 2]) / 4;
      normalizedFacePoints[71 * 2 + 1] = (normalizedFacePoints[43 * 2 + 1] + normalizedFacePoints[44 * 2 + 1] + normalizedFacePoints[46 * 2 + 1] + normalizedFacePoints[47 * 2 + 1]) / 4;

      // Set face detection as valid
      this.beautyPixel.setFace(true);

      // Set face-api 68 point landmarks
      this.beautyPixel.setFacePoints(normalizedFacePoints);

      // Process test image
      await this.beautyPixel.processImageAsync();

    }, 100);
  }
}

new App();