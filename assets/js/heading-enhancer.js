const fs = require('fs');
const path = require('path');

class HeadingEnhancer {
  constructor() {
    this.htmlDir = '.';
  }

  async enhance() {
    const htmlFiles = this.findFiles(this.htmlDir, ['.html']);
    console.log(`Found ${htmlFiles.length} HTML files to enhance`);

    for (const file of htmlFiles) {
      try {
        let content = fs.readFileSync(file, 'utf8');
        
        // Fix heading hierarchy
        content = this.fixHeadingHierarchy(content);
        
        // Add section headings
        content = this.addSectionHeadings(content, file);
        
        // Add schema markup
        content = this.addSchemaMarkup(content, file);
        
        fs.writeFileSync(file, content);
        console.log(`✓ Enhanced ${file}`);
      } catch (error) {
        console.error(`Error enhancing ${file}:`, error);
      }
    }
  }

  fixHeadingHierarchy(content) {
    // Ensure h1 is only used once and is the first heading
    const h1Count = (content.match(/<h1[^>]*>.*?<\/h1>/gs) || []).length;
    if (h1Count > 1) {
      content = content.replace(/<h1[^>]*>(.*?)<\/h1>/g, (match, text, index) => {
        return index === 0 ? match : `<h2>${text}</h2>`;
      });
    }

    // Fix skipped heading levels
    let currentLevel = 1;
    const headingRegex = /<h([1-6])[^>]*>(.*?)<\/h\1>/g;
    let match;
    let newContent = content;

    while ((match = headingRegex.exec(content)) !== null) {
      const level = parseInt(match[1]);
      if (level > currentLevel + 1) {
        const newLevel = currentLevel + 1;
        const headingText = match[2];
        const oldHeading = match[0];
        const newHeading = `<h${newLevel}>${headingText}</h${newLevel}>`;
        newContent = newContent.replace(oldHeading, newHeading);
      }
      currentLevel = level;
    }

    return newContent;
  }

  addSectionHeadings(content, file) {
    const fileName = path.basename(file, '.html');
    const sections = this.getSectionsForPage(fileName);
    
    sections.forEach(section => {
      if (!content.includes(`<h${section.level}>${section.title}</h${section.level}>`)) {
        const sectionHtml = `
          <section class="${section.class}" aria-labelledby="${section.id}">
            <h${section.level} id="${section.id}">${section.title}</h${section.level}>
            ${section.content}
          </section>
        `;
        content = content.replace(section.content, sectionHtml);
      }
    });

    return content;
  }

  addSchemaMarkup(content, file) {
    const fileName = path.basename(file, '.html');
    const schema = this.generateSchema(fileName);
    
    if (!content.includes('application/ld+json')) {
      const schemaScript = `
        <script type="application/ld+json">
          ${JSON.stringify(schema, null, 2)}
        </script>
      `;
      return content.replace('</head>', `${schemaScript}\n</head>`);
    }
    
    return content;
  }

  getSectionsForPage(fileName) {
    const sections = {
      'index': [
        {
          level: 2,
          title: 'Welcome to Holliday Lawn & Garden',
          class: 'welcome-section',
          id: 'welcome',
          content: '<div class="welcome-content"></div>'
        },
        {
          level: 2,
          title: 'Our Services',
          class: 'services-section',
          id: 'services',
          content: '<div class="services-content"></div>'
        },
        {
          level: 2,
          title: 'Why Choose Us',
          class: 'why-us-section',
          id: 'why-us',
          content: '<div class="why-us-content"></div>'
        }
      ],
      'about': [
        {
          level: 2,
          title: 'Our Story',
          class: 'story-section',
          id: 'story',
          content: '<div class="story-content"></div>'
        },
        {
          level: 2,
          title: 'Our Team',
          class: 'team-section',
          id: 'team',
          content: '<div class="team-content"></div>'
        },
        {
          level: 2,
          title: 'Our Mission',
          class: 'mission-section',
          id: 'mission',
          content: '<div class="mission-content"></div>'
        }
      ],
      'services': [
        {
          level: 2,
          title: 'Lawn Care Services',
          class: 'lawn-care-section',
          id: 'lawn-care',
          content: '<div class="lawn-care-content"></div>'
        },
        {
          level: 2,
          title: 'Landscaping Services',
          class: 'landscaping-section',
          id: 'landscaping',
          content: '<div class="landscaping-content"></div>'
        },
        {
          level: 2,
          title: 'Garden Services',
          class: 'garden-section',
          id: 'garden',
          content: '<div class="garden-content"></div>'
        }
      ]
    };

    return sections[fileName] || [];
  }

  generateSchema(fileName) {
    const baseSchema = {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      'name': this.getPageTitle(fileName),
      'description': this.getPageDescription(fileName),
      'url': `https://hollidaylawngarden.com/${fileName}`,
      'publisher': {
        '@type': 'Organization',
        'name': 'Holliday Lawn & Garden',
        'logo': {
          '@type': 'ImageObject',
          'url': 'https://hollidaylawngarden.com/assets/images/hollidays-logo.png'
        }
      }
    };

    if (fileName === 'index') {
      baseSchema['@type'] = 'WebSite';
      baseSchema.potentialAction = {
        '@type': 'SearchAction',
        'target': 'https://hollidaylawngarden.com/search?q={search_term_string}',
        'query-input': 'required name=search_term_string'
      };
    }

    return baseSchema;
  }

  getPageTitle(fileName) {
    const titles = {
      'index': 'Holliday Lawn & Garden - Professional Landscaping Services',
      'about': 'About Holliday Lawn & Garden - Our Story and Mission',
      'services': 'Our Services - Professional Lawn Care and Landscaping',
      'contact': 'Contact Holliday Lawn & Garden - Get in Touch',
      'gallery': 'Our Work - Holliday Lawn & Garden Portfolio',
      'testimonials': 'Customer Testimonials - Holliday Lawn & Garden Reviews',
      'faq': 'Frequently Asked Questions - Holliday Lawn & Garden',
      'privacy': 'Privacy Policy - Holliday Lawn & Garden',
      'terms': 'Terms of Service - Holliday Lawn & Garden',
      'login': 'Login - Holliday Lawn & Garden Customer Portal',
      'register': 'Register - Create Your Holliday Lawn & Garden Account',
      'profile': 'My Profile - Holliday Lawn & Garden Customer Portal',
      'dashboard': 'Customer Dashboard - Holliday Lawn & Garden',
      'admin': 'Admin Dashboard - Holliday Lawn & Garden',
      'pay': 'Pay Your Bill - Holliday Lawn & Garden',
      'receipt': 'Payment Receipt - Holliday Lawn & Garden',
      'education': 'Lawn Care Education - Holliday Lawn & Garden',
      'sitemap': 'Sitemap - Holliday Lawn & Garden',
      'offline': 'Offline - Holliday Lawn & Garden',
      'error': 'Error - Holliday Lawn & Garden',
      '404': 'Page Not Found - Holliday Lawn & Garden',
      'home': 'Welcome to Holliday Lawn & Garden',
      'services': 'Our Services',
      'about': 'About Us',
      'contact': 'Get in Touch',
      'gallery': 'Our Work',
      'cta': 'Ready to Get Started?',
      'footer': 'Contact Information'
    };
    
    return titles[fileName] || 'Holliday Lawn & Garden';
  }

  getPageDescription(fileName) {
    const descriptions = {
      'index': 'Professional lawn care and landscaping services in your area. Get expert lawn maintenance, garden design, and outdoor living solutions.',
      'about': 'Learn about Holliday Lawn & Garden\'s commitment to excellence in lawn care and landscaping. Discover our story, mission, and values.',
      'services': 'Explore our comprehensive lawn care and landscaping services. From lawn maintenance to garden design, we\'ve got you covered.',
      'contact': 'Get in touch with Holliday Lawn & Garden. Contact us for a free consultation or to schedule our services.',
      'gallery': 'View our portfolio of successful lawn care and landscaping projects. See the quality of our work and get inspired.',
      'testimonials': 'Read what our satisfied customers have to say about our lawn care and landscaping services.',
      'faq': 'Find answers to common questions about our lawn care and landscaping services.',
      'privacy': 'Read our privacy policy to understand how we protect your personal information.',
      'terms': 'Review our terms of service for using Holliday Lawn & Garden\'s services.',
      'login': 'Access your Holliday Lawn & Garden customer account. Manage your services and payments.',
      'register': 'Create your Holliday Lawn & Garden customer account. Get started with our services.',
      'profile': 'Manage your Holliday Lawn & Garden customer profile and preferences.',
      'dashboard': 'Access your Holliday Lawn & Garden customer dashboard. View your services and account information.',
      'admin': 'Access the Holliday Lawn & Garden admin dashboard. Manage customers and services.',
      'pay': 'Pay your Holliday Lawn & Garden bill securely online.',
      'receipt': 'View your Holliday Lawn & Garden payment receipt.',
      'education': 'Learn about lawn care and gardening from our experts. Get tips and advice for maintaining your outdoor space.',
      'sitemap': 'Navigate the Holliday Lawn & Garden website with our comprehensive sitemap.',
      'offline': 'You are currently offline. Please check your internet connection.',
      'error': 'An error has occurred. Please try again later.',
      '404': 'The page you are looking for could not be found.',
      'home': 'Welcome to Holliday Lawn & Garden',
      'services': 'Our Services',
      'about': 'About Us',
      'contact': 'Get in Touch',
      'gallery': 'Our Work',
      'cta': 'Ready to Get Started?',
      'footer': 'Contact Information'
    };
    
    return descriptions[fileName] || 'Professional lawn care and landscaping services in your area.';
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
const enhancer = new HeadingEnhancer();
enhancer.enhance(); 