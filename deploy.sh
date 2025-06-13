#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting deployment process...${NC}"

# Function to handle errors
handle_error() {
    echo -e "${RED}Error: $1${NC}"
    exit 1
}

# Check if git is installed
if ! command -v git &> /dev/null; then
    handle_error "Git is not installed"
fi

# Check if firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    handle_error "Firebase CLI is not installed"
fi

# Check if we're in a git repository
if ! git rev-parse --is-inside-work-tree &> /dev/null; then
    handle_error "Not in a git repository"
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo -e "${YELLOW}You have uncommitted changes. Please commit or stash them first.${NC}"
    exit 1
fi

# Deploy to GitHub
echo -e "${YELLOW}Deploying to GitHub...${NC}"
if ! git push origin main; then
    handle_error "Failed to push to GitHub"
fi
echo -e "${GREEN}Successfully deployed to GitHub!${NC}"

# Deploy to Firebase
echo -e "${YELLOW}Deploying to Firebase...${NC}"
if ! firebase deploy --only hosting; then
    handle_error "Failed to deploy to Firebase"
fi
echo -e "${GREEN}Successfully deployed to Firebase!${NC}"

echo -e "${GREEN}Deployment completed successfully!${NC}"
echo -e "${GREEN}GitHub: https://github.com/ronb12/Holliday-Lawn-Garden${NC}"
echo -e "${GREEN}Firebase: https://holiday-lawn-and-garden.web.app${NC}" 