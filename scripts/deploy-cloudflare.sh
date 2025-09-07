#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Setting up Cloudflare Worker and D1 Database${NC}"
echo "======================================"

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo -e "${YELLOW}Wrangler is not installed. Installing...${NC}"
    npm install -g wrangler
fi

# Login to Cloudflare (if not already logged in)
echo -e "${YELLOW}Logging in to Cloudflare (if not already logged in)...${NC}"
wrangler whoami || wrangler login

# Create D1 database (if it doesn't exist)
echo -e "${YELLOW}Creating D1 database 'messages-db'...${NC}"
wrangler d1 create messages-db 2>&1 | tee db_output.txt

# Extract database ID from output
DB_ID=$(grep -o 'database_id = "[^"]*"' db_output.txt | cut -d'"' -f2)

if [ -z "$DB_ID" ]; then
    echo -e "${YELLOW}Database may already exist. Please check your Cloudflare dashboard.${NC}"
    echo -e "${YELLOW}Enter your database ID manually (from wrangler.toml or dashboard):${NC}"
    read DB_ID
fi

# Update wrangler.toml with the database ID
echo -e "${YELLOW}Updating wrangler.toml with database ID: $DB_ID${NC}"
sed -i '' "s/database_id = \"\"/database_id = \"$DB_ID\"/" wrangler.toml

# Apply migrations
echo -e "${YELLOW}Applying SQL migrations...${NC}"
wrangler d1 execute messages-db --file=./migrations/0001_create_messages_table.sql

# Deploy the worker
echo -e "${YELLOW}Deploying Cloudflare Worker...${NC}"
wrangler deploy

# Get the worker URL
WORKER_URL=$(wrangler whoami | grep -o 'https://[^"]*\.workers\.dev')

if [ -z "$WORKER_URL" ]; then
    echo -e "${YELLOW}Could not automatically determine worker URL.${NC}"
    echo -e "${YELLOW}Enter your worker URL (from your Cloudflare dashboard):${NC}"
    read WORKER_URL
fi

# Update sendMessage.js with the worker URL
echo -e "${YELLOW}Updating sendMessage.js with worker URL: $WORKER_URL${NC}"
sed -i '' "s|https://d1-connect.your-account.workers.dev|$WORKER_URL|" src/scripts/sendMessage.js

echo -e "${GREEN}Setup complete!${NC}"
echo "======================================"
echo -e "Your Cloudflare Worker is deployed at: ${YELLOW}$WORKER_URL${NC}"
echo -e "You can now test your message section on your website."
echo -e "If you encounter any issues, check the Cloudflare dashboard and wrangler logs."

# Clean up
rm -f db_output.txt
