#!/bin/bash

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Portfolio Messaging System - Deployment Script${NC}"
echo "This script will help you deploy your messaging system to Cloudflare Workers"
echo "----------------------------------------------------------------------"

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo -e "${RED}Wrangler CLI is not installed.${NC} Installing it globally..."
    npm install -g wrangler
fi

# Check if the user is logged in to Cloudflare
echo -e "\n${YELLOW}Checking Cloudflare login status...${NC}"
WRANGLER_WHOAMI=$(wrangler whoami 2>&1)
if [[ $WRANGLER_WHOAMI == *"not logged in"* ]]; then
    echo -e "${RED}You are not logged in to Cloudflare.${NC} Please log in:"
    wrangler login
else
    echo -e "${GREEN}You are already logged in to Cloudflare.${NC}"
fi

# Apply the migrations
echo -e "\n${YELLOW}Applying database migrations...${NC}"
echo "This will create the necessary tables in your D1 database."

# Get the database name from wrangler.toml
DB_NAME=$(grep "database_name" wrangler.toml | cut -d '"' -f 2 || grep "database_name" wrangler.toml | cut -d "'" -f 2)
if [ -z "$DB_NAME" ]; then
    echo -e "${RED}Could not find database_name in wrangler.toml${NC}"
    exit 1
fi

echo "Found database: $DB_NAME"

# Apply the first migration (messages table)
echo "Applying migration 1: Create basic messages table..."
wrangler d1 execute $DB_NAME --file=./migrations/0001_create_messages_table.sql

# Apply the second migration (improved schema)
echo "Applying migration 2: Create improved messaging schema..."
wrangler d1 execute $DB_NAME --file=./migrations/0002_create_messaging_system.sql

# Update the URLs in the sendMessage.js file
echo -e "\n${YELLOW}Updating worker URLs in the code...${NC}"

# Get the worker name from wrangler.toml
WORKER_NAME=$(grep "^name" wrangler.toml | cut -d '"' -f 2 || grep "^name" wrangler.toml | cut -d "=" -f 2 | tr -d ' ' | tr -d "'")
if [ -z "$WORKER_NAME" ]; then
    echo -e "${RED}Could not find worker name in wrangler.toml${NC}"
    exit 1
fi

# Get the Cloudflare account name/ID
ACCOUNT_ID=$(wrangler whoami | grep -o 'Account: .*' | cut -d ' ' -f 2- | tr -d '()' | awk '{print $NF}')
if [ -z "$ACCOUNT_ID" ]; then
    echo -e "${RED}Could not determine your Cloudflare account ID.${NC}"
    echo "Please enter your Cloudflare account ID or username:"
    read ACCOUNT_ID
fi

# Replace placeholder URL in sendMessage.js
WORKER_URL="${WORKER_NAME}.${ACCOUNT_ID}.workers.dev"
echo "Setting worker URL to: $WORKER_URL"

# Use sed to replace the placeholder URL
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s|https://[^/]*/|https://${WORKER_NAME}.${ACCOUNT_ID}.workers.dev/|" ./src/scripts/sendMessage.js
else
    # Linux and others
    sed -i "s|https://[^/]*/|https://${WORKER_NAME}.${ACCOUNT_ID}.workers.dev/|" ./src/scripts/sendMessage.js
fi

# Deploy the worker
echo -e "\n${YELLOW}Deploying Cloudflare Worker...${NC}"
wrangler deploy

echo -e "\n${GREEN}Deployment complete!${NC}"
echo "Your messaging system should now be available at: https://${WORKER_NAME}.${ACCOUNT_ID}.workers.dev"
echo -e "\n${YELLOW}Testing your worker...${NC}"
echo "Sending a test request to: https://${WORKER_NAME}.${ACCOUNT_ID}.workers.dev/api/messages"
curl -s "https://${WORKER_NAME}.${ACCOUNT_ID}.workers.dev/api/messages" | jq '.' 2>/dev/null || echo "Could not connect to worker. Make sure the deployment was successful."

echo -e "\n${YELLOW}Next steps:${NC}"
echo "1. Update the URL in your sendMessage.js file if needed"
echo "2. Test the messaging system on your website"
echo "3. Set up proper CORS headers if needed"
echo "4. Consider setting up a Cloudflare route for a custom domain"
echo -e "\n${GREEN}Done!${NC}"
