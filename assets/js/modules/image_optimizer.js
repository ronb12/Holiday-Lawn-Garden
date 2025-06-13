
// image_optimizer.js
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

class ImageOptimizer {
  constructor() {
    this.imageDir = 'assets/images';
    this.quality = 80;
    this.maxWidth = 1920;
  }

  async optimizeImages() {
    const images = this.findImages();
    console.log(`Found ${images.length} images to optimize`);

    for (const image of images) {
      try {
        await this.optimizeImage(image);
        await this.createWebP(image);
        console.log(`✓ Optimized ${image}`);
      } catch (error) {
        console.error(`Error optimizing ${image}:`, error);
      }
    }
  }

  findImages() {
    const extensions = ['.jpg', '.jpeg', '.png'];
    return this.findFiles(this.imageDir, extensions);
  }

  async optimizeImage(imagePath) {
    const image = sharp(imagePath);
    const metadata = await image.metadata();

    // Resize if too large
    if (metadata.width > this.maxWidth) {
      image.resize(this.maxWidth, null, {
        fit: 'inside',
        withoutEnlargement: true
      });
    }

    // Optimize based on format
    if (imagePath.endsWith('.jpg') || imagePath.endsWith('.jpeg')) {
      await image
        .jpeg({ quality: this.quality, progressive: true })
        .toFile(this.getOptimizedPath(imagePath));
    } else if (imagePath.endsWith('.png')) {
      await image
        .png({ quality: this.quality, compressionLevel: 9 })
        .toFile(this.getOptimizedPath(imagePath));
    }
  }

  async createWebP(imagePath) {
    const webpPath = this.getWebPPath(imagePath);
    await sharp(imagePath)
      .webp({ quality: this.quality })
      .toFile(webpPath);
  }

  getOptimizedPath(imagePath) {
    const dir = path.dirname(imagePath);
    const ext = path.extname(imagePath);
    const name = path.basename(imagePath, ext);
    return path.join(dir, `${name}.optimized${ext}`);
  }

  getWebPPath(imagePath) {
    const dir = path.dirname(imagePath);
    const name = path.basename(imagePath, path.extname(imagePath));
    return path.join(dir, `${name}.webp`);
  }

  findFiles(dir, extensions) {
    let results = [];
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        results = results.concat(this.findFiles(filePath, extensions));
      } else if (extensions.some(ext => file.toLowerCase().endsWith(ext))) {
        results.push(filePath);
      }
    }
    
    return results;
  }
}

// Run the optimizer
const optimizer = new ImageOptimizer();
optimizer.optimizeImages(); 

export {
  ImageOptimizer
};
