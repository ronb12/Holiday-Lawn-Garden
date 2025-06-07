const { execSync } = require('child_process');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m'
};

// Helper function to run commands
function runCommand(command) {
  try {
    console.log(`${colors.yellow}Running: ${command}${colors.reset}`);
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`${colors.red}Error running command: ${command}${colors.reset}`);
    console.error(error);
    return false;
  }
}

// Main deployment function
async function deploy() {
  console.log(`${colors.green}Starting deployment process...${colors.reset}`);

  // Step 1: Build the project
  console.log(`${colors.green}Building project...${colors.reset}`);
  if (!runCommand('npm run build')) {
    console.error(`${colors.red}Build failed. Aborting deployment.${colors.reset}`);
    process.exit(1);
  }

  // Step 2: Deploy to Firebase
  console.log(`${colors.green}Deploying to Firebase...${colors.reset}`);
  if (!runCommand('npm run deploy')) {
    console.error(`${colors.red}Firebase deployment failed.${colors.reset}`);
  }

  // Step 3: Deploy to GitHub Pages
  console.log(`${colors.green}Deploying to GitHub Pages...${colors.reset}`);
  if (!runCommand('npm run deploy:gh-pages')) {
    console.error(`${colors.red}GitHub Pages deployment failed.${colors.reset}`);
  }

  console.log(`${colors.green}Deployment process completed!${colors.reset}`);
  console.log(`${colors.green}Your site should be available at:${colors.reset}`);
  console.log(`${colors.yellow}Firebase: https://holiday-lawn-and-garden.firebaseapp.com${colors.reset}`);
  console.log(`${colors.yellow}GitHub Pages: https://ronb12.github.io/Holliday-Lawn-Garden${colors.reset}`);
}

// Run the deployment
deploy().catch(error => {
  console.error(`${colors.red}Deployment failed:${colors.reset}`, error);
  process.exit(1);
}); 