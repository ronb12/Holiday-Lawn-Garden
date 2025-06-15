const fs = require('fs'),
  path = require('path'),
  sharp = require('sharp');
class ImageOptimizer {
  constructor() {
    (this.imageDir = 'assets/images'), (this.quality = 80), (this.sizes = [320, 640, 960, 1280]);
  }
  async optimize() {
    const e = this.findFiles(this.imageDir, ['.jpg', '.jpeg', '.png']);
    for (const t of e)
      try {
        path.basename(t);
        const e = path.extname(t),
          i = path.basename(t, e),
          s = path.join(path.dirname(t), `${i}.webp`);
        await this.generateWebP(t, s);
        for (const a of this.sizes) {
          const n = path.join(path.dirname(t), `${i}-${a}${e}`),
            r = path.join(path.dirname(t), `${i}-${a}.webp`);
          await this.generateResponsiveImage(t, n, a), await this.generateResponsiveImage(s, r, a);
        }
      } catch (e) {}
  }
  async generateWebP(e, t) {
    await sharp(e).webp({ quality: this.quality }).toFile(t);
  }
  async generateResponsiveImage(e, t, i) {
    await sharp(e).resize(i, null, { withoutEnlargement: !0, fit: 'inside' }).toFile(t);
  }
  findFiles(e, t) {
    let i = [];
    const s = fs.readdirSync(e);
    for (const a of s) {
      const s = path.join(e, a);
      fs.statSync(s).isDirectory()
        ? (i = i.concat(this.findFiles(s, t)))
        : t.some(e => a.toLowerCase().endsWith(e)) && i.push(s);
    }
    return i;
  }
}
const optimizer = new ImageOptimizer();
optimizer.optimize();
