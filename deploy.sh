#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting parallel deployment process...${NC}"

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
if [[ -n $(git status -s) ]]; then
    echo -e "${RED}You have uncommitted changes:${NC}"
    git status -s
    echo -e "${YELLOW}Please commit or stash your changes before deploying.${NC}"
    exit 1
fi

# Check if we're on the main branch
current_branch=$(git rev-parse --abbrev-ref HEAD)
if [[ "$current_branch" != "main" ]]; then
    echo -e "${YELLOW}You are not on the main branch (currently on $current_branch).${NC}"
    read -p "Do you want to continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Function to deploy to GitHub
deploy_github() {
    echo -e "${YELLOW}Deploying to GitHub...${NC}"
    if ! git push origin main; then
        echo -e "${RED}Failed to push to GitHub${NC}"
        return 1
    fi
    echo -e "${GREEN}Successfully deployed to GitHub!${NC}"
    return 0
}

# Function to deploy to Firebase
deploy_firebase() {
    echo -e "${YELLOW}Deploying to Firebase...${NC}"
    if ! firebase deploy --only hosting; then
        echo -e "${RED}Failed to deploy to Firebase${NC}"
        return 1
    fi
    echo -e "${GREEN}Successfully deployed to Firebase!${NC}"
    return 0
}

# Run both deployments in parallel
deploy_github &
github_pid=$!
deploy_firebase &
firebase_pid=$!

# Wait for both processes to complete
wait $github_pid
github_status=$?
wait $firebase_pid
firebase_status=$?

# Check if either deployment failed
if [ $github_status -ne 0 ] || [ $firebase_status -ne 0 ]; then
    echo -e "${RED}Deployment failed!${NC}"
    if [ $github_status -ne 0 ]; then
        echo -e "${RED}GitHub deployment failed${NC}"
    fi
    if [ $firebase_status -ne 0 ]; then
        echo -e "${RED}Firebase deployment failed${NC}"
    fi
    exit 1
fi

echo -e "${GREEN}Parallel deployment completed successfully!${NC}"
echo -e "${GREEN}GitHub: https://github.com/ronb12/Holliday-Lawn-Garden${NC}"
echo -e "${GREEN}Firebase: https://holiday-lawn-and-garden.web.app${NC}" 