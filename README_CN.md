# BeautyPixel

![License](https://img.shields.io/badge/License-MIT-blue.svg)

<p align="center">
  <a href="./README.md">English</a> |
  <a href="./README_CN.md">简体中文</a>
</p>


## 简介

BeautyPixel 是一个基于 TypeScript / WebGL 的开源项目，旨在为 Web 应用提供高效的图像美化处理功能。通过利用 GPU 的强大计算能力，BeautyPixel 能够实时处理图像，提供诸如滤镜、磨皮、美白等美化效果，适用于各种 Web 应用场景。

本项目基于 MIT 协议开源，部分代码参考了开源项目 [GPUPixel](https://github.com/pixpark/gpupixel)。

## 特性

- **WebGL 加速**：利用 WebGL 技术实现 GPU 加速，提供高效的图像处理能力。
- **实时美化**：支持实时图像处理，适用于视频流、摄像头捕捉等场景。
- **多种滤镜**：内置多种滤镜效果，如磨皮、美白、白平衡等。
- **易于集成**：提供简洁的 API，方便集成到现有的 HTML5 应用中。
- **跨平台**：基于 Web 技术，支持所有现代浏览器。

## 快速开始

### 使用示例

```javascript
// 获取Canvas元素
const canvas = document.querySelector<HTMLCanvasElement>('#canvas');

// 初始化 BeautyPixel
const beautyPixel = new BeautyPixel();

// 加载图像
const image = new Image();
image.src = 'your-image-url.jpg';
image.onload = async () => {
  // 应用美化效果
  await beautyPixel.setImageUrlAsync(image);
  beautyPixel.setBlur(0.2);
  beautyPixel.setWhiten(0.4);
  await beautyPixel.processImageAsync();
};
```
## 贡献

- 我们欢迎任何形式的贡献！如果你有好的想法或发现了问题，请随时提交 Issue 或 Pull Request。

## 致谢

- 本项目部分代码参考了 [GPUPixel](https://github.com/pixpark/gpupixel)，感谢其作者的贡献。

## 许可证

- 本项目基于 MIT 协议开源。详情请参阅 [LICENSE](LICENSE) 文件。