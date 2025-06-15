const fs = require('fs');
const path = require('path');

class ImageLoader {
  constructor() {
    this.htmlDir = '.';
  }

  async enhanceImages() {
    const htmlFiles = this.findFiles(this.htmlDir, ['.html']);
    console.log(`Found ${htmlFiles.length} HTML files to enhance`);

    for (const file of htmlFiles) {
      try {
        let content = fs.readFileSync(file, 'utf8');

        // Add lazy loading and WebP support
        content = this.enhanceImageTags(content);

        // Add preload hints for critical images
        content = this.addPreloadHints(content);

        fs.writeFileSync(file, content);
        console.log(`✓ Enhanced ${file}`);
      } catch (error) {
        console.error(`Error enhancing ${file}:`, error);
      }
    }
  }

  enhanceImageTags(content) {
    return content.replace(/<img([^>]*)>/g, (match, attrs) => {
      // Add lazy loading if not present
      if (!attrs.includes('loading=')) {
        attrs += ' loading="lazy"';
      }

      // Add WebP support
      const srcMatch = attrs.match(/src="([^"]*)"/);
      if (srcMatch) {
        const src = srcMatch[1];
        const webpSrc = src.replace(/\.(jpg|jpeg|png)$/, '.webp');

        // Create picture element with WebP support
        return `
          <picture>
            <source srcset="${webpSrc}" type="image/webp">
            <img${attrs}>
          </picture>`;
      }

      return `<img${attrs}>`;
    });
  }

  addPreloadHints(content) {
    // Find hero images and other critical images
    const criticalImages = content.match(/<img[^>]*class="[^"]*hero[^"]*"[^>]*>/g) || [];
    const preloadHints = criticalImages
      .map(img => {
        const srcMatch = img.match(/src="([^"]*)"/);
        if (srcMatch) {
          const src = srcMatch[1];
          const webpSrc = src.replace(/\.(jpg|jpeg|png)$/, '.webp');
          return `
    <link rel="preload" as="image" href="${webpSrc}" type="image/webp">
    <link rel="preload" as="image" href="${src}" type="image/${this.getImageType(src)}">`;
        }
        return '';
      })
      .join('');

    // Add preload hints to head
    return content.replace(/<head>/, `<head>${preloadHints}`);
  }

  getImageType(src) {
    const ext = path.extname(src).toLowerCase();
    switch (ext) {
      case '.jpg':
      case '.jpeg':
        return 'jpeg';
      case '.png':
        return 'png';
      default:
        return 'image';
    }
  }

  findFiles(dir, extensions) {
    let results = [];
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        results = results.concat(this.findFiles(filePath, extensions));
      } else if (extensions.some(ext => file.endsWith(ext))) {
        results.push(filePath);
      }
    }

    return results;
  }
}

// Run the enhancer
const loader = new ImageLoader();
loader.enhanceImages();
