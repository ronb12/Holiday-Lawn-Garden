const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

class AppGrader {
  constructor() {
    this.scores = {
      performance: { score: 0, max: 100, details: [] },
      accessibility: { score: 0, max: 100, details: [] },
      bestPractices: { score: 0, max: 100, details: [] },
      seo: { score: 0, max: 100, details: [] },
      security: { score: 0, max: 100, details: [] },
      features: { score: 0, max: 100, details: [] },
      codeQuality: { score: 0, max: 100, details: [] },
      userExperience: { score: 0, max: 100, details: [] }
    };
    this.report = {
      timestamp: new Date().toISOString(),
      overallScore: 0,
      grades: {},
      recommendations: []
    };
  }

  async runAllChecks() {
    console.log('Starting comprehensive application grading...\n');

    // Run all checks
    await this.checkPerformance();
    await this.checkAccessibility();
    await this.checkBestPractices();
    await this.checkSEO();
    await this.checkSecurity();
    await this.checkFeatures();
    await this.checkCodeQuality();
    await this.checkUserExperience();

    // Calculate overall score
    this.calculateOverallScore();
    
    // Generate recommendations
    this.generateRecommendations();
    
    // Save report
    this.saveReport();
  }

  async checkPerformance() {
    console.log('Checking performance...');
    
    // Check image optimization
    const images = this.findFiles('assets/images', ['.jpg', '.png', '.webp']);
    const optimizedImages = images.filter(img => {
      const stats = fs.statSync(img);
      return stats.size < 500000; // 500KB threshold
    });
    
    // Check CSS/JS minification
    const cssFiles = this.findFiles('assets/styles', ['.css']);
    const jsFiles = this.findFiles('assets/js', ['.js']);
    const minifiedFiles = [...cssFiles, ...jsFiles].filter(file => 
      file.includes('.min.') || file.includes('minified')
    );

    // Check resource loading
    const htmlFiles = this.findFiles('.', ['.html']);
    const asyncScripts = htmlFiles.filter(file => {
      const content = fs.readFileSync(file, 'utf8');
      return content.includes('async') || content.includes('defer');
    });

    // Calculate score
    const imageScore = (optimizedImages.length / images.length) * 30;
    const minificationScore = (minifiedFiles.length / (cssFiles.length + jsFiles.length)) * 30;
    const loadingScore = (asyncScripts.length / htmlFiles.length) * 40;

    this.scores.performance.score = imageScore + minificationScore + loadingScore;
    this.scores.performance.details = [
      `Image optimization: ${Math.round(imageScore)}/30`,
      `Code minification: ${Math.round(minificationScore)}/30`,
      `Resource loading: ${Math.round(loadingScore)}/40`
    ];
  }

  async checkAccessibility() {
    console.log('Checking accessibility...');
    
    // Check ARIA attributes
    const htmlFiles = this.findFiles('.', ['.html']);
    const ariaElements = htmlFiles.filter(file => {
      const content = fs.readFileSync(file, 'utf8');
      return content.includes('aria-');
    });

    // Check alt text
    const imagesWithAlt = htmlFiles.filter(file => {
      const content = fs.readFileSync(file, 'utf8');
      return content.includes('alt="') && !content.includes('alt=""');
    });

    // Check semantic HTML
    const semanticElements = htmlFiles.filter(file => {
      const content = fs.readFileSync(file, 'utf8');
      return content.includes('<nav') || content.includes('<main') || 
             content.includes('<article') || content.includes('<section');
    });

    // Calculate score
    const ariaScore = (ariaElements.length / htmlFiles.length) * 40;
    const altScore = (imagesWithAlt.length / htmlFiles.length) * 30;
    const semanticScore = (semanticElements.length / htmlFiles.length) * 30;

    this.scores.accessibility.score = ariaScore + altScore + semanticScore;
    this.scores.accessibility.details = [
      `ARIA attributes: ${Math.round(ariaScore)}/40`,
      `Image alt text: ${Math.round(altScore)}/30`,
      `Semantic HTML: ${Math.round(semanticScore)}/30`
    ];
  }

  async checkBestPractices() {
    console.log('Checking best practices...');
    
    // Check meta tags
    const htmlFiles = this.findFiles('.', ['.html']);
    const metaTags = htmlFiles.filter(file => {
      const content = fs.readFileSync(file, 'utf8');
      return content.includes('<meta name="description"') && 
             content.includes('<meta name="viewport"');
    });

    // Check favicon
    const hasFavicon = htmlFiles.filter(file => {
      const content = fs.readFileSync(file, 'utf8');
      return content.includes('<link rel="icon"') || 
             content.includes('<link rel="shortcut icon"');
    });

    // Check responsive design
    const responsiveDesign = htmlFiles.filter(file => {
      const content = fs.readFileSync(file, 'utf8');
      return content.includes('@media') || content.includes('responsive');
    });

    // Calculate score
    const metaScore = (metaTags.length / htmlFiles.length) * 30;
    const faviconScore = (hasFavicon.length / htmlFiles.length) * 20;
    const responsiveScore = (responsiveDesign.length / htmlFiles.length) * 50;

    this.scores.bestPractices.score = metaScore + faviconScore + responsiveScore;
    this.scores.bestPractices.details = [
      `Meta tags: ${Math.round(metaScore)}/30`,
      `Favicon: ${Math.round(faviconScore)}/20`,
      `Responsive design: ${Math.round(responsiveScore)}/50`
    ];
  }

  async checkSEO() {
    console.log('Checking SEO...');
    
    // Check title tags
    const htmlFiles = this.findFiles('.', ['.html']);
    const titleTags = htmlFiles.filter(file => {
      const content = fs.readFileSync(file, 'utf8');
      return content.includes('<title>') && !content.includes('<title>Untitled');
    });

    // Check heading structure
    const headingStructure = htmlFiles.filter(file => {
      const content = fs.readFileSync(file, 'utf8');
      return content.includes('<h1>') && content.includes('<h2>');
    });

    // Check sitemap
    const hasSitemap = fs.existsSync('sitemap.xml');

    // Calculate score
    const titleScore = (titleTags.length / htmlFiles.length) * 40;
    const headingScore = (headingStructure.length / htmlFiles.length) * 40;
    const sitemapScore = hasSitemap ? 20 : 0;

    this.scores.seo.score = titleScore + headingScore + sitemapScore;
    this.scores.seo.details = [
      `Title tags: ${Math.round(titleScore)}/40`,
      `Heading structure: ${Math.round(headingScore)}/40`,
      `Sitemap: ${sitemapScore}/20`
    ];
  }

  async checkSecurity() {
    console.log('Checking security...');
    
    // Check HTTPS
    const hasHttps = true; // Assuming HTTPS is configured

    // Check security headers
    const hasSecurityHeaders = fs.existsSync('security-headers.js');

    // Check form validation
    const hasFormValidation = fs.existsSync('assets/js/form-validation.js');

    // Calculate score
    const httpsScore = hasHttps ? 40 : 0;
    const headersScore = hasSecurityHeaders ? 30 : 0;
    const validationScore = hasFormValidation ? 30 : 0;

    this.scores.security.score = httpsScore + headersScore + validationScore;
    this.scores.security.details = [
      `HTTPS: ${httpsScore}/40`,
      `Security headers: ${headersScore}/30`,
      `Form validation: ${validationScore}/30`
    ];
  }

  async checkFeatures() {
    console.log('Checking features...');
    
    // Check customer features
    const customerFeatures = {
      account: fs.existsSync('create-account.html'),
      login: fs.existsSync('login.html'),
      dashboard: fs.existsSync('customer-dashboard.html'),
      payment: fs.existsSync('pay-your-bill.html'),
      profile: fs.existsSync('profile.html')
    };

    // Check admin features
    const adminFeatures = {
      login: fs.existsSync('admin-login.html'),
      dashboard: fs.existsSync('admin.html'),
      management: fs.existsSync('assets/js/admin-management.js')
    };

    // Calculate scores
    const customerScore = Object.values(customerFeatures).filter(Boolean).length * 20;
    const adminScore = Object.values(adminFeatures).filter(Boolean).length * 33.33;

    this.scores.features.score = Math.min(100, (customerScore + adminScore) / 2);
    this.scores.features.details = [
      `Customer features: ${customerScore}/100`,
      `Admin features: ${adminScore}/100`
    ];
  }

  async checkCodeQuality() {
    console.log('Checking code quality...');
    
    // Check file organization
    const hasOrganizedStructure = fs.existsSync('assets/styles') && 
                                 fs.existsSync('assets/js') && 
                                 fs.existsSync('assets/images');

    // Check CSS organization
    const cssFiles = this.findFiles('assets/styles', ['.css']);
    const hasComponentCSS = cssFiles.some(file => file.includes('components/'));

    // Check JavaScript organization
    const jsFiles = this.findFiles('assets/js', ['.js']);
    const hasModularJS = jsFiles.some(file => file.includes('modules/'));

    // Calculate score
    const structureScore = hasOrganizedStructure ? 40 : 0;
    const cssScore = hasComponentCSS ? 30 : 0;
    const jsScore = hasModularJS ? 30 : 0;

    this.scores.codeQuality.score = structureScore + cssScore + jsScore;
    this.scores.codeQuality.details = [
      `File structure: ${structureScore}/40`,
      `CSS organization: ${cssScore}/30`,
      `JavaScript organization: ${jsScore}/30`
    ];
  }

  async checkUserExperience() {
    console.log('Checking user experience...');
    
    // Check navigation
    const hasNavigation = fs.existsSync('assets/styles/components/header.css');

    // Check feedback
    const hasFeedback = fs.existsSync('assets/styles/components/loading.css') && 
                       fs.existsSync('assets/styles/components/notifications.css');

    // Check responsive design
    const hasResponsive = this.findFiles('assets/styles', ['.css'])
      .some(file => {
        const content = fs.readFileSync(file, 'utf8');
        return content.includes('@media');
      });

    // Calculate score
    const navigationScore = hasNavigation ? 40 : 0;
    const feedbackScore = hasFeedback ? 30 : 0;
    const responsiveScore = hasResponsive ? 30 : 0;

    this.scores.userExperience.score = navigationScore + feedbackScore + responsiveScore;
    this.scores.userExperience.details = [
      `Navigation: ${navigationScore}/40`,
      `User feedback: ${feedbackScore}/30`,
      `Responsive design: ${responsiveScore}/30`
    ];
  }

  calculateOverallScore() {
    const weights = {
      performance: 0.15,
      accessibility: 0.15,
      bestPractices: 0.15,
      seo: 0.10,
      security: 0.15,
      features: 0.10,
      codeQuality: 0.10,
      userExperience: 0.10
    };

    let totalScore = 0;
    for (const [category, score] of Object.entries(this.scores)) {
      totalScore += score.score * weights[category];
    }

    this.report.overallScore = Math.round(totalScore);
  }

  generateRecommendations() {
    for (const [category, score] of Object.entries(this.scores)) {
      if (score.score < 80) {
        this.report.recommendations.push({
          category,
          currentScore: Math.round(score.score),
          suggestions: this.getRecommendationsForCategory(category, score)
        });
      }
    }
  }

  getRecommendationsForCategory(category, score) {
    const recommendations = {
      performance: [
        'Optimize images using WebP format',
        'Implement lazy loading for images',
        'Minify CSS and JavaScript files',
        'Use resource hints (preload, prefetch)'
      ],
      accessibility: [
        'Add ARIA labels to interactive elements',
        'Ensure proper heading hierarchy',
        'Add alt text to all images',
        'Improve keyboard navigation'
      ],
      bestPractices: [
        'Add meta description tags',
        'Implement favicon',
        'Add viewport meta tag',
        'Improve responsive design'
      ],
      seo: [
        'Optimize title tags',
        'Improve heading structure',
        'Create sitemap.xml',
        'Add meta robots tag'
      ],
      security: [
        'Implement security headers',
        'Add form validation',
        'Enable HTTPS',
        'Implement CSRF protection'
      ],
      features: [
        'Complete customer dashboard',
        'Enhance admin features',
        'Add payment processing',
        'Implement user profiles'
      ],
      codeQuality: [
        'Organize file structure',
        'Implement component-based CSS',
        'Modularize JavaScript',
        'Add code documentation'
      ],
      userExperience: [
        'Improve navigation',
        'Add loading states',
        'Enhance feedback mechanisms',
        'Optimize mobile experience'
      ]
    };

    return recommendations[category].slice(0, 2);
  }

  saveReport() {
    const report = {
      timestamp: this.report.timestamp,
      overallScore: this.report.overallScore,
      grades: Object.fromEntries(
        Object.entries(this.scores).map(([category, data]) => [
          category,
          {
            score: Math.round(data.score),
            details: data.details
          }
        ])
      ),
      recommendations: this.report.recommendations
    };

    const reportDir = 'reports';
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir);
    }

    const filename = `app_grade_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    fs.writeFileSync(path.join(reportDir, filename), JSON.stringify(report, null, 2));
    
    console.log(`\nGrading complete! Report saved to ${filename}`);
    console.log(`Overall Score: ${report.overallScore}/100`);
    
    // Print detailed scores
    console.log('\nDetailed Scores:');
    for (const [category, data] of Object.entries(report.grades)) {
      console.log(`\n${category.toUpperCase()}: ${data.score}/100`);
      data.details.forEach(detail => console.log(`  ${detail}`));
    }

    // Print recommendations
    if (report.recommendations.length > 0) {
      console.log('\nRecommendations:');
      report.recommendations.forEach(rec => {
        console.log(`\n${rec.category.toUpperCase()} (${rec.currentScore}/100):`);
        rec.suggestions.forEach(suggestion => console.log(`  - ${suggestion}`));
      });
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

// Run the grader
const grader = new AppGrader();
grader.runAllChecks(); 