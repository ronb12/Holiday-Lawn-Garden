const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

class ImageOptimizer {
  constructor() {
    this.imageDir = 'assets/images';
    this.quality = 80;
    this.sizes = [320, 640, 960, 1280];
  }

  async optimize() {
    const imageFiles = this.findFiles(this.imageDir, ['.jpg', '.jpeg', '.png']);
    console.log(`Found ${imageFiles.length} images to optimize`);

    for (const file of imageFiles) {
      try {
        const fileName = path.basename(file);
        const fileExt = path.extname(file);
        const fileNameWithoutExt = path.basename(file, fileExt);
        const webpPath = path.join(path.dirname(file), `${fileNameWithoutExt}.webp`);

        // Generate WebP version
        await this.generateWebP(file, webpPath);

        // Generate responsive sizes
        for (const size of this.sizes) {
          const sizePath = path.join(
            path.dirname(file),
            `${fileNameWithoutExt}-${size}${fileExt}`
          );
          const webpSizePath = path.join(
            path.dirname(file),
            `${fileNameWithoutExt}-${size}.webp`
          );

          await this.generateResponsiveImage(file, sizePath, size);
          await this.generateResponsiveImage(webpPath, webpSizePath, size);
        }

        console.log(`✓ Optimized ${fileName}`);
      } catch (error) {
        console.error(`Error optimizing ${file}:`, error);
      }
    }
  }

  async generateWebP(inputPath, outputPath) {
    await sharp(inputPath)
      .webp({ quality: this.quality })
      .toFile(outputPath);
  }

  async generateResponsiveImage(inputPath, outputPath, size) {
    await sharp(inputPath)
      .resize(size, null, {
        withoutEnlargement: true,
        fit: 'inside'
      })
      .toFile(outputPath);
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
optimizer.optimize(); 