# Holliday's Lawn & Garden Website

A professional website for Holliday's Lawn & Garden, offering lawn care and landscaping services.

## Features

- Responsive design for all devices
- Modern and clean green theme
- Service booking system
- Online bill payment
- Educational resources
- Contact form
- Admin dashboard (client-side)
- Progressive Web App (PWA) support

## Tech Stack

- HTML5
- CSS3
- JavaScript (ES6+)
- Firebase (client-side only: Authentication, Firestore, Analytics)
- Service Workers
- PWA

## Project Structure

```
/
├── index.html
├── about.html
├── services.html
├── ... (other .html pages)
├── 404.html
├── offline.html
├── service-worker.js
├── manifest.json
├── robots.txt
├── sitemap.xml
├── assets/
│   ├── styles/
│   ├── js/
│   ├── images/
│   └── ...
├── .github/
│   └── workflows/
│       └── deploy.yml
├── README.md
├── .gitignore
```

## Deployment

This site is deployed automatically via [GitHub Pages](https://ronb12.github.io/Holliday-Lawn-Garden/).

- **Branch:** `main`
- **Source:** Root directory (`/`)
- **No build step required**
- **No Node.js or Firebase CLI required**

### To update the site:
1. Edit or add your HTML, CSS, JS, or asset files locally.
2. Commit and push to the `main` branch.
3. GitHub Pages will automatically redeploy your changes.

## Local Development

You can preview the site locally with any static file server, e.g.:

```
python3 -m http.server 8000
```

Then visit [http://localhost:8000](http://localhost:8000).

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

# Holliday's Lawn & Garden - Development Server

This is a local development server for the Holliday's Lawn & Garden website. It provides live reloading and file change monitoring capabilities.

## Setup Instructions

1. Make sure you have Python 3.6+ installed on your system.

2. Install the required dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Start the development server:
   ```bash
   python server.py
   ```

The server will:
- Start on http://localhost:8000
- Automatically open your default web browser
- Monitor for changes in HTML, CSS, and JavaScript files
- Notify you when files are modified

## Features

- Live file change monitoring
- Automatic browser opening
- Support for static file serving
- Cross-platform compatibility

## Usage

1. The server will automatically start when you run `python server.py`
2. Any changes to HTML, CSS, or JavaScript files will be detected
3. Refresh your browser to see the changes
4. Press Ctrl+C in the terminal to stop the server

## Notes

- The server runs on port 8000 by default
- All file paths are relative to the project root
- The server will watch for changes in all subdirectories


