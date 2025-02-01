# BeautyPixel

![License](https://img.shields.io/badge/License-MIT-blue.svg)

<p align="center">
  <a href="./README.md">English</a> |
  <a href="./README_CN.md">简体中文</a>
</p>

## Introduction

BeautyPixel is an open-source project based on TypeScript / WebGL, designed to provide efficient image beautification processing for Web applications. By leveraging the powerful computing capabilities of GPU, BeautyPixel can process images in real-time, offering various beautification effects such as filters, skin smoothing, and whitening, suitable for various Web application scenarios.

This project is open-sourced under the MIT license, with some code referencing the open-source project [GPUPixel](https://github.com/pixpark/gpupixel).

## Features

- **WebGL Acceleration**: Utilizes WebGL technology for GPU acceleration, providing efficient image processing capabilities.
- **Real-time Beautification**: Supports real-time image processing, suitable for video streams, camera captures, and more.
- **Multiple Filters**: Built-in various filter effects, such as skin smoothing, whitening, white balance, etc.
- **Easy Integration**: Provides simple APIs for easy integration into existing HTML5 applications.
- **Cross-platform**: Based on Web technology, supporting all modern browsers.

## Quick Start

### Usage Example

```javascript
// Get Canvas element
const canvas = document.querySelector<HTMLCanvasElement>('#canvas');

// Initialize BeautyPixel
const beautyPixel = new BeautyPixel();

// Load image
const image = new Image();
image.src = 'your-image-url.jpg';
image.onload = async () => {
  // Apply beautification effects
  await beautyPixel.setImageUrlAsync(image);
  beautyPixel.setBlur(0.2);
  beautyPixel.setWhiten(0.4);
  await beautyPixel.processImageAsync();
};
```
## Contributing

- We welcome contributions of any form! If you have good ideas or find issues, please feel free to submit Issues or Pull Requests.

## Acknowledgments

- This project references some code from [GPUPixel](https://github.com/pixpark/gpupixel). Thanks to its authors for their contributions.

## License

- This project is open-sourced under the MIT License. See the [LICENSE](LICENSE) file for details.